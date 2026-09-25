// Modelo: tabla Estudiantes (maestro)
const { sql, getPool } = require('../config/db');
const estudianteMisionModel = require('./estudianteMisionModel');

// Estudiantes con sus misiones (una fila por cada estudiante-misión)
async function obtenerConMisiones() {
  const pool = await getPool();
  const r = await pool.request().query(`
    SELECT e.Carnet, e.Nombre, e.Correo,
           m.MisionID, m.Nombre AS Mision, em.Estado, em.FechaRegistro
    FROM Estudiantes e
    LEFT JOIN EstudianteMisiones em ON em.Carnet = e.Carnet
    LEFT JOIN Misiones m ON m.MisionID = em.MisionID
    ORDER BY e.Nombre, m.MisionID`);
  return r.recordset;
}

// Inserta o actualiza el estudiante dentro de la transacción
async function guardar(tx, { carnet, nombre, correo }) {
  const existe = await new sql.Request(tx)
    .input('carnet', sql.VarChar(25), carnet)
    .query('SELECT 1 AS X FROM Estudiantes WHERE Carnet = @carnet');

  const req = new sql.Request(tx)
    .input('carnet', sql.VarChar(25), carnet)
    .input('nombre', sql.NVarChar(150), nombre)
    .input('correo', sql.NVarChar(150), correo);

  if (existe.recordset.length) {
    await req.query('UPDATE Estudiantes SET Nombre = @nombre, Correo = @correo WHERE Carnet = @carnet');
    return 'actualizado';
  }
  await req.query('INSERT INTO Estudiantes (Carnet, Nombre, Correo) VALUES (@carnet, @nombre, @correo)');
  return 'insertado';
}

// Guarda maestro + detalle en una sola transacción: todo o nada
async function registrarConDetalle(maestro, detalle) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const accionEstudiante = await guardar(tx, maestro);

    const misiones = [];
    for (const d of detalle) {
      const accion = await estudianteMisionModel.guardarEstado(
        tx, maestro.carnet, d.misionId, d.estado
      );
      misiones.push({ misionId: d.misionId, estado: d.estado, accion });
    }

    await tx.commit();
    return { accionEstudiante, misiones };
  } catch (e) {
    try { await tx.rollback(); } catch (_) { /* ya revertida */ }
    throw e;
  }
}

module.exports = { obtenerConMisiones, registrarConDetalle };