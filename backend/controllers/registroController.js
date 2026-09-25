// Controlador: POST /api/registro (maestro-detalle)
const estudianteModel = require('../models/estudianteModel');
const misionModel = require('../models/misionModel');

// Valida el formato del JSON recibido; devuelve una lista de errores
function validar(maestro, detalle) {
  const errores = [];

  if (!maestro || typeof maestro !== 'object') {
    errores.push('Falta el objeto "maestro"');
  } else {
    const { carnet, nombre, correo } = maestro;
    if (typeof carnet !== 'string' || !carnet.trim() || carnet.length > 25)
      errores.push('"carnet" es obligatorio (máx. 25 caracteres)');
    if (typeof nombre !== 'string' || !nombre.trim() || nombre.length > 150)
      errores.push('"nombre" es obligatorio (máx. 150 caracteres)');
    if (typeof correo !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length > 150)
      errores.push('"correo" debe ser un correo válido (máx. 150 caracteres)');
  }

  if (!Array.isArray(detalle) || detalle.length === 0) {
    errores.push('"detalle" debe ser un arreglo con al menos una misión');
  } else {
    detalle.forEach((d, i) => {
      if (!Number.isInteger(d?.misionId)) errores.push(`detalle[${i}].misionId debe ser un número entero`);
      if (typeof d?.estado !== 'boolean') errores.push(`detalle[${i}].estado debe ser true o false`);
    });
    const ids = detalle.map(d => d?.misionId);
    const repetidos = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    if (repetidos.length) errores.push(`misionId repetido en el detalle: ${repetidos.join(', ')}`);
  }

  return errores;
}

// POST /api/registro
async function registrar(req, res) {
  const { maestro, detalle } = req.body || {};

  // 1. Validar formato
  const errores = validar(maestro, detalle);
  if (errores.length) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: errores });
  }

  const datos = {
    carnet: maestro.carnet.trim(),
    nombre: maestro.nombre.trim(),
    correo: maestro.correo.trim()
  };

  try {
    // 2. Validar que cada misionId exista en el catálogo
    const catalogo = await misionModel.obtenerIds();
    const invalidas = detalle.map(d => d.misionId).filter(id => !catalogo.includes(id));
    if (invalidas.length) {
      return res.status(400).json({
        error: 'Error de referencia: misión no existe en el catálogo',
        misionesInvalidas: invalidas,
        misionesValidas: catalogo
      });
    }

    // 3. Guardar maestro + detalle en una transacción
    const { accionEstudiante, misiones } = await estudianteModel.registrarConDetalle(datos, detalle);

    res.status(accionEstudiante === 'insertado' ? 201 : 200).json({
      mensaje: 'Registro procesado correctamente',
      estudiante: { ...datos, accion: accionEstudiante },
      misiones
    });
  } catch (e) {
    // Correo o nombre ya usado por otro carnet (restricción UNIQUE)
    if (e.number === 2627 || e.number === 2601) {
      return res.status(409).json({
        error: 'Conflicto: el nombre o correo ya está registrado con otro carnet',
        detalle: e.message
      });
    }
    // Violación de llave foránea
    if (e.number === 547) {
      return res.status(400).json({ error: 'Error de referencia en la base de datos', detalle: e.message });
    }
    res.status(500).json({ error: 'Error al procesar el registro', detalle: e.message });
  }
}

module.exports = { registrar };