// ==========================================
// 1. INYECTAR ESTILOS (SOLUCIÓN PARA CARGA DINÁMICA EN DASHBOARD)
// ==========================================
function inyectarEstilosReportes() {
  // Evitar inyectar múltiples veces
  if (document.getElementById('estilos-reportes-inyectados')) return;
  
  const style = document.createElement('style');
  style.id = 'estilos-reportes-inyectados';
  style.textContent = `
    .container { max-width: 1200px; margin: 0 auto; padding: 30px; }
    .page-header { text-align: center; margin-bottom: 40px; }
    .page-title { font-family: 'Libre Caslon Text', serif; color: #1e3a8a; font-size: 32px; margin: 0; }
    .page-subtitle { color: #6b7280; font-size: 15px; margin-top: 8px; }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 50px;
    }
    
    .stat-card {
      background: white;
      padding: 24px 20px;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.04);
      text-align: center;
      border-top: 4px solid #1e3a8a;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .stat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
    .stat-icon { font-size: 36px; margin-bottom: 12px; display: block; }
    .stat-value { font-size: 38px; font-weight: 700; color: #1e3a8a; margin: 5px 0; font-family: 'Poppins', sans-serif; line-height: 1; }
    .stat-label { font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    
    .stat-card.total { border-top-color: #3b82f6; }
    .stat-card.activos { border-top-color: #10b981; }
    .stat-card.inoperativos { border-top-color: #6b7280; }
    .stat-card.rentados { border-top-color: #f59e0b; }
    .stat-card.averiados { border-top-color: #ef4444; }
    .stat-card.vendidos { border-top-color: #8b5cf6; }
    .stat-card.rentas-creadas { border-top-color: #3b82f6; }
    .stat-card.rentas-terminadas { border-top-color: #10b981; }
    .stat-card.rentas-vencidas { border-top-color: #ef4444; }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 30px;
    }
    
    .chart-container {
      background: white;
      padding: 25px;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.04);
      border: 1px solid #f3f4f6;
      display: flex;
      flex-direction: column;
      height: 450px; /* ✅ ALTURA FIJA PARA EVITAR QUE SE HAGA GIGANTE */
    }
    
    .chart-title {
      font-size: 16px;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 20px;
      text-align: center;
      padding-bottom: 15px;
      border-bottom: 2px solid #f3f4f6;
    }

    .chart-canvas-wrapper {
      flex: 1;
      position: relative;
      width: 100%;
      min-height: 0;
    }
    
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .charts-grid { grid-template-columns: 1fr; }
      .chart-container { height: 400px; }
    }
  `;
  document.head.appendChild(style);
}

// ==========================================
// 2. INICIALIZACIÓN
// ==========================================
async function inicializarReportes() {
  // 1. Inyectar estilos primero (soluciona el problema de carga dinámica)
  inyectarEstilosReportes();
  
  // 2. Esperar a que Supabase esté disponible
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }
  if (typeof supabaseClient === 'undefined') {
    console.error('❌ Supabase no está disponible');
    return;
  }
  
  // 3. Cargar estadísticas
  await cargarEstadisticas();
}

// ==========================================
// 3. CARGAR ESTADÍSTICAS DESDE SUPABASE
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

    // Actualizar números en las tarjetas de forma segura
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || 0; };
    setVal('statTotalEquipos', totalEquipos);
    setVal('statActivos', activos);
    setVal('statInoperativos', inoperativos);
    setVal('statRentados', rentados);
    setVal('statAveriados', averiados);
    setVal('statVendidos', vendidos);
    setVal('statRentasCreadas', rentasCreadas);
    setVal('statRentasTerminadas', rentasTerminadas);
    setVal('statRentasVencidas', rentasVencidas);

    // Renderizar gráficos
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
// 4. RENDERIZAR GRÁFICOS CON CHART.JS
// ==========================================
function renderizarGraficos(data) {
  // Destruir gráficos anteriores si existen (evita superposiciones al recargar)
  if (typeof window.chartEquiposInstance !== 'undefined' && window.chartEquiposInstance) window.chartEquiposInstance.destroy();
  if (typeof window.chartRentasInstance !== 'undefined' && window.chartRentasInstance) window.chartRentasInstance.destroy();

  // Configuración global de fuentes para que coincidan con el diseño
  if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.color = '#6b7280';
  }

  // 📊 GRÁFICO 1: Estado del Inventario (Dona)
  const ctxEquipos = document.getElementById('chartEquipos');
  if (ctxEquipos) {
    window.chartEquiposInstance = new Chart(ctxEquipos.getContext('2d'), {
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
        maintainAspectRatio: false, // ✅ CLAVE: Permite que se ajuste al contenedor de 450px
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
            cornerRadius: 8
          }
        }
      }
    });
  }

  // 📊 GRÁFICO 2: Estado de las Rentas (Barras)
  const ctxRentas = document.getElementById('chartRentas');
  if (ctxRentas) {
    window.chartRentasInstance = new Chart(ctxRentas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Creadas (Total)', 'Terminadas', 'Vencidas'],
        datasets: [{
          label: 'Cantidad de Rentas',
          data: [data.rentasCreadas, data.rentasTerminadas, data.rentasVencidas],
          backgroundColor: ['#3b82f6', '#10b981', '#ef4444'],
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 60
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // ✅ CLAVE: Permite que se ajuste al contenedor de 450px
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
            ticks: { stepSize: 1, font: { size: 11 } },
            grid: { color: '#f3f4f6', drawBorder: false }
          },
          x: {
            ticks: { font: { size: 12, weight: '600' } },
            grid: { display: false }
          }
        }
      }
    });
  }
}

// ==========================================
// 5. INICIALIZAR AL CARGAR EL DOM
// ==========================================
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', inicializarReportes);
}
