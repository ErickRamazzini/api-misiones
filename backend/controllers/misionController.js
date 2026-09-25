// Controlador: catálogo de misiones
const misionModel = require('../models/misionModel');

// GET /api/misiones
async function listar(req, res) {
  try {
    const misiones = await misionModel.obtenerTodas();
    res.json(misiones);
  } catch (e) {
    res.status(500).json({
      error: 'Error al consultar el catálogo de misiones',
      detalle: e.message
    });
  }
}

module.exports = { listar };