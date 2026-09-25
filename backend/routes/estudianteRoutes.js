// Rutas de estudiantes
const router = require('express').Router();
const estudianteController = require('../controllers/estudianteController');

// GET /api/estudiantes  →  estudianteController.listar
router.get('/', estudianteController.listar);

module.exports = router;