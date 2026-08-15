// ==========================================
// VARIABLES GLOBALES
// ==========================================
let historialRecepcionesCache = [];
let paginaActualHistorial = 1;
const POR_PAGINA_HISTORIAL = 20;
let totalHistorial = 0;
let recepcionDetalleHistorial = null;
let itemsDetalleHistorial = [];
let usuarioActualHistorial = null;

// ==========================================
// ✅ INYECTAR ESTILOS CSS
// ==========================================
function inyectarEstilosHistorial() {
  if (document.getElementById('estilos-historial-recepcion')) return;
  const style = document.createElement('style');
  style.id = 'estilos-historial-recepcion';
  style.textContent = `
    .container { max-width: 1400px; margin: 0 auto; padding: 30px; }
    .page-header { margin-bottom: 25px; }
    .page-title { font-family: 'Libre Caslon Text', serif; color: #1e3a8a; font-size: 28px; margin-bottom: 8px; }
    .page-subtitle { color: #6b7280; font-size: 14px; }
    fieldset { background-color: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 25px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
    legend { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px; }
    .form-group label { display: block; font-size: 12px; color: #6b7280; font-weight: 600; margin-bottom: 6px; text-transform: uppercase; }
    .form-group input, .form-group select { width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 13px; font-family: 'Poppins', sans-serif; }
    .btn-action { padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s; font-family: 'Poppins', sans-serif; margin-right: 8px; }
    .btn-primary { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(30,58,138,0.3); }
    .btn-secondary { background-color: #6b7280; color: white; }
    .table-container { overflow-x: auto; margin-top: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
    table { width: 100%; border-collapse: collapse; background: white; }
    th { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    tr:hover { background: #f9fafb; }
    .contador-info { background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 15px; font-weight: 700; color: #1e40af; }
    .paginacion { margin-top: 20px; display: flex; justify-content: center; align-items: center; gap: 10px; flex-wrap: wrap; }
    .paginacion button { padding: 8px 16px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; }
    .paginacion button:disabled { opacity: 0.4; cursor: not-allowed; }
    .badge-estado { padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; display: inline-block; }
    .estado-completa { background: #d1fae5; color: #065f46; }
    .estado-con_faltantes { background: #fee2e2; color: #991b1b; }
    .estado-parcial { background: #fef3c7; color: #92400e; }
    .estado-recibido { background: #d1fae5; color: #065f46; }
    .estado-faltante { background: #fee2e2; color: #991b1b; }
    .estado-pendiente { background: #fef3c7; color: #92400e; }
    .renta-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 20px; }
    .renta-info-box { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .renta-info-box label { font-size: 11px; color: #6b7280; text-transform: uppercase; display: block; margin-bottom: 5px; font-weight: 600; }
    .renta-info-box strong { color: #1e3a8a; font-size: 14px; display: block; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
    .stat-card { background: white; padding: 20px; border-radius: 12px; text-align: center; border-top: 4px solid; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .stat-card.total { border-color: #1e3a8a; }
    .stat-card.recibidos { border-color: #10b981; }
    .stat-card.faltantes { border-color: #dc2626; }
    .stat-number { font-size: 32px; font-weight: 700; font-family: 'Courier New', monospace; }
    .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
    .stat-card.total .stat-number { color: #1e3a8a; }
    .stat-card.recibidos .stat-number { color: #10b981; }
    .stat-card.faltantes .stat-number { color: #dc2626; }
    .button-group { margin-top: 25px; padding-top: 20px; border-top: 2px solid #e5e7eb; }
    .mensaje { padding: 15px; border-radius: 8px; margin-bottom: 20px; display: none; }
    .mensaje.exito { background: #d1fae5; color: #065f46; display: block; }
    .mensaje.error { background: #fee2e2; color: #991b1b; display: block; }
    @media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr; } }
  `;
  document.head.appendChild(style);
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarHistorialRecepcion() {
  console.log('📜 === INICIANDO HISTORIAL DE RECEPCIÓN ===');
  inyectarEstilosHistorial();

  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }
  if (typeof supabaseClient === 'undefined') {
    mostrarToastHistorial('Error: Supabase no está disponible', 'error');
    return;
  }

  await cargarUsuarioHistorial();
  await buscarHistorialRecepcion();

  console.log('✅ === HISTORIAL DE RECEPCIÓN INICIALIZADO ===');
}

