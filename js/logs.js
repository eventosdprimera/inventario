// js/logs.js - Módulo de Logs del Sistema
// ============================================
// FUNCIÓN GLOBAL: registrarLog()
// Todos los módulos deben usar esta función para registrar actividades
// ============================================
async function registrarLog(modulo, accion, descripcion = '', nivel = 'info') {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      console.warn('⚠️ No hay sesión activa, no se puede registrar log');
      return;
    }

    // Obtener rol del usuario actual (cacheado si es posible)
    let rol = 'consultor';
    if (typeof currentUserRol !== 'undefined' && currentUserRol) {
      rol = currentUserRol;
    }

    const logEntry = {
      usuario_email: session.user.email,
      usuario_rol: rol,
      modulo: modulo,
      accion: accion,
      descripcion: descripcion || `Acción '${accion}' en módulo '${modulo}'`,
      nivel: nivel, // info, warning, error, success
      fecha: new Date().toISOString()
    };

    const { error } = await supabaseClient
      .from('logs_actividad')
      .insert(logEntry);

    if (error) {
      console.warn('⚠️ No se pudo registrar log:', error.message);
    } else {
      console.log(`📝 Log registrado: [${modulo}] ${accion}`);
    }
  } catch (err) {
    // No bloquear la app si falla el log
    console.warn('⚠️ Error al registrar log:', err.message);
  }
}

// ============================================
// ESTADO DEL MÓDULO
// ============================================
let logsState = {
  paginaActual: 1,
  registrosPorPagina: 20,
  totalRegistros: 0,
  datosFiltrados: []
};

// ============================================
// INICIALIZACIÓN DEL MÓDULO
// ============================================
async function inicializarModuloLogs() {
  console.log('📜 Inicializando módulo de logs...');

  // Configurar fecha por defecto (últimos 30 días)
  const hoy = new Date();
  const hace30 = new Date();
  hace30.setDate(hoy.getDate() - 30);

  document.getElementById('filtroFechaHasta').value = hoy.toISOString().split('T')[0];
  document.getElementById('filtroFechaDesde').value = hace30.toISOString().split('T')[0];

  // Event listeners
  document.getElementById('btnFiltrarLogs').addEventListener('click', () => {
    logsState.paginaActual = 1;
    cargarLogs();
  });

  document.getElementById('btnLimpiarFiltros').addEventListener('click', limpiarFiltros);
  document.getElementById('btnExportarLogs').addEventListener('click', exportarLogsCSV);
  document.getElementById('btnLimpiarLogsAntiguos').addEventListener('click', limpiarLogsAntiguos);

  // Cargar logs iniciales
  await cargarLogs();
  await cargarEstadisticas();
}

// ============================================
// CARGAR LOGS CON FILTROS
// ============================================
async function cargarLogs() {
  const tbody = document.getElementById('tbodyLogs');
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px;">
    <div style="font-size:32px; margin-bottom:10px;">⏳</div>
    <div>Cargando registros...</div>
  </td></tr>`;

  try {
    const modulo = document.getElementById('filtroModulo').value;
    const email = document.getElementById('filtroEmail').value.trim();
    const fechaDesde = document.getElementById('filtroFechaDesde').value;
    const fechaHasta = document.getElementById('filtroFechaHasta').value;

    // Construir consulta
    let query = supabaseClient
      .from('logs_actividad')
      .select('*', { count: 'exact' })
      .order('fecha', { ascending: false });

    // Aplicar filtros
    if (modulo) query = query.eq('modulo', modulo);
    if (email) query = query.ilike('usuario_email', `%${email}%`);
    if (fechaDesde) query = query.gte('fecha', new Date(fechaDesde + 'T00:00:00').toISOString());
    if (fechaHasta) query = query.lte('fecha', new Date(fechaHasta + 'T23:59:59').toISOString());

    // Paginación
    const desde = (logsState.paginaActual - 1) * logsState.registrosPorPagina;
    const hasta = desde + logsState.registrosPorPagina - 1;
    query = query.range(desde, hasta);

    const { data, error, count } = await query;

    if (error) throw error;

    logsState.totalRegistros = count || 0;
    logsState.datosFiltrados = data || [];

    renderizarTablaLogs(data || []);
    renderizarPaginacion();
  } catch (err) {
    console.error('Error al cargar logs:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px; color:#dc2626;">
      <div style="font-size:32px; margin-bottom:10px;">❌</div>
      <div>Error al cargar los logs: ${err.message}</div>
    </td></tr>`;
  }
}

