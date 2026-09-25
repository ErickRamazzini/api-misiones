// Modelo: tabla Misiones (catálogo)
const { getPool } = require('../config/db');

// Devuelve todas las misiones (para GET /api/misiones)
async function obtenerTodas() {
  const pool = await getPool();
  const r = await pool.request()
    .query('SELECT MisionID, Nombre, Descripcion FROM Misiones ORDER BY MisionID');
  return r.recordset;
}

// Devuelve solo los IDs [1,2,3,4,5] (para validar el POST)
async function obtenerIds() {
  const pool = await getPool();
  const r = await pool.request().query('SELECT MisionID FROM Misiones');
  return r.recordset.map(m => m.MisionID);
}

// Devuelve cuántas misiones hay (para calcular el % de avance)
async function contar() {
  const pool = await getPool();
  const r = await pool.request().query('SELECT COUNT(*) AS Total FROM Misiones');
  return r.recordset[0].Total;
}

module.exports = { obtenerTodas, obtenerIds, contar };