// ==========================================
// CARGAR USUARIO
// ==========================================
async function cargarUsuarioHistorial() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    const { data } = await supabaseClient
      .from('usuarios')
      .select('*')
      .eq('email', session.user.email)
      .maybeSingle();
    usuarioActualHistorial = data || { email: session.user.email, id: session.user.id, rol: 'consultor' };
  } catch (err) {
    console.error('Error al cargar usuario:', err);
  }
}

// ==========================================
// ✅ BUSCAR HISTORIAL (1 SOLA CONSULTA CON FILTROS)
// ==========================================
async function buscarHistorialRecepcion() {
  const tbody = document.getElementById('tbodyHistorialRecepciones');
  if (!tbody) return;

  const filtroNumero = document.getElementById('filtroNumeroRec')?.value.trim() || '';
  const filtroRenta = document.getElementById('filtroRentaRec')?.value.trim() || '';
  const filtroCliente = document.getElementById('filtroClienteRec')?.value.trim() || '';
  const filtroEstado = document.getElementById('filtroEstadoRec')?.value || '';
  const filtroDesde = document.getElementById('filtroFechaDesdeRec')?.value || '';
  const filtroHasta = document.getElementById('filtroFechaHastaRec')?.value || '';

  // Skeleton
  tbody.innerHTML = Array(5).fill(0).map(() => `
    <tr><td colspan="9"><div class="skeleton-bar-hist"></div></td></tr>
  `).join('');
  if (!document.getElementById('skeletonHistStyles')) {
    const s = document.createElement('style');
    s.id = 'skeletonHistStyles';
    s.textContent = `.skeleton-bar-hist { height: 16px; background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size: 200% 100%; animation: shimmerHist 1.5s infinite; border-radius: 4px; } @keyframes shimmerHist { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`;
    document.head.appendChild(s);
  }

  try {
    let query = supabaseClient
      .from('recepcion_equipos')
      .select('*', { count: 'exact' })
      .order('fecha_recepcion', { ascending: false });

    if (filtroNumero) query = query.ilike('numero_recepcion', `%${filtroNumero}%`);
    if (filtroRenta) query = query.ilike('numero_renta', `%${filtroRenta}%`);
    if (filtroCliente) query = query.ilike('cliente_nombre', `%${filtroCliente}%`);
    if (filtroEstado) query = query.eq('estado', filtroEstado);
    if (filtroDesde) query = query.gte('fecha_recepcion', filtroDesde);
    if (filtroHasta) query = query.lte('fecha_recepcion', filtroHasta + 'T23:59:59');

    const desde = (paginaActualHistorial - 1) * POR_PAGINA_HISTORIAL;
    const hasta = desde + POR_PAGINA_HISTORIAL - 1;
    query = query.range(desde, hasta);

    const { data, error, count } = await query;
    if (error) throw error;

    historialRecepcionesCache = data || [];
    totalHistorial = count || 0;

    const contador = document.getElementById('contadorHistorial');
    if (contador) contador.textContent = `Total: ${totalHistorial} recepción(es)`;

    renderizarListaHistorial();
    renderizarPaginacionHistorial();
  } catch (err) {
    console.error('Error al buscar historial:', err);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:40px; color:#ef4444;">Error: ${err.message}</td></tr>`;
  }
}