// ============================================
// RENDERIZAR TABLA
// ============================================
function renderizarTablaLogs(logs) {
  const tbody = document.getElementById('tbodyLogs');

  if (!logs || logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px; color:#6b7280;">
      <div style="font-size:48px; margin-bottom:10px;">📭</div>
      <div>No se encontraron registros con los filtros aplicados</div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map((log, idx) => {
    const num = (logsState.paginaActual - 1) * logsState.registrosPorPagina + idx + 1;
    const fecha = new Date(log.fecha);
    const fechaStr = fecha.toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const horaStr = fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const rolBadge = obtenerBadgeRol(log.usuario_rol);
    const esError = log.nivel === 'error' || (log.descripcion && log.descripcion.toLowerCase().includes('error'));

    return `<tr class="${esError ? 'log-row-error' : ''}">
      <td>${num}</td>
      <td><strong>${fechaStr}</strong><br><small style="color:#6b7280;">${horaStr}</small></td>
      <td>${log.usuario_email}</td>
      <td>${rolBadge}</td>
      <td><span class="log-badge log-badge-modulo">${obtenerIconoModulo(log.modulo)} ${log.modulo}</span></td>
      <td>${log.accion}</td>
      <td>${log.descripcion || '-'}</td>
    </tr>`;
  }).join('');
}

function obtenerBadgeRol(rol) {
  if (!rol) return '<span class="log-badge">-</span>';
  const r = rol.toLowerCase();
  if (r.includes('admin')) return `<span class="log-badge log-badge-rol-admin">Admin</span>`;
  if (r.includes('mod')) return `<span class="log-badge log-badge-rol-mod">Moderador</span>`;
  return `<span class="log-badge log-badge-rol-con">Consultor</span>`;
}

function obtenerIconoModulo(modulo) {
  const iconos = {
    consulta: '🔍', inventario: '📦', rentar: '🤝', averias: '🔧',
    ventas: '💰', reportes: '📊', usuarios: '👥', logs: '📜', auth: '🔐'
  };
  return iconos[modulo] || '📌';
}

// ============================================
// PAGINACIÓN
// ============================================
function renderizarPaginacion() {
  const cont = document.getElementById('logsPagination');
  const totalPaginas = Math.ceil(logsState.totalRegistros / logsState.registrosPorPagina);

  if (totalPaginas <= 1) {
    cont.innerHTML = '';
    return;
  }

  let html = '';
  html += `<button ${logsState.paginaActual === 1 ? 'disabled' : ''} onclick="irPaginaLog(1)">« Primera</button>`;
  html += `<button ${logsState.paginaActual === 1 ? 'disabled' : ''} onclick="irPaginaLog(${logsState.paginaActual - 1})">‹ Anterior</button>`;

  // Mostrar páginas cercanas
  const inicio = Math.max(1, logsState.paginaActual - 2);
  const fin = Math.min(totalPaginas, logsState.paginaActual + 2);
  for (let i = inicio; i <= fin; i++) {
    html += `<button class="${i === logsState.paginaActual ? 'active' : ''}" onclick="irPaginaLog(${i})">${i}</button>`;
  }

  html += `<button ${logsState.paginaActual === totalPaginas ? 'disabled' : ''} onclick="irPaginaLog(${logsState.paginaActual + 1})">Siguiente ›</button>`;
  html += `<button ${logsState.paginaActual === totalPaginas ? 'disabled' : ''} onclick="irPaginaLog(${totalPaginas})">Última »</button>`;

  html += `<span style="padding:8px 12px; color:#6b7280; font-size:12px;">Página ${logsState.paginaActual} de ${totalPaginas} (${logsState.totalRegistros} registros)</span>`;

  cont.innerHTML = html;
}

function irPaginaLog(num) {
  logsState.paginaActual = num;
  cargarLogs();
  document.getElementById('tablaLogs').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// ESTADÍSTICAS
// ============================================
async function cargarEstadisticas() {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Total
    const { count: total } = await supabaseClient
      .from('logs_actividad').select('*', { count: 'exact', head: true });

    // Hoy
    const { count: hoyCount } = await supabaseClient
      .from('logs_actividad')
      .select('*', { count: 'exact', head: true })
      .gte('fecha', hoy.toISOString());

    // Errores (últimos 30 días)
    const hace30 = new Date();
    hace30.setDate(hace30.getDate() - 30);
    const { count: errores } = await supabaseClient
      .from('logs_actividad')
      .select('*', { count: 'exact', head: true })
      .gte('fecha', hace30.toISOString())
      .eq('nivel', 'error');

    // Usuarios únicos activos (últimos 30 días)
    const { data: usuariosActivos } = await supabaseClient
      .from('logs_actividad')
      .select('usuario_email')
      .gte('fecha', hace30.toISOString());

    const usuariosUnicos = new Set((usuariosActivos || []).map(u => u.usuario_email)).size;

    document.getElementById('statTotal').textContent = total || 0;
    document.getElementById('statHoy').textContent = hoyCount || 0;
    document.getElementById('statErrores').textContent = errores || 0;
    document.getElementById('statUsuarios').textContent = usuariosUnicos;
  } catch (err) {
    console.warn('Error al cargar estadísticas:', err);
  }
}

// ============================================
// UTILIDADES
// ============================================
function limpiarFiltros() {
  document.getElementById('filtroModulo').value = '';
  document.getElementById('filtroEmail').value = '';
  const hoy = new Date();
  const hace30 = new Date();
  hace30.setDate(hoy.getDate() - 30);
  document.getElementById('filtroFechaHasta').value = hoy.toISOString().split('T')[0];
  document.getElementById('filtroFechaDesde').value = hace30.toISOString().split('T')[0];
  logsState.paginaActual = 1;
  cargarLogs();
}

function exportarLogsCSV() {
  if (!logsState.datosFiltrados || logsState.datosFiltrados.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  const headers = ['Fecha', 'Usuario', 'Rol', 'Módulo', 'Acción', 'Descripción', 'Nivel'];
  const rows = logsState.datosFiltrados.map(log => {
    const fecha = new Date(log.fecha).toLocaleString('es-ES');
    return [
      fecha,
      log.usuario_email,
      log.usuario_rol,
      log.modulo,
      log.accion,
      `"${(log.descripcion || '').replace(/"/g, '""')}"`,
      log.nivel || 'info'
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  registrarLog('logs', 'exportar', 'Exportó logs a CSV');
}

async function limpiarLogsAntiguos() {
  if (!confirm('¿Estás seguro de eliminar los logs de más de 30 días? Esta acción no se puede deshacer.')) return;

  try {
    const hace30 = new Date();
    hace30.setDate(hace30.getDate() - 30);

    const { error, count } = await supabaseClient
      .from('logs_actividad')
      .delete()
      .lt('fecha', hace30.toISOString())
      .select('*', { count: 'exact' });

    if (error) throw error;

    alert(`✅ Se eliminaron ${count || 0} registros antiguos`);
    registrarLog('logs', 'limpiar_antiguos', `Eliminó ${count || 0} logs de más de 30 días`);
    cargarLogs();
    cargarEstadisticas();
  } catch (err) {
    alert('❌ Error al limpiar logs: ' + err.message);
  }
}
