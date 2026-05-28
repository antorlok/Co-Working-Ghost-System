const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { verificarJWT, soloAdmin } = require('../middleware/auth');
const {
  agruparPorEspacio,
  agruparPorUsuario,
  ingresosPorMes,
} = require('../algorithm/reportes');

// Todas las rutas de reportes requieren autenticación y rol de administrador (RBAC)
router.use(verificarJWT);
router.use(soloAdmin);

/**
 * GET /api/v1/billing/reportes/resumen
 * Retorna un panel resumen del estado financiero global del coworking
 */
router.get('/resumen', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invoices');
    const facturas = result.rows;

    const totalFacturas = facturas.length;
    const totalIngresos = facturas.reduce((sum, f) => sum + parseFloat(f.total), 0);
    
    // Contar facturas emitidas hoy (comparando fecha local)
    const hoy = new Date().toDateString();
    const facturasHoy = facturas.filter(f => new Date(f.creado_en).toDateString() === hoy).length;
    
    // Contar facturas con pago pendiente
    const pendientes = facturas.filter(f => f.estado === 'pendiente').length;

    return res.status(200).json({
      total_facturas: totalFacturas,
      total_ingresos: Math.round(totalIngresos * 100) / 100,
      facturas_hoy: facturasHoy,
      pendientes_pago: pendientes,
      promedio_factura: totalFacturas > 0 ? Math.round((totalIngresos / totalFacturas) * 100) / 100 : 0,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error al generar el resumen de facturación: ' + err.message });
  }
});

/**
 * GET /api/v1/billing/reportes/por-espacio
 * Retorna ingresos consolidados agrupados por espacio físico en complejidad O(n)
 */
router.get('/por-espacio', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invoices');
    const reporte = agruparPorEspacio(result.rows);
    return res.status(200).json(reporte);
  } catch (err) {
    return res.status(500).json({ error: 'Error al agrupar ingresos por espacio: ' + err.message });
  }
});

/**
 * GET /api/v1/billing/reportes/por-usuario
 * Retorna ingresos consolidados agrupados por usuario en complejidad O(n)
 */
router.get('/por-usuario', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invoices');
    const reporte = agruparPorUsuario(result.rows);
    return res.status(200).json(reporte);
  } catch (err) {
    return res.status(500).json({ error: 'Error al agrupar ingresos por usuario: ' + err.message });
  }
});

/**
 * GET /api/v1/billing/reportes/ingresos-mensuales
 * Retorna ingresos mensuales consolidados ordenados cronológicamente
 */
router.get('/ingresos-mensuales', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invoices');
    const reporte = ingresosPorMes(result.rows);
    return res.status(200).json(reporte);
  } catch (err) {
    return res.status(500).json({ error: 'Error al generar historial de ingresos mensuales: ' + err.message });
  }
});

module.exports = router;
