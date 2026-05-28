/**
 * Calcula las horas totales, subtotal, impuesto (16% IVA) y total facturado.
 * Complejidad: O(1)
 */
function calcularFactura({ fechaInicio, fechaFin, precioHora }) {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    throw new Error('Fechas inválidas proporcionadas');
  }

  const diffMs = fin - inicio;
  if (diffMs < 0) {
    throw new Error('La fecha de fin no puede ser anterior a la de inicio');
  }

  // Convertir milisegundos a horas
  let horas = diffMs / (1000 * 60 * 60);
  horas = Math.round(horas * 100) / 100; // Redondear a 2 decimales

  const subtotal = Math.round((horas * precioHora) * 100) / 100;
  const impuesto = Math.round((subtotal * 0.16) * 100) / 100; // IVA 16%
  const total = Math.round((subtotal + impuesto) * 100) / 100;

  return {
    horas,
    subtotal,
    impuesto,
    total,
  };
}

/**
 * Agrupa facturas y acumula totales por espacio.
 * Complejidad: O(n) - Una sola pasada sobre la lista
 * Utiliza un Hash Map en memoria para acceso y acumulación O(1)
 */
function agruparPorEspacio(facturas) {
  const grupos = {}; // Hash map: espacio_id -> { datos agrupados }

  for (const f of facturas) {
    const key = f.espacio_id;
    if (!grupos[key]) {
      grupos[key] = {
        espacio_id: f.espacio_id,
        nombre_espacio: f.nombre_espacio || 'Desconocido',
        total_facturas: 0,
        total_horas: 0,
        total_ingresos: 0,
      };
    }
    grupos[key].total_facturas++;
    grupos[key].total_horas += parseFloat(f.horas) || 0;
    grupos[key].total_ingresos += parseFloat(f.total) || 0;
  }

  // Mapear el objeto a un arreglo ordenado por ingresos y redondear
  return Object.values(grupos).map(g => ({
    ...g,
    total_horas: Math.round(g.total_horas * 100) / 100,
    total_ingresos: Math.round(g.total_ingresos * 100) / 100,
    promedio_factura: g.total_facturas > 0 ? Math.round((g.total_ingresos / g.total_facturas) * 100) / 100 : 0,
  }));
}

/**
 * Agrupa facturas y acumula totales por usuario.
 * Complejidad: O(n) - Una sola pasada
 */
function agruparPorUsuario(facturas) {
  const grupos = {}; // Hash map: usuario_id -> { datos }

  for (const f of facturas) {
    const key = f.usuario_id;
    if (!grupos[key]) {
      grupos[key] = {
        usuario_id: f.usuario_id,
        total_facturas: 0,
        total_horas: 0,
        total_ingresos: 0,
      };
    }
    grupos[key].total_facturas++;
    grupos[key].total_horas += parseFloat(f.horas) || 0;
    grupos[key].total_ingresos += parseFloat(f.total) || 0;
  }

  return Object.values(grupos).map(g => ({
    ...g,
    total_horas: Math.round(g.total_horas * 100) / 100,
    total_ingresos: Math.round(g.total_ingresos * 100) / 100,
    promedio_factura: g.total_facturas > 0 ? Math.round((g.total_ingresos / g.total_facturas) * 100) / 100 : 0,
  }));
}

/**
 * Agrupa facturas por mes basándose en su fecha de creación.
 * Complejidad: O(n)
 */
function ingresosPorMes(facturas) {
  const grupos = {}; // Hash map: YYYY-MM -> ingresos

  for (const f of facturas) {
    const fecha = new Date(f.creado_en);
    if (isNaN(fecha.getTime())) continue;

    const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    if (!grupos[mesKey]) {
      grupos[mesKey] = {
        mes: mesKey,
        total_ingresos: 0,
        total_facturas: 0,
      };
    }
    grupos[mesKey].total_ingresos += parseFloat(f.total) || 0;
    grupos[mesKey].total_facturas++;
  }

  return Object.values(grupos)
    .map(g => ({
      ...g,
      total_ingresos: Math.round(g.total_ingresos * 100) / 100,
    }))
    .sort((a, b) => a.mes.localeCompare(b.mes)); // Ordenar cronológicamente
}

/**
 * Ordena facturas según un criterio dado (por defecto 'total').
 * Complejidad: O(n log n) debido al método Array.prototype.sort()
 */
function ordenarFacturas(facturas, campo = 'total', direccion = 'desc') {
  const copia = [...facturas];
  
  copia.sort((a, b) => {
    let va = parseFloat(a[campo]);
    let vb = parseFloat(b[campo]);

    // Si los campos son strings o fechas
    if (isNaN(va) || isNaN(vb)) {
      va = a[campo] || '';
      vb = b[campo] || '';
      if (typeof va === 'string') {
        return direccion === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
    }

    return direccion === 'asc' ? va - vb : vb - va;
  });

  return copia;
}

module.exports = {
  calcularFactura,
  agruparPorEspacio,
  agruparPorUsuario,
  ingresosPorMes,
  ordenarFacturas,
};
