// Controlador: listado de estudiantes con su avance
const estudianteModel = require('../models/estudianteModel');
const misionModel = require('../models/misionModel');

// GET /api/estudiantes
async function listar(req, res) {
  try {
    // Pedir las dos cosas al mismo tiempo
    const [filas, total] = await Promise.all([
      estudianteModel.obtenerConMisiones(),
      misionModel.contar()
    ]);

    // Agrupar filas por estudiante (maestro) con su detalle
    const mapa = new Map();
    for (const f of filas) {
      if (!mapa.has(f.Carnet)) {
        mapa.set(f.Carnet, {
          carnet: f.Carnet,
          nombre: f.Nombre,
          correo: f.Correo,
          misiones: []
        });
      }
      if (f.MisionID !== null) {
        mapa.get(f.Carnet).misiones.push({
          misionId: f.MisionID,
          nombre: f.Mision,
          estado: f.Estado,
          fechaRegistro: f.FechaRegistro
        });
      }
    }

    // Calcular el avance de cada estudiante
    const estudiantes = [...mapa.values()].map(est => {
      const completadas = est.misiones.filter(m => m.estado).length;
      return {
        ...est,
        completadas,
        pendientes: total - completadas,
        totalMisiones: total,
        porcentaje: total ? Math.round((completadas / total) * 100) : 0
      };
    });

    res.json(estudiantes);
  } catch (e) {
    res.status(500).json({
      error: 'Error al consultar estudiantes',
      detalle: e.message
    });
  }
}

module.exports = { listar };