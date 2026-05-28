const { Pool } = require('pg');
require('dotenv').config();

const dbURL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/coworking_db';

// Adaptar formato SQLAlchemy (Python) a formato estándar de conexión de Postgres si es necesario
const connectionString = dbURL.startsWith('postgresql+psycopg2://')
  ? dbURL.replace('postgresql+psycopg2://', 'postgres://')
  : dbURL;

const pool = new Pool({
  connectionString,
});

async function inicializarBD() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS invoices (
      id              SERIAL PRIMARY KEY,
      reserva_id      INTEGER NOT NULL UNIQUE,
      usuario_id      INTEGER NOT NULL,
      espacio_id      INTEGER NOT NULL,
      nombre_espacio  VARCHAR(100) NOT NULL,
      fecha_inicio    TIMESTAMP NOT NULL,
      fecha_fin       TIMESTAMP NOT NULL,
      horas           DECIMAL(5,2) NOT NULL,
      precio_hora     DECIMAL(10,2) NOT NULL,
      subtotal        DECIMAL(10,2) NOT NULL,
      impuesto        DECIMAL(10,2) NOT NULL,
      total           DECIMAL(10,2) NOT NULL,
      metodo_pago     VARCHAR(50) DEFAULT 'efectivo',
      estado          VARCHAR(30) DEFAULT 'pendiente',
      creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    console.log('Inicializando tablas en la base de datos compartida...');
    await pool.query(queryText);
    console.log('Tabla "invoices" verificada/creada exitosamente.');
  } catch (err) {
    console.error('Error al inicializar la base de datos: ', err);
    throw err;
  }
}

module.exports = {
  pool,
  inicializarBD,
};
