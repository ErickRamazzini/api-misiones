require('dotenv').config({ quiet: true });
const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: { encrypt: true, trustServerCertificate: true }
};

(async () => {
  try {
    const pool = await sql.connect(config);
    const r = await pool.request().query('SELECT MisionID, Nombre, Descripcion FROM Misiones');
    console.table(r.recordset);
    await pool.close();
  } catch (e) {
    console.error('Error:', e.message);
  }
})();