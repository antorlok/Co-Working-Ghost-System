// Cliente de API centralizado para comunicarse con los microservicios mediante proxy rewrites

const BASE_URL = '/api';

/**
 * Guarda el token JWT en localStorage
 */
export function saveToken(token) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('coworking_token', token);
  }
}

/**
 * Obtiene el token JWT desde localStorage
 */
export function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('coworking_token');
  }
  return null;
}

/**
 * Elimina el token JWT de localStorage (Cerrar sesión)
 */
export function removeToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('coworking_token');
  }
}

/**
 * Decodifica un token JWT de manera local y pura (Base64url a JSON)
 */
export function decodeJWT(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error al decodificar el JWT:', error);
    return null;
  }
}

/**
 * Obtiene los detalles del usuario actual decodificados del token activo
 */
export function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  
  const payload = decodeJWT(token);
  if (!payload) return null;
  
  // Validar expiración si el token tiene 'exp'
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    removeToken();
    return null;
  }
  
  return {
    email: payload.sub,
    id: parseInt(payload.id, 10),
    role: payload.role,
  };
}

/**
 * Realiza una petición fetch inyectando automáticamente cabeceras y token de autorización
 */
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.detail || 'Ocurrió un error en la solicitud');
  }

  return data;
}

// ==========================================
// SERVICIO DE USUARIOS (FASTAPI)
// ==========================================
export const authApi = {
  login: async (email, password) => {
    const result = await apiFetch('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result && result.access_token) {
      saveToken(result.access_token);
    }
    return result;
  },
  
  register: async (email, password, role = 'member', nombre = '') => {
    return apiFetch('/users/', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        role,
        name: nombre || email.split('@')[0],
        is_active: true
      }),
    });
  },

  getUsers: async () => {
    return apiFetch('/users/');
  },

  deleteUser: async (id) => {
    return apiFetch(`/users/${id}`, {
      method: 'DELETE',
    });
  }
};

// ==========================================
// SERVICIO DE ESPACIOS (GOLANG)
// ==========================================
export const spacesApi = {
  getAll: async () => {
    return apiFetch('/spaces');
  },

  search: async (query) => {
    const params = new URLSearchParams(query).toString();
    return apiFetch(`/spaces/buscar?${params}`);
  },

  getById: async (id) => {
    return apiFetch(`/spaces/${id}`);
  },

  create: async (spaceData) => {
    return apiFetch('/spaces', {
      method: 'POST',
      body: JSON.stringify({
        nombre: spaceData.nombre,
        descripcion: spaceData.descripcion,
        capacidad: parseInt(spaceData.capacidad, 10),
        precio_por_hora: parseFloat(spaceData.precio_por_hora),
        disponibilidad: spaceData.disponibilidad !== undefined ? spaceData.disponibilidad : true
      }),
    });
  },

  update: async (id, spaceData) => {
    return apiFetch(`/spaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        nombre: spaceData.nombre,
        descripcion: spaceData.descripcion,
        capacidad: parseInt(spaceData.capacidad, 10),
        precio_por_hora: parseFloat(spaceData.precio_por_hora),
        disponibilidad: spaceData.disponibilidad !== undefined ? spaceData.disponibilidad : true
      }),
    });
  },

  delete: async (id) => {
    return apiFetch(`/spaces/${id}`, {
      method: 'DELETE',
    });
  }
};

// ==========================================
// SERVICIO DE RESERVACIONES (RUST)
// ==========================================
export const reservationsApi = {
  getAll: async () => {
    return apiFetch('/reservations/reservas');
  },

  getMy: async () => {
    return apiFetch('/reservations/reservas/mis-reservas');
  },

  create: async (reservaData) => {
    return apiFetch('/reservations/reservas', {
      method: 'POST',
      body: JSON.stringify({
        espacioId: parseInt(reservaData.espacioId, 10),
        nombreEspacio: reservaData.nombreEspacio || null,
        fechaInicio: new Date(reservaData.fechaInicio).toISOString(),
        fechaFin: new Date(reservaData.fechaFin).toISOString(),
        prioridad: parseInt(reservaData.prioridad || 2, 10),
        notas: reservaData.notas || null
      }),
    });
  },

  cancel: async (id) => {
    return apiFetch(`/reservations/reservas/${id}`, {
      method: 'DELETE',
    });
  },

  getQueue: async () => {
    return apiFetch('/reservations/cola');
  },

  confirmNextQueue: async () => {
    return apiFetch('/reservations/cola/confirmar', {
      method: 'POST',
    });
  }
};

// ==========================================
// SERVICIO DE FACTURACIÓN Y REPORTES (NODE.JS)
// ==========================================
export const billingApi = {
  getInvoices: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.usuarioId) params.append('usuario_id', filters.usuarioId);
    if (filters.ordenar) params.append('ordenar', filters.ordenar);
    if (filters.direccion) params.append('direccion', filters.direccion);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/billing/facturas${query}`);
  },

  getInvoiceById: async (id) => {
    return apiFetch(`/billing/facturas/${id}`);
  },

  createInvoice: async (invoiceData) => {
    return apiFetch('/billing/facturas', {
      method: 'POST',
      body: JSON.stringify({
        reservaId: parseInt(invoiceData.reservaId, 10),
        usuarioId: parseInt(invoiceData.usuarioId, 10),
        espacioId: parseInt(invoiceData.espacioId, 10),
        nombreEspacio: invoiceData.nombreEspacio,
        fechaInicio: invoiceData.fechaInicio,
        fechaFin: invoiceData.fechaFin,
        precioHora: parseFloat(invoiceData.precioHora),
      }),
    });
  },

  payInvoice: async (id, metodoPago = 'efectivo') => {
    return apiFetch(`/billing/facturas/${id}/pagar`, {
      method: 'PUT',
      body: JSON.stringify({ metodo_pago: metodoPago }),
    });
  },

  getSummaryReport: async () => {
    return apiFetch('/billing/reportes/resumen');
  },

  getReportBySpace: async () => {
    return apiFetch('/billing/reportes/por-espacio');
  },

  getReportByUser: async () => {
    return apiFetch('/billing/reportes/por-usuario');
  },

  getMonthlyReport: async () => {
    return apiFetch('/billing/reportes/ingresos-mensuales');
  }
};
