require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { inicializarBD } = require('./db');
const facturasRouter = require('./routes/facturas');
const reportesRouter = require('./routes/reportes');

const app = express();
const PORT = process.env.PORT || 8082;

// Middleware global
app.use(cors());
app.use(express.json());

// Endpoint de Health Check público
app.get('/health', (req, res) => {
  res.status(200).json({
    servicio: 'billing-service',
    estado: 'funcionando',
    puerto: PORT,
  });
});

// Registrar enrutadores bajo /api/v1/billing
app.use('/api/v1/billing/facturas', facturasRouter);
app.use('/api/v1/billing/reportes', reportesRouter);

// Manejador global de rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Manejador global de excepciones
app.use((err, req, res, next) => {
  console.error('Error no controlado en la aplicación: ', err);
  res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor' });
});

// Inicializar la base de datos y arrancar el servidor HTTP
async function startServer() {
  try {
    // Asegurar que la tabla "invoices" exista antes de empezar a recibir solicitudes
    await inicializarBD();
    
    app.listen(PORT, () => {
      console.log(`Microservicio billing-service corriendo exitosamente en el puerto ${PORT}`);
    });
  } catch (err) {
    console.error('Fallo crítico al iniciar el servidor: ', err);
    process.exit(1);
  }
}

startServer();
