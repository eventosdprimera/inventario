let chartEquiposInstance = null;
let chartRentasInstance = null;

async function inicializarReportes() {
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }
  if (typeof supabaseClient === 'undefined') {
    console.error('❌ Supabase no está disponible');
    return;
  }
  await cargarEstadisticas();
}

async function cargarEstadisticas() {
  try {
    const { count: totalEquipos } = await supabaseClient.from('equipos').select('*', { count: 'exact', head: true });
    const { count: activos } = await supabaseClient.from('equipos').select('*', { count: 'exact', head: true }).eq('estatus', 'operativo').eq('activo', true);
    const { count: inoperativos } = await supabaseClient.from('equipos').select('*', { count: 'exact', head: true }).neq('estatus', 'operativo');
    const { count: rentados } = await supabaseClient.from('rentas').select('*', { count: 'exact', head: true }).in('estado', ['activa', 'vencida']);
    const { count: averiados } = await supabaseClient.from('equipos_averiados').select('*', { count: 'exact', head: true }).neq('estado_reparacion', 'reintegrado');
    const { count: vendidos } = await supabaseClient.from('ventas').select('*', { count: 'exact', head: true });
    const { count: rentasCreadas } = await supabaseClient.from('rentas').select('*', { count: 'exact', head: true });
    const { count: rentasTerminadas } = await supabaseClient.from('rentas').select('*', { count: 'exact', head: true }).in('estado', ['devuelta', 'terminada']);
    const { count: rentasVencidas } = await supabaseClient.from('rentas').select('*', { count: 'exact', head: true }).eq('estado', 'vencida');

    document.getElementById('statTotalEquipos').textContent = totalEquipos || 0;
    document.getElementById('statActivos').textContent = activos || 0;
    document.getElementById('statInoperativos').textContent = inoperativos || 0;
    document.getElementById('statRentados').textContent = rentados || 0;
    document.getElementById('statAveriados').textContent = averiados || 0;
    document.getElementById('statVendidos').textContent = vendidos || 0;
    document.getElementById('statRentasCreadas').textContent = rentasCreadas || 0;
    document.getElementById('statRentasTerminadas').textContent = rentasTerminadas || 0;
    document.getElementById('statRentasVencidas').textContent = rentasVencidas || 0;

    renderizarGraficos({
      activos: activos || 0, inoperativos: inoperativos || 0, rentados: rentados || 0,
      averiados: averiados || 0, vendidos: vendidos || 0, rentasCreadas: rentasCreadas || 0,
      rentasTerminadas: rentasTerminadas || 0, rentasVencidas: rentasVencidas || 0
    });
  } catch (err) {
    console.error('❌ Error al cargar estadísticas:', err);
  }
}

function renderizarGraficos(data) {
  if (chartEquiposInstance) chartEquiposInstance.destroy();
  if (chartRentasInstance) chartRentasInstance.destroy();

  const ctxEquipos = document.getElementById('chartEquipos').getContext('2d');
  chartEquiposInstance = new Chart(ctxEquipos, {
    type: 'doughnut',
    data: {
      labels: ['Activos', 'Inoperativos', 'Rentados', 'Averiados', 'Vendidos'],
      datasets: [{
        data: [data.activos, data.inoperativos, data.rentados, data.averiados, data.vendidos],
        backgroundColor: ['#10b981', '#6b7280', '#f59e0b', '#ef4444', '#8b5cf6'],
        borderWidth: 3, borderColor: '#ffffff', hoverOffset: 10
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { position: 'bottom', labels: { font: { family: 'Poppins', size: 12, weight: '500' } } } }
    }
  });

  const ctxRentas = document.getElementById('chartRentas').getContext('2d');
  chartRentasInstance = new Chart(ctxRentas, {
    type: 'bar',
    data: {
      labels: ['Creadas (Total)', 'Terminadas', 'Vencidas'],
      datasets: [{
        label: 'Cantidad de Rentas',
        data: [data.rentasCreadas, data.rentasTerminadas, data.rentasVencidas],
        backgroundColor: ['#3b82f6', '#10b981', '#ef4444'],
        borderRadius: 8, barThickness: 50
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f3f4f6' } },
        x: { ticks: { font: { family: 'Poppins', weight: '600' } }, grid: { display: false } }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', inicializarReportes);
