/**
 * Script de Semilla (Seed) E2E para el Sistema de Coworking
 * Ejecuta llamadas directas a las APIs nativas de los microservicios en localhost.
 * 
 * Ejecución: node scripts/seed.js
 */

const USERS_API = 'http://localhost:8000';
const SPACES_API = 'http://localhost:8081';
const RESERVATIONS_API = 'http://localhost:8003';
const BILLING_API = 'http://localhost:8082';

async function run() {
  console.log('🌌 Iniciando poblamiento de base de datos del Coworking...');

  let adminToken = '';
  let memberToken = '';
  let memberId = 0;
  let adminId = 0;

  // 1. REGISTRAR USUARIOS
  console.log('\n👤 1. Registrando usuarios de prueba...');
  
  // Registrar Admin
  try {
    const res = await fetch(`${USERS_API}/usuarios/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@coworking.com',
        password: 'AdminPassword123!',
        role: 'admin',
        name: 'Admin Principal',
        is_active: true
      })
    });
    const data = await res.json();
    if (res.ok) {
      console.log('✅ Admin creado exitosamente:', data.email);
      adminId = data.id;
    } else if (res.status === 409) {
      console.log('ℹ️ Admin ya existía en la base de datos.');
    } else {
      console.log('❌ Error al registrar admin:', data);
    }
  } catch (err) {
    console.log('⚠️ Error de conexión a users-service para crear Admin:', err.message);
  }

  // Registrar Member
  try {
    const res = await fetch(`${USERS_API}/usuarios/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'member@coworking.com',
        password: 'MemberPassword123!',
        role: 'member',
        name: 'Carlos Miembro',
        is_active: true
      })
    });
    const data = await res.json();
    if (res.ok) {
      console.log('✅ Miembro creado exitosamente:', data.email);
      memberId = data.id;
    } else if (res.status === 409) {
      console.log('ℹ️ Miembro ya existía en la base de datos.');
    } else {
      console.log('❌ Error al registrar miembro:', data);
    }
  } catch (err) {
    console.log('⚠️ Error de conexión a users-service para crear Miembro:', err.message);
  }

  // 2. INICIAR SESIÓN PARA OBTENER TOKENS
  console.log('\n🔑 2. Iniciando sesión para extraer JWTs...');
  
  // Login Admin
  try {
    const res = await fetch(`${USERS_API}/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@coworking.com',
        password: 'AdminPassword123!'
      })
    });
    const data = await res.json();
    if (res.ok) {
      adminToken = data.access_token;
      console.log('✅ JWT Admin obtenido correctamente.');
    } else {
      console.error('❌ Error de login admin:', data);
      return;
    }
  } catch (err) {
    console.error('❌ Falla crítica de conexión a users-service:', err.message);
    return;
  }

  // Login Member
  try {
    const res = await fetch(`${USERS_API}/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'member@coworking.com',
        password: 'MemberPassword123!'
      })
    });
    const data = await res.json();
    if (res.ok) {
      memberToken = data.access_token;
      // Decodificar id de miembro localmente
      const payload = JSON.parse(Buffer.from(memberToken.split('.')[1], 'base64').toString());
      memberId = parseInt(payload.id, 10);
      console.log('✅ JWT Miembro obtenido correctamente. ID de Miembro:', memberId);
    } else {
      console.error('❌ Error de login miembro:', data);
      return;
    }
  } catch (err) {
    console.error('❌ Falla crítica de conexión a users-service:', err.message);
    return;
  }

  // 3. SEEDING DE ESPACIOS (GOLANG SPACE-SERVICE)
  console.log('\n🏢 3. Creando espacios físicos en el catálogo (Go)...');
  const espaciosADiseñar = [
    { nombre: 'Sala de Juntas Orion', descripcion: 'Sala equipada con Smart TV 4K, pizarra interactiva y climatización inteligente.', capacidad: 12, precio_por_hora: 25.0 },
    { nombre: 'Hot Desk Neo', descripcion: 'Espacio de trabajo compartido súper dinámico, luz natural, ideal para nómadas digitales.', capacidad: 1, precio_por_hora: 5.0 },
    { nombre: 'Oficina Ejecutiva Apex', descripcion: 'Oficina cerrada premium con aislamiento acústico completo para equipos pequeños.', capacidad: 4, precio_por_hora: 45.0 },
    { nombre: 'Sala de Ensayos Aurora', descripcion: 'Estudio con tratamiento acústico y tomas de alta fidelidad, excelente para podcasting.', capacidad: 8, precio_por_hora: 35.0 }
  ];

  for (const esp of espaciosADiseñar) {
    try {
      const res = await fetch(`${SPACES_API}/api/v1/spaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(esp)
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ Espacio creado: "${data.nombre}" (ID: ${data.id})`);
      } else if (res.status === 400 || res.status === 409 || res.status === 500) {
        // En Go GORM, un error UNIQUE devuelve un 500 o 409 depending en la estructura
        console.log(`ℹ️ Espacio "${esp.nombre}" ya existía en la base de datos.`);
      } else {
        console.log(`❌ Error al crear espacio "${esp.nombre}":`, data);
      }
    } catch (err) {
      console.log(`⚠️ Error de conexión a space-service para "${esp.nombre}":`, err.message);
    }
  }

  // Obtener listado final de espacios creados
  let espacios = [];
  try {
    const res = await fetch(`${SPACES_API}/api/v1/spaces`);
    espacios = await res.json();
    console.log(`📊 Espacios disponibles en el sistema: ${espacios.length}`);
  } catch (err) {
    console.error('❌ Falla crítica de conexión al obtener espacios de space-service:', err.message);
    return;
  }

  if (espacios.length === 0) {
    console.error('❌ No hay espacios disponibles para realizar reservas.');
    return;
  }

  // 4. CREAR RESERVACIONES (RUST RESERVATIONS-SERVICE)
  console.log('\n📅 4. Agendando reservaciones de prueba (Rust)...');
  const orion = espacios.find(e => e.nombre === 'Sala de Juntas Orion') || espacios[0];
  const neo = espacios.find(e => e.nombre === 'Hot Desk Neo') || espacios[0];

  const reservasADiseñar = [
    {
      espacioId: orion.id,
      nombreEspacio: orion.nombre,
      fechaInicio: new Date(Date.now() + 24 * 60 * 60 * 1000 * 2).toISOString(), // +2 días en el futuro
      fechaFin: new Date(Date.now() + 24 * 60 * 60 * 1000 * 2 + 3 * 60 * 60 * 1000).toISOString(), // 3 horas de duración
      prioridad: 1, // URGENTE
      notas: 'Presentación anual de avances de desarrollo ante inversionistas.'
    },
    {
      espacioId: neo.id,
      nombreEspacio: neo.nombre,
      fechaInicio: new Date(Date.now() + 24 * 60 * 60 * 1000 * 3).toISOString(), // +3 días en el futuro
      fechaFin: new Date(Date.now() + 24 * 60 * 60 * 1000 * 3 + 8 * 60 * 60 * 1000).toISOString(), // 8 horas de duración
      prioridad: 2, // NORMAL
      notas: 'Jornada completa de programador independiente.'
    }
  ];

  let reservasCreadas = [];
  for (const resData of reservasADiseñar) {
    try {
      const res = await fetch(`${RESERVATIONS_API}/reservas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${memberToken}`
        },
        body: JSON.stringify(resData)
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ Reserva creada: ID ${data.id} para el espacio "${data.nombreEspacio || orion.nombre}"`);
        reservasCreadas.push(data);
      } else {
        console.log(`❌ Error al crear reserva:`, data);
      }
    } catch (err) {
      console.log(`⚠️ Error de conexión a reservations-service:`, err.message);
    }
  }

  // 5. GENERAR FACTURACIÓN (NODE.JS BILLING-SERVICE)
  console.log('\n💵 5. Generando facturas financieras y registrando pagos (Node.js)...');
  
  if (reservasCreadas.length === 0) {
    // Si falló el microservicio de reservas, intentamos consultar si hay reservas existentes
    try {
      const res = await fetch(`${RESERVATIONS_API}/reservas`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        reservasCreadas = await res.json();
      }
    } catch (err) {
      console.log('⚠️ Error al consultar reservas existentes:', err.message);
    }
  }

  if (reservasCreadas.length === 0) {
    console.log('ℹ️ No hay reservas cargadas para facturar. Finalizando.');
    console.log('🌌 ¡Semilla completada parcialmente con éxito!');
    return;
  }

  const resA = reservasCreadas[0];
  const espA = espacios.find(e => e.id === resA.espacioId) || orion;

  // Generar Factura para la primera reserva
  let facturaId = 0;
  try {
    const res = await fetch(`${BILLING_API}/api/v1/billing/facturas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        reservaId: resA.id,
        usuarioId: memberId || resA.usuarioId,
        espacioId: resA.espacioId,
        nombreEspacio: espA.nombre,
        fechaInicio: resA.fechaInicio,
        fechaFin: resA.fechaFin,
        precioHora: espA.precio_por_hora
      })
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`✅ Factura generada automáticamente: ID ${data.id} (Total: $${data.total}, Estado: ${data.estado})`);
      facturaId = data.id;
    } else if (res.status === 409) {
      console.log('ℹ️ Esta reserva ya cuenta con una factura registrada.');
      // Intentar obtener la factura existente
      const getRes = await fetch(`${BILLING_API}/api/v1/billing/facturas`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const facts = await getRes.json();
      const existingFact = facts.find(f => f.reserva_id === resA.id);
      if (existingFact) {
        facturaId = existingFact.id;
      }
    } else {
      console.log('❌ Error al generar la factura:', data);
    }
  } catch (err) {
    console.log('⚠️ Error de conexión a billing-service para emitir factura:', err.message);
  }

  // Registrar pago para esa factura
  if (facturaId > 0) {
    try {
      const res = await fetch(`${BILLING_API}/api/v1/billing/facturas/${facturaId}/pagar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ metodo_pago: 'tarjeta' })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ Pago registrado para Factura ID ${facturaId} (Estado: ${data.estado}, Método: ${data.metodo_pago})`);
      } else {
        console.log('❌ Error al pagar la factura:', data);
      }
    } catch (err) {
      console.log('⚠️ Error de conexión a billing-service para registrar pago:', err.message);
    }
  }

  console.log('\n✨ =======================================================');
  console.log('🌌 ¡PROCESO DE SEMILLA COMPLETADO CON EXITO! 🌌');
  console.log('==========================================================');
  console.log('Credenciales de Acceso Creadas:');
  console.log('👤 Miembro: member@coworking.com   / Contraseña: MemberPassword123!');
  console.log('👑 Admin:   admin@coworking.com    / Contraseña: AdminPassword123!');
  console.log('==========================================================\n');
}

run();
