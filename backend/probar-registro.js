// Script de prueba: envía el JSON maestro-detalle a /api/registro
// Uso: node probar-registro.js [url]
const URL = process.argv[2] || 'http://localhost:3000/api/registro';

const datos = {
  maestro: {
    carnet: '1890-23-15896',
    nombre: 'ERICK ROLANDO RAMAZZINI MURALLES',
    correo: 'eramazzinim@miumg.edu.gt'
  },
  detalle: [
    { misionId: 1, estado: true },   // Crear API ✔
    { misionId: 2, estado: true },   // Crear Frontend ✔
    { misionId: 3, estado: false },  // Subir código a GitHub
    { misionId: 4, estado: false },  // Publicar en hosting
    { misionId: 5, estado: false }   // Pruebas de ingreso
  ]
};

(async () => {
  const r = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  console.log('Estado HTTP:', r.status);
  console.log(JSON.stringify(await r.json(), null, 2));
})();