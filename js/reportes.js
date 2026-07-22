let chartEquiposInstance = null;
let chartRentasInstance = null;

// ==========================================
// INICIALIZACIÓN
// ==========================================
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

// ==========================================
// CARGAR ESTADÍSTICAS DESDE SUPABASE
// ==========================================
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
      activos: activos || 0,
      inoperativos: inoperativos || 0,
      rentados: rentados || 0,
      averiados: averiados || 0,
      vendidos: vendidos || 0,
      rentasCreadas: rentasCreadas || 0,
      rentasTerminadas: rentasTerminadas || 0,
      rentasVencidas: rentasVencidas || 0
    });

  } catch (err) {
    console.error('❌ Error al cargar estadísticas:', err);
  }
}

// ==========================================
// RENDERIZAR GRÁFICOS CON CHART.JS (DISEÑO PROFESIONAL)
// ==========================================
function renderizarGraficos(data) {
  // Destruir gráficos anteriores si existen
  if (chartEquiposInstance) chartEquiposInstance.destroy();
  if (chartRentasInstance) chartRentasInstance.destroy();

  // Configuración global de fuentes para que coincidan con el diseño
  Chart.defaults.font.family = "'Poppins', sans-serif";
  Chart.defaults.color = '#6b7280';

  // 📊 GRÁFICO 1: Estado del Inventario (Dona)
  const ctxEquipos = document.getElementById('chartEquipos').getContext('2d');
  chartEquiposInstance = new Chart(ctxEquipos, {
    type: 'doughnut',
    data: {
      labels: ['Activos', 'Inoperativos', 'Rentados', 'Averiados', 'Vendidos'],
      datasets: [{
        data: [data.activos, data.inoperativos, data.rentados, data.averiados, data.vendidos],
        backgroundColor: ['#10b981', '#6b7280', '#f59e0b', '#ef4444', '#8b5cf6'],
        borderWidth: 0,
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // ✅ CLAVE: Permite que el gráfico se ajuste al contenedor de 450px
      cutout: '65%', // Hace la dona más elegante y delgada
      plugins: {
        legend: { 
          position: 'bottom', 
          labels: { 
            padding: 20, 
            usePointStyle: true,
            pointStyle: 'circle',
            font: { size: 12, weight: '500' } 
          } 
        },
        tooltip: {
          backgroundColor: '#1e3a8a',
          titleFont: { size: 13, weight: '600' },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 8,
          displayColors: true
        }
      }
    }
  });

  // 📊 GRÁFICO 2: Estado de las Rentas (Barras)
  const ctxRentas = document.getElementById('chartRentas').getContext('2d');
  chartRentasInstance = new Chart(ctxRentas, {
    type: 'bar',
    data: {
      labels: ['Creadas (Total)', 'Terminadas', 'Vencidas'],
      datasets: [{
        label: 'Cantidad de Rentas',
        data: [data.rentasCreadas, data.rentasTerminadas, data.rentasVencidas],
        backgroundColor: ['#3b82f6', '#10b981', '#ef4444'],
        borderRadius: 8, // Bordes redondeados en las barras
        borderSkipped: false,
        barThickness: 60
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // ✅ CLAVE: Permite que el gráfico se ajuste al contenedor de 450px
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e3a8a',
          titleFont: { size: 13, weight: '600' },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { 
            stepSize: 1,
            font: { size: 11 } 
          },
          grid: { 
            color: '#f3f4f6',
            drawBorder: false
          }
        },
        x: {
          ticks: { 
            font: { size: 12, weight: '600' } 
          },
          grid: { display: false }
        }
      }
    }
  });
}

// ==========================================
// INICIALIZAR AL CARGAR EL DOM
// ==========================================
document.addEventListener('DOMContentLoaded', inicializarReportes);
