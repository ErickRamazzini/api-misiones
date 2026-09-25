// Rutas del catálogo de misiones
const router = require('express').Router();
const misionController = require('../controllers/misionController');

// GET /api/misiones  →  misionController.listar
router.get('/', misionController.listar);

module.exports = router;