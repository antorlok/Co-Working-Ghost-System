const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verificarJWT, soloAdmin } = require('../middleware/auth');
const { calcularFactura, ordenarFacturas } = require('../algorithm/reportes');

// Todas las rutas de facturación requieren autenticación JWT previa
router.use(verificarJWT);

/**
 * POST /api/v1/billing/facturas
 * Crea una nueva factura asociada a una reserva completada (Solo Admin)
 */
router.post('/', soloAdmin, async (req, res) => {
  const {
    reservaId,
    usuarioId,
    espacioId,
    nombreEspacio,
    fechaInicio,
    fechaFin,
    precioHora,
  } = req.body;

  // Validación de campos obligatorios
  if (!reservaId || !usuarioId || !espacioId || !nombreEspacio || !fechaInicio || !fechaFin || !precioHora) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para generar la factura' });
  }

  try {
    // Calcular automáticamente duración, subtotal, IVA y total con el algoritmo O(1)
    const { horas, subtotal, impuesto, total } = calcularFactura({
      fechaInicio,
      fechaFin,
      precioHora,
    });

    const queryText = `
      INSERT INTO invoices 
        (reserva_id, usuario_id, espacio_id, nombre_espacio, fecha_inicio, fecha_fin, horas, precio_hora, subtotal, impuesto, total, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pendiente')
      RETURNING *;
    `;
    const values = [reservaId, usuarioId, espacioId, nombreEspacio, fechaInicio, fechaFin, horas, precioHora, subtotal, impuesto, total];

    const result = await pool.query(queryText, values);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    // Controlar violación de restricción UNIQUE (Código postgres 23505)
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Esta reserva ya cuenta con una factura generada en el sistema' });
    }
    return res.status(500).json({ error: 'Error interno al registrar la factura: ' + err.message });
  }
});

/**
 * GET /api/v1/billing/facturas
 * Obtiene el listado de facturas.
 * - Los miembros normales solo ven sus propias facturas.
 * - Los administradores pueden ver todas y filtrar por usuario_id.
 */
router.get('/', async (req, res) => {
  const isAdmin = req.usuarioRole === 'admin';
  const filterUsuario = req.query.usuario_id;
  const ordenarPor = req.query.ordenar || 'creado_en';
  const direccion = req.query.direccion || 'desc';

  let queryText = 'SELECT * FROM invoices';
  let values = [];

  try {
    if (!isAdmin) {
      // Filtrar forzosamente por el ID de usuario del JWT para no-admins (dueño de los datos)
      queryText += ' WHERE usuario_id = $1';
      values.push(req.usuarioId);
    } else if (filterUsuario) {
      // Si es admin y se solicita filtrar por usuario
      queryText += ' WHERE usuario_id = $1';
      values.push(parseInt(filterUsuario, 10));
    }

    const result = await pool.query(queryText, values);
    
    // Aplicar algoritmo de ordenamiento O(n log n)
    const facturasOrdenadas = ordenarFacturas(result.rows, ordenarPor, direccion);

    return res.status(200).json(facturasOrdenadas);
  } catch (err) {
    return res.status(500).json({ error: 'Error al consultar las facturas: ' + err.message });
  }
});

/**
 * GET /api/v1/billing/facturas/:id
 * Obtiene el detalle de una factura específica por su ID.
 * - Los miembros normales solo acceden si la factura les pertenece.
 */
router.get('/:id', async (req, res) => {
  const facturaId = parseInt(req.params.id, 10);
  if (isNaN(facturaId)) {
    return res.status(400).json({ error: 'ID de factura inválido' });
  }

  try {
    const result = await pool.query('SELECT * FROM invoices WHERE id = $1', [facturaId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'La factura solicitada no existe' });
    }

    const factura = result.rows[0];

    // Restringir visualización cruzada a miembros no administradores
    if (req.usuarioRole !== 'admin' && factura.usuario_id !== req.usuarioId) {
      return res.status(403).json({ error: 'No tienes privilegios para visualizar esta factura' });
    }

    return res.status(200).json(factura);
  } catch (err) {
    return res.status(500).json({ error: 'Error al buscar la factura: ' + err.message });
  }
});

/**
 * PUT /api/v1/billing/facturas/:id/pagar
 * Marca una factura como pagada (Solo Admin)
 */
router.put('/:id/pagar', soloAdmin, async (req, res) => {
  const facturaId = parseInt(req.params.id, 10);
  const metodoPago = req.body.metodo_pago || 'efectivo';

  if (isNaN(facturaId)) {
    return res.status(400).json({ error: 'ID de factura inválido' });
  }

  try {
    // Verificar si la factura existe
    const checkResult = await pool.query('SELECT * FROM invoices WHERE id = $1', [facturaId]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'La factura solicitada no existe para registrar el pago' });
    }

    // Actualizar estado a pagado y definir método de pago
    const updateQuery = `
      UPDATE invoices 
      SET estado = 'pagado', metodo_pago = $1 
      WHERE id = $2 
      RETURNING *;
    `;
    const result = await pool.query(updateQuery, [metodoPago, facturaId]);

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Error al registrar el pago de la factura: ' + err.message });
  }
});

module.exports = router;
