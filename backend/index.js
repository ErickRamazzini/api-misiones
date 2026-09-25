// Punto de entrada: configura Express y conecta las rutas
require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');

const misionRoutes = require('./routes/misionRoutes');
const estudianteRoutes = require('./routes/estudianteRoutes');
const registroRoutes = require('./routes/registroRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Página de inicio de la API
app.get('/', (req, res) => {
  res.json({
    api: 'API Maestro-Detalle con Catálogo y Control de Estado',
    autor: 'Erick Rolando Ramazzini Muralles'
  });
});

// Montar los routers en su dirección base
app.use('/api/misiones', misionRoutes);
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/registro', registroRoutes);

// Si el body no es un JSON válido, responder con un error claro
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API escuchando en el puerto ${PORT}`));