// ==========================================
// RENDERIZAR LISTA
// ==========================================
function renderizarListaHistorial() {
  const tbody = document.getElementById('tbodyHistorialRecepciones');
  if (!tbody) return;

  if (historialRecepcionesCache.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px; color: #6b7280;">
          <div style="font-size: 40px; margin-bottom: 10px;">📭</div>
          <div>No se encontraron recepciones con los filtros aplicados</div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = historialRecepcionesCache.map((rec, index) => {
    const globalIndex = (paginaActualHistorial - 1) * POR_PAGINA_HISTORIAL + index + 1;
    const fechaRec = rec.fecha_recepcion ? new Date(rec.fecha_recepcion).toLocaleString('es-ES') : '-';
    const badgeClass = `estado-${rec.estado}`;
    const estadoTexto = rec.estado === 'completa' ? '✅ Completa' :
                        rec.estado === 'con_faltantes' ? '⚠️ Con Faltantes' : '🔶 Parcial';

    return `
      <tr>
        <td>${globalIndex}</td>
        <td style="font-family: monospace; font-weight: 600; color: #1e3a8a;">${rec.numero_recepcion}</td>
        <td style="font-family: monospace;">${rec.numero_renta}</td>
        <td><strong>${rec.cliente_nombre}</strong></td>
        <td>${fechaRec}</td>
        <td style="text-align: center; color: #10b981; font-weight: 700;">${rec.equipos_recibidos}</td>
        <td style="text-align: center; color: ${rec.equipos_faltantes > 0 ? '#dc2626' : '#9ca3af'}; font-weight: 700;">${rec.equipos_faltantes}</td>
        <td style="text-align: center;"><span class="badge-estado ${badgeClass}">${estadoTexto}</span></td>
        <td style="text-align: center;">
          <button type="button" onclick="verDetalleHistorial(${rec.id})"
                  class="btn-action btn-primary" style="padding: 6px 14px; font-size: 12px; margin-right: 0;">
             Ver
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================
// PAGINACIÓN
// ==========================================
function renderizarPaginacionHistorial() {
  const cont = document.getElementById('paginacionHistorial');
  if (!cont) return;
  const totalPaginas = Math.ceil(totalHistorial / POR_PAGINA_HISTORIAL);
  if (totalPaginas <= 1) {
    cont.innerHTML = `<span style="color: #6b7280; font-size: 13px;">Página 1 de 1</span>`;
    return;
  }
  cont.innerHTML = `
    <button onclick="cambiarPaginaHistorial(${paginaActualHistorial - 1})" ${paginaActualHistorial === 1 ? 'disabled' : ''}>‹ Anterior</button>
    <span style="font-weight: 600;">Página ${paginaActualHistorial} de ${totalPaginas}</span>
    <button onclick="cambiarPaginaHistorial(${paginaActualHistorial + 1})" ${paginaActualHistorial === totalPaginas ? 'disabled' : ''}>Siguiente ›</button>
  `;
}

async function cambiarPaginaHistorial(nuevaPagina) {
  const totalPaginas = Math.ceil(totalHistorial / POR_PAGINA_HISTORIAL);
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
  paginaActualHistorial = nuevaPagina;
  await buscarHistorialRecepcion();
}

// ==========================================
// LIMPIAR FILTROS
// ==========================================
function limpiarFiltrosHistorial() {
  ['filtroNumeroRec', 'filtroRentaRec', 'filtroClienteRec', 'filtroFechaDesdeRec', 'filtroFechaHastaRec'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const estado = document.getElementById('filtroEstadoRec');
  if (estado) estado.value = '';
  paginaActualHistorial = 1;
  buscarHistorialRecepcion();
}

// ==========================================
// ✅ VER DETALLE DE UNA RECEPCIÓN
// ==========================================
async function verDetalleHistorial(recepcionId) {
  try {
    const recepcion = historialRecepcionesCache.find(r => r.id === recepcionId);
    if (!recepcion) {
      mostrarToastHistorial('Recepción no encontrada', 'error');
      return;
    }

    const { data: items, error } = await supabaseClient
      .from('recepcion_equipos_items')
      .select('*')
      .eq('recepcion_id', recepcionId)
      .order('id', { ascending: true });

    if (error) throw error;

    recepcionDetalleHistorial = recepcion;
    itemsDetalleHistorial = items || [];

    document.getElementById('detalleNumeroRecepcion').textContent = `#${recepcion.numero_recepcion}`;
    renderizarInfoDetalle();
    renderizarEstadisticasDetalle();
    renderizarItemsDetalle();

    document.getElementById('fieldsetListaHistorial').style.display = 'none';
    document.getElementById('fieldsetDetalleHistorial').style.display = 'block';
    document.getElementById('fieldsetDetalleHistorial').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    console.error('Error al ver detalle:', err);
    mostrarToastHistorial('Error al cargar detalle: ' + err.message, 'error');
  }
}

// ==========================================
// RENDERIZAR INFO DEL DETALLE
// ==========================================
function renderizarInfoDetalle() {
  const rec = recepcionDetalleHistorial;
  const container = document.getElementById('detalleInfoRecepcion');
  if (!container) return;
  const fechaRec = rec.fecha_recepcion ? new Date(rec.fecha_recepcion).toLocaleString('es-ES') : '-';
  const fechaEsperada = rec.fecha_devolucion_esperada ? new Date(rec.fecha_devolucion_esperada + 'T12:00:00').toLocaleDateString('es-ES') : '-';

  container.innerHTML = `
    <div class="renta-info-box"><label>📋 N° Renta</label><strong>${rec.numero_renta}</strong></div>
    <div class="renta-info-box"><label>👤 Cliente</label><strong>${rec.cliente_nombre}</strong></div>
    <div class="renta-info-box"><label>📞 Teléfono</label><strong>${rec.cliente_telefono || 'N/A'}</strong></div>
    <div class="renta-info-box"><label>📅 Recepción</label><strong>${fechaRec}</strong></div>
    <div class="renta-info-box"><label>📅 Devolución Esperada</label><strong>${fechaEsperada}</strong></div>
    <div class="renta-info-box"><label>👷 Recibido Por</label><strong>${rec.recibido_por_email || 'N/A'}</strong></div>
    ${rec.observaciones ? `<div class="renta-info-box" style="grid-column: 1 / -1;"><label>📝 Observaciones</label><strong>${rec.observaciones}</strong></div>` : ''}
  `;
}

// ==========================================
// RENDERIZAR ESTADÍSTICAS
// ==========================================
function renderizarEstadisticasDetalle() {
  const rec = recepcionDetalleHistorial;
  const container = document.getElementById('detalleEstadisticas');
  if (!container) return;
  container.innerHTML = `
    <div class="stat-card total">
      <div class="stat-number">${rec.total_equipos}</div>
      <div class="stat-label">Total Equipos</div>
    </div>
    <div class="stat-card recibidos">
      <div class="stat-number">${rec.equipos_recibidos}</div>
      <div class="stat-label">✅ Recibidos</div>
    </div>
    <div class="stat-card faltantes">
      <div class="stat-number">${rec.equipos_faltantes}</div>
      <div class="stat-label">❌ Faltantes</div>
    </div>
  `;
}

// ==========================================
// RENDERIZAR ITEMS DEL DETALLE
// ==========================================
function renderizarItemsDetalle() {
  const tbody = document.getElementById('tbodyDetalleItems');
  if (!tbody) return;

  tbody.innerHTML = itemsDetalleHistorial.map((item, index) => {
    const estadoClass = `estado-${item.estado_recepcion}`;
    const estadoIcono = item.estado_recepcion === 'recibido' ? '✅' :
                        item.estado_recepcion === 'faltante' ? '❌' : '⏳';
    const hora = item.fecha_escaneo ?
      new Date(item.fecha_escaneo).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '-';

    return `
      <tr>
        <td>${index + 1}</td>
        <td style="font-family: monospace; font-size: 11px;">${item.codigo_barras}</td>
        <td><strong>${item.nombre_equipo}</strong></td>
        <td>${item.serial || '-'}</td>
        <td style="text-align: center;">${item.cantidad}</td>
        <td style="text-align: center;"><span class="badge-estado ${estadoClass}">${estadoIcono} ${item.estado_recepcion}</span></td>
        <td style="text-align: center;">${hora}</td>
        <td>${item.escaneado_por || '-'}</td>
      </tr>
    `;
  }).join('');
}

// ==========================================
// VOLVER A LA LISTA
// ==========================================
function volverAListaHistorial() {
  recepcionDetalleHistorial = null;
  itemsDetalleHistorial = [];
  document.getElementById('fieldsetDetalleHistorial').style.display = 'none';
  document.getElementById('fieldsetListaHistorial').style.display = 'block';
}

// ==========================================
// ✅ IMPRIMIR COMPROBANTE DEL HISTORIAL (TAMAÑO CARTA)
// ==========================================
function imprimirDetalleHistorial() {
  if (!recepcionDetalleHistorial) {
    mostrarToastHistorial('No hay recepción seleccionada', 'error');
    return;
  }

  const rec = recepcionDetalleHistorial;
  const logoUrl = new URL('img/logo.png', window.location.href).href;
  const fechaRec = rec.fecha_recepcion ? new Date(rec.fecha_recepcion).toLocaleString('es-ES') : '-';

  const itemsHTML = itemsDetalleHistorial.map((item, i) => {
    const icono = item.estado_recepcion === 'recibido' ? '✅' :
                  item.estado_recepcion === 'faltante' ? '❌' : '⏳';
    const color = item.estado_recepcion === 'recibido' ? '#10b981' :
                  item.estado_recepcion === 'faltante' ? '#dc2626' : '#f59e0b';
    const hora = item.fecha_escaneo ?
      new Date(item.fecha_escaneo).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '-';
    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${i + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 10px;">${item.codigo_barras}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>${item.nombre_equipo}</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.serial || '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.cantidad}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center; color: ${color}; font-weight: 700;">${icono} ${item.estado_recepcion.toUpperCase()}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${hora}</td>
      </tr>
    `;
  }).join('');

  const estadoTexto = rec.estado === 'completa' ? 'COMPLETA' :
                      rec.estado === 'con_faltantes' ? 'CON FALTANTES' : 'PARCIAL';
  const estadoColor = rec.estado === 'completa' ? '#10b981' :
                      rec.estado === 'con_faltantes' ? '#dc2626' : '#f59e0b';

  const ventana = window.open('', '_blank', 'width=900,height=1100');
  ventana.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Comprobante de Recepción ${rec.numero_recepcion}</title>
<style>
@page { size: letter; margin: 15mm; }
* { box-sizing: border-box; }
body { font-family: Arial, sans-serif; font-size: 12px; color: #333; max-width: 216mm; margin: 0 auto; padding: 10mm; }
.header { text-align: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; }
.logo-img { max-width: 250px; max-height: 250px; object-fit: contain; }
.brand h1 { color: #1e3a8a; margin: 10px 0 5px 0; font-size: 26px; font-family: 'Libre Caslon Text', serif; }
.brand p { margin: 3px 0 0 0; color: #666; font-size: 12px; }
.numero-box { background: linear-gradient(135deg, #eff6ff, #dbeafe); padding: 12px 20px; border-radius: 8px; margin: 15px auto; display: inline-block; border: 2px dashed #3b82f6; }
.numero-box .valor { font-size: 22px; font-weight: bold; color: #1e3a8a; font-family: monospace; }
.estado-final { text-align: center; padding: 12px; margin: 15px 0; border: 2px solid ${estadoColor}; border-radius: 8px; background: ${estadoColor}15; color: ${estadoColor}; font-weight: bold; font-size: 16px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.info-box { background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; }
.info-box h3 { margin: 0 0 10px 0; color: #1e3a8a; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
.info-box p { margin: 5px 0; font-size: 12px; }
table { width: 100%; border-collapse: collapse; margin: 20px 0; }
th { background: #1e3a8a; color: white; padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
.stat-box { text-align: center; padding: 15px; border-radius: 8px; border: 2px solid; }
.stat-box .num { font-size: 28px; font-weight: 700; font-family: monospace; }
.firmas { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; text-align: center; }
.firma-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; }
.footer { margin-top: 30px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
@media print { .no-print { display: none !important; } body { padding: 0; } }
</style>
</head>
<body>
<div class="header">
<img src="${logoUrl}" alt="Logo" class="logo-img" onerror="this.style.display='none'">
<div class="brand"><h1>Eventos D' Primera</h1><p>Sistema de Inventario y Rentas</p></div>
<div class="numero-box"><div style="font-size:10px; color:#666;">COMPROBANTE DE RECEPCIÓN N°</div><div class="valor">${rec.numero_recepcion}</div></div>
</div>
<div class="estado-final">ESTADO DE LA RECEPCIÓN: ${estadoTexto}</div>
<div class="info-grid">
<div class="info-box">
<h3>👤 Cliente</h3>
<p><strong>Nombre:</strong> ${rec.cliente_nombre}</p>
<p><strong>Teléfono:</strong> ${rec.cliente_telefono || 'N/A'}</p>
<p><strong>Renta:</strong> ${rec.numero_renta}</p>
</div>
<div class="info-box">
<h3>📅 Detalles</h3>
<p><strong>Fecha Recepción:</strong> ${fechaRec}</p>
<p><strong>Recibido por:</strong> ${rec.recibido_por_email || 'N/A'}</p>
</div>
</div>
<div class="stats">
<div class="stat-box" style="border-color:#1e3a8a; background:#eff6ff;"><div class="num" style="color:#1e3a8a;">${rec.total_equipos}</div><div>TOTAL</div></div>
<div class="stat-box" style="border-color:#10b981; background:#d1fae5;"><div class="num" style="color:#10b981;">${rec.equipos_recibidos}</div><div>RECIBIDOS</div></div>
<div class="stat-box" style="border-color:#dc2626; background:#fee2e2;"><div class="num" style="color:#dc2626;">${rec.equipos_faltantes}</div><div>FALTANTES</div></div>
</div>
<table>
<thead><tr><th>#</th><th>Código</th><th>Equipo</th><th>Serial</th><th style="text-align:center;">Cant.</th><th style="text-align:center;">Estado</th><th style="text-align:center;">Hora</th></tr></thead>
<tbody>${itemsHTML}</tbody>
</table>
${rec.observaciones ? `<div style="padding:15px; background:#fef3c7; border-left:4px solid #f59e0b; border-radius:4px;"><strong>📝 Observaciones:</strong> ${rec.observaciones}</div>` : ''}
<div class="firmas">
<div><div class="firma-line"><p><strong>${rec.cliente_nombre}</strong></p><p>Cliente / Responsable</p></div></div>
<div><div class="firma-line"><p><strong>${rec.recibido_por_email || 'Responsable'}</strong></p><p>Recibido por</p></div></div>
</div>
<div class="footer"><p>©copyright Eventos de Primera | 2026-2027 | Reimpreso el ${new Date().toLocaleString('es-ES')}</p></div>
<div class="no-print" style="margin-top:30px; text-align:center;">
<button onclick="window.print()" style="padding:12px 30px; background:#1e3a8a; color:white; border:none; border-radius:6px; cursor:pointer; font-size:14px;">🖨️ Imprimir</button>
<button onclick="window.close()" style="padding:12px 30px; background:#6b7280; color:white; border:none; border-radius:6px; cursor:pointer; font-size:14px;">❌ Cerrar</button>
</div>
</body>
</html>`);
  ventana.document.close();
  setTimeout(() => { ventana.focus(); ventana.print(); }, 500);
}

// ==========================================
// SISTEMA TOAST
// ==========================================
function mostrarToastHistorial(texto, tipo) {
  let toastContainer = document.getElementById('toastContainerHistorial');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainerHistorial';
    toastContainer.style.cssText = `position: fixed; top: 80px; right: 20px; z-index: 999999; display: flex; flex-direction: column; gap: 10px; max-width: 380px; pointer-events: none;`;
    document.body.appendChild(toastContainer);
  }
  const bgColor = tipo === 'exito' ? '#d1fae5' : (tipo === 'error' ? '#fee2e2' : '#fef3c7');
  const borderColor = tipo === 'exito' ? '#10b981' : (tipo === 'error' ? '#dc2626' : '#f59e0b');
  const textColor = tipo === 'exito' ? '#065f46' : (tipo === 'error' ? '#991b1b' : '#92400e');
  const icono = tipo === 'exito' ? '✅' : (tipo === 'error' ? '⚠️' : 'ℹ️');
  const toast = document.createElement('div');
  toast.style.cssText = `background:${bgColor}; border-left:4px solid ${borderColor}; color:${textColor}; padding:12px 16px; border-radius:8px; font-size:13px; font-family:'Poppins',sans-serif; font-weight:500; box-shadow:0 4px 12px rgba(0,0,0,0.2); animation: toastInHist 0.3s ease; display:flex; align-items:center; gap:10px; pointer-events:auto;`;
  toast.innerHTML = `<span>${icono}</span><span style="flex:1;">${texto}</span><span onclick="this.parentElement.remove()" style="cursor:pointer; opacity:0.6;">✕</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => { if (toast.parentElement) { toast.style.animation = 'toastOutHist 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); } }, 3000);
}
if (!document.getElementById('toastStylesHistorial')) {
  const style = document.createElement('style');
  style.id = 'toastStylesHistorial';
  style.textContent = `@keyframes toastInHist { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes toastOutHist { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }`;
  document.head.appendChild(style);
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  inicializarHistorialRecepcion();
});
