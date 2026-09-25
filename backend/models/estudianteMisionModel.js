// Modelo: tabla EstudianteMisiones (detalle)
const { sql } = require('../config/db');

// Actualiza el estado si la pareja (Carnet, MisionID) ya existe; si no, la inserta.
// Recibe la transacción (tx) para que todo se guarde junto.
async function guardarEstado(tx, carnet, misionId, estado) {
  // 1. Intentar actualizar
  const upd = await new sql.Request(tx)
    .input('carnet', sql.VarChar(25), carnet)
    .input('mision', sql.Int, misionId)
    .input('estado', sql.Bit, estado)
    .query(`UPDATE EstudianteMisiones
            SET Estado = @estado
            WHERE Carnet = @carnet AND MisionID = @mision`);

  if (upd.rowsAffected[0] > 0) return 'actualizada';

  // 2. Si no existía, insertar
  await new sql.Request(tx)
    .input('carnet', sql.VarChar(25), carnet)
    .input('mision', sql.Int, misionId)
    .input('estado', sql.Bit, estado)
    .query(`INSERT INTO EstudianteMisiones (Carnet, MisionID, Estado)
            VALUES (@carnet, @mision, @estado)`);
  return 'insertada';
}

module.exports = { guardarEstado };