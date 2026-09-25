// Rutas del registro maestro-detalle
const router = require('express').Router();
const registroController = require('../controllers/registroController');

// POST /api/registro  →  registroController.registrar
router.post('/', registroController.registrar);

module.exports = router;