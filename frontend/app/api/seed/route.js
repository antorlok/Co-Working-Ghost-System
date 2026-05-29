import { NextResponse } from 'next/server';

export async function POST() {
  const USERS_API = process.env.USERS_SERVICE_URL || 'http://localhost:8000';
  const SPACES_API = process.env.SPACE_SERVICE_URL || 'http://localhost:8081';
  const RESERVATIONS_API = process.env.RESERVATIONS_SERVICE_URL || 'http://localhost:8003';
  const BILLING_API = process.env.BILLING_SERVICE_URL || 'http://localhost:8082';

  console.log('🌌 API Seed: Iniciando poblamiento de base de datos...');

  let adminToken = '';
  let memberToken = '';
  let memberId = 0;
  let adminId = 0;
  
  const logs = [];
  const log = (msg) => {
    console.log(msg);
    logs.push(msg);
  };

  // 1. REGISTRAR USUARIOS
  log('👤 1. Registrando usuarios de prueba...');
  
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
      log(`✅ Admin creado exitosamente: ${data.email}`);
      adminId = data.id;
    } else if (res.status === 409) {
      log('ℹ️ Admin ya existía en la base de datos.');
    } else {
      log(`❌ Error al registrar admin: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    log(`⚠️ Error de conexión para crear Admin: ${err.message}`);
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
      log(`✅ Miembro creado exitosamente: ${data.email}`);
      memberId = data.id;
    } else if (res.status === 409) {
      log('ℹ️ Miembro ya existía en la base de datos.');
    } else {
      log(`❌ Error al registrar miembro: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    log(`⚠️ Error de conexión para crear Miembro: ${err.message}`);
  }

  // 2. INICIAR SESIÓN PARA OBTENER TOKENS
  log('🔑 2. Iniciando sesión para extraer JWTs...');
  
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
      log('✅ JWT Admin obtenido correctamente.');
    } else {
      log(`❌ Error de login admin: ${JSON.stringify(data)}`);
      return NextResponse.json({ error: 'Fallo al iniciar sesión como Admin', logs }, { status: 500 });
    }
  } catch (err) {
    log(`❌ Falla de conexión en login admin: ${err.message}`);
    return NextResponse.json({ error: 'Falla de conexión en login admin', logs }, { status: 500 });
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
      const payload = JSON.parse(Buffer.from(memberToken.split('.')[1], 'base64').toString());
      memberId = parseInt(payload.id, 10);
      log(`✅ JWT Miembro obtenido correctamente. ID: ${memberId}`);
    } else {
      log(`❌ Error de login miembro: ${JSON.stringify(data)}`);
      return NextResponse.json({ error: 'Fallo al iniciar sesión como Miembro', logs }, { status: 500 });
    }
  } catch (err) {
    log(`❌ Falla de conexión en login miembro: ${err.message}`);
    return NextResponse.json({ error: 'Falla de conexión en login miembro', logs }, { status: 500 });
  }

  // 3. SEEDING DE ESPACIOS
  log('🏢 3. Creando espacios físicos en el catálogo (Go)...');
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
        log(`✅ Espacio creado: "${data.nombre}" (ID: ${data.id})`);
      } else {
        log(`ℹ️ Espacio "${esp.nombre}" ya existía o devolvió: ${res.status}`);
      }
    } catch (err) {
      log(`⚠️ Error de conexión para crear espacio "${esp.nombre}": ${err.message}`);
    }
  }

  // Obtener listado final de espacios creados
  let espacios = [];
  try {
    const res = await fetch(`${SPACES_API}/api/v1/spaces`);
    espacios = await res.json();
    log(`📊 Espacios disponibles en el sistema: ${espacios.length}`);
  } catch (err) {
    log(`❌ Error al obtener espacios: ${err.message}`);
  }

  if (espacios.length === 0) {
    return NextResponse.json({ error: 'No se pudieron crear espacios', logs }, { status: 500 });
  }

  // 4. CREAR RESERVACIONES
  log('📅 4. Agendando reservaciones de prueba (Rust)...');
  const orion = espacios.find(e => e.nombre === 'Sala de Juntas Orion') || espacios[0];
  const neo = espacios.find(e => e.nombre === 'Hot Desk Neo') || espacios[0];

  const reservasADiseñar = [
    {
      espacioId: orion.id,
      nombreEspacio: orion.nombre,
      fechaInicio: new Date(Date.now() + 24 * 60 * 60 * 1000 * 2).toISOString(),
      fechaFin: new Date(Date.now() + 24 * 60 * 60 * 1000 * 2 + 3 * 60 * 60 * 1000).toISOString(),
      prioridad: 1, // URGENTE
      notas: 'Presentación anual de avances de desarrollo ante inversionistas.'
    },
    {
      espacioId: neo.id,
      nombreEspacio: neo.nombre,
      fechaInicio: new Date(Date.now() + 24 * 60 * 60 * 1000 * 3).toISOString(),
      fechaFin: new Date(Date.now() + 24 * 60 * 60 * 1000 * 3 + 8 * 60 * 60 * 1000).toISOString(),
      prioridad: 2, // NORMAL
      notes: 'Jornada completa de programador independiente.'
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
        log(`✅ Reserva creada: ID ${data.id} para el espacio "${data.nombreEspacio || orion.nombre}"`);
        reservasCreadas.push(data);
      } else {
        log(`❌ Error al crear reserva: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      log(`⚠️ Error de conexión al crear reserva: ${err.message}`);
    }
  }

  // 5. GENERAR FACTURACIÓN
  log('💵 5. Generando facturas financieras y registrando pagos (Node.js)...');
  
  if (reservasCreadas.length === 0) {
    try {
      const res = await fetch(`${RESERVATIONS_API}/reservas`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        reservasCreadas = await res.json();
      }
    } catch (err) {
      log(`⚠️ Error al consultar reservas: ${err.message}`);
    }
  }

  if (reservasCreadas.length > 0) {
    const resA = reservasCreadas[0];
    const espA = espacios.find(e => e.id === resA.espacioId) || orion;

    // Generar Factura
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
        log(`✅ Factura generada automáticamente: ID ${data.id} (Total: $${data.total}, Estado: ${data.estado})`);
        facturaId = data.id;
      } else if (res.status === 409) {
        log('ℹ️ Esta reserva ya cuenta con una factura registrada.');
        const getRes = await fetch(`${BILLING_API}/api/v1/billing/facturas`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const facts = await getRes.json();
        const existingFact = facts.find(f => f.reserva_id === resA.id);
        if (existingFact) {
          facturaId = existingFact.id;
        }
      } else {
        log(`❌ Error al generar la factura: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      log(`⚠️ Error de conexión al emitir factura: ${err.message}`);
    }

    // Registrar pago
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
          log(`✅ Pago registrado para Factura ID ${facturaId} (Estado: ${data.estado}, Método: ${data.metodo_pago})`);
        } else {
          log(`❌ Error al pagar la factura: ${JSON.stringify(data)}`);
        }
      } catch (err) {
        log(`⚠️ Error al registrar pago: ${err.message}`);
      }
    }
  }

  log('🌌 ¡PROCESO DE SEMILLA COMPLETADO CON EXITO! 🌌');
  return NextResponse.json({ success: true, logs });
}
