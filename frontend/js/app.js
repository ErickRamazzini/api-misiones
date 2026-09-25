// ===== Configuración =====
// URL de TU API. Al publicar en Azure, se cambia por la dirección de Azure.
const API_URL = 'https://api-misiones-erick.onrender.com';
const MI_CARNET = '1890-23-15896';

// Datos en memoria
let estudiantes = [];
let misiones = [];
let grafica = null;

// ===== Comunicación con la API =====
async function obtener(ruta) {
  const r = await fetch(API_URL + ruta);
  if (!r.ok) throw new Error(`Error ${r.status} al consultar ${ruta}`);
  return r.json();
}

async function cargarDatos() {
  ocultarAlerta();
  try {
    // Pedir catálogo y estudiantes al mismo tiempo
    [misiones, estudiantes] = await Promise.all([
      obtener('/api/misiones'),
      obtener('/api/estudiantes')
    ]);

    // Ordenar: mayor avance primero; si empatan, por nombre
    estudiantes.sort((a, b) => b.porcentaje - a.porcentaje || a.nombre.localeCompare(b.nombre));

    mostrarEstadisticas();
    mostrarCatalogo();
    mostrarGrafica();
    mostrarTabla(document.getElementById('buscador').value);

    document.getElementById('ultimaActualizacion').textContent =
      'Actualizado: ' + new Date().toLocaleTimeString('es-GT');
  } catch (e) {
    mostrarAlerta('No se pudo conectar con la API. ' + e.message);
  }
}

// ===== Seguridad: evitar que un nombre con HTML se ejecute en la página =====
function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

// ===== Secciones del tablero =====
function mostrarEstadisticas() {
  const total = estudiantes.length;
  const completos = estudiantes.filter(e => e.porcentaje === 100).length;
  const promedio = total
    ? estudiantes.reduce((suma, e) => suma + e.porcentaje, 0) / total
    : 0;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statPromedio').textContent = promedio.toFixed(1) + '%';
  document.getElementById('statCompletos').textContent = completos;
  document.getElementById('statProceso').textContent = total - completos;
}

function mostrarCatalogo() {
  const lista = document.getElementById('listaMisiones');
  lista.innerHTML = misiones.map(m => {
    // Cuántos estudiantes completaron esta misión
    const cuantos = estudiantes.filter(e =>
      e.misiones.some(x => x.misionId === m.MisionID && x.estado)
    ).length;
    return `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <span class="mision ok">${m.MisionID}</span>
          <strong>${escapar(m.Nombre)}</strong><br>
          <small class="text-muted">${escapar(m.Descripcion)}</small>
        </div>
        <span class="badge bg-primary rounded-pill" title="Estudiantes que la completaron">${cuantos}</span>
      </li>`;
  }).join('');
}

function mostrarGrafica() {
  // Contar estudiantes por rango de avance
  const rangos = [0, 0, 0, 0, 0];
  estudiantes.forEach(e => {
    const p = e.porcentaje;
    if (p === 0) rangos[0]++;
    else if (p <= 40) rangos[1]++;
    else if (p <= 80) rangos[2]++;
    else if (p < 100) rangos[3]++;
    else rangos[4]++;
  });

  if (grafica) grafica.destroy(); // borrar la anterior al recargar
  grafica = new Chart(document.getElementById('grafica'), {
    type: 'bar',
    data: {
      labels: ['0%', '1% - 40%', '41% - 80%', '81% - 99%', '100%'],
      datasets: [{
        label: 'Estudiantes',
        data: rangos,
        backgroundColor: ['#94a3b8', '#f59e0b', '#3b82f6', '#6366f1', '#16a34a'],
        borderRadius: 8
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });
}

function mostrarTabla(filtro = '') {
  const texto = filtro.trim().toLowerCase();
  const lista = estudiantes.filter(e =>
    e.carnet.toLowerCase().includes(texto) || e.nombre.toLowerCase().includes(texto)
  );

  const cuerpo = document.getElementById('tablaCuerpo');
  if (!lista.length) {
    cuerpo.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Sin resultados</td></tr>';
    return;
  }

  cuerpo.innerHTML = lista.map(e => {
    // Un circulito por cada misión del catálogo
    const circulos = misiones.map(m => {
      const d = e.misiones.find(x => x.misionId === m.MisionID);
      const ok = d && d.estado;
      return `<span class="mision ${ok ? 'ok' : ''}" title="${escapar(m.Nombre)}: ${ok ? 'completada' : 'pendiente'}">${m.MisionID}</span>`;
    }).join('');

    const p = e.porcentaje;
    const color = p === 100 ? 'bg-success' : p >= 60 ? 'bg-primary' : p > 0 ? 'bg-warning' : 'bg-secondary';
    const estado = p === 100
      ? '<span class="badge bg-success"><i class="fa-solid fa-check"></i> Completado</span>'
      : '<span class="badge bg-warning text-dark"><i class="fa-solid fa-clock"></i> En proceso</span>';

    return `
      <tr class="${e.carnet === MI_CARNET ? 'mi-fila' : ''}">
        <td><strong>${escapar(e.carnet)}</strong></td>
        <td>${escapar(e.nombre)}<br><small class="text-muted">${escapar(e.correo)}</small></td>
        <td class="text-nowrap">${circulos}</td>
        <td>
          <div class="progress">
            <div class="progress-bar ${color}" style="width: ${Math.max(p, 8)}%">${p}%</div>
          </div>
          <small class="text-muted">${e.completadas} de ${e.totalMisiones}</small>
        </td>
        <td>${estado}</td>
      </tr>`;
  }).join('');
}

// ===== Mensajes de error =====
function mostrarAlerta(mensaje) {
  const a = document.getElementById('alerta');
  a.textContent = mensaje;
  a.classList.remove('d-none');
}
function ocultarAlerta() {
  document.getElementById('alerta').classList.add('d-none');
}

// ===== Eventos =====
document.getElementById('buscador').addEventListener('input', e => mostrarTabla(e.target.value));
document.getElementById('btnRecargar').addEventListener('click', cargarDatos);

cargarDatos();                      // cargar al abrir la página
setInterval(cargarDatos, 30000);    // y actualizar solo cada 30 segundos