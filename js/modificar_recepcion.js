// ==========================================
// VARIABLES GLOBALES
// ==========================================
let recepcionesModCache = [];
let paginaActualModRec = 1;
const POR_PAGINA_MODREC = 20;
let totalModRec = 0;
let recepcionEditando = null;
let itemsEdicionRec = [];
let usuarioActualModRec = null;

// Cola de escaneos (múltiples escáneres)
let colaEscaneosModRec = [];
let procesandoEscaneoModRec = false;

// ==========================================
// ✅ FUNCIÓN FECHA CARACAS
// ==========================================
function obtenerFechaHoyCaracasModRec() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas', year: 'numeric', month: '2-digit', day: '2-digit' });
}

// ==========================================
// ✅ NORMALIZAR CÓDIGO (con/sin guiones)
// ==========================================
function normalizarCodigoModRec(codigo) {
  return (codigo || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

// ==========================================
// ✅ INYECTAR ESTILOS
// ==========================================
function inyectarEstilosModRecepcion() {
  if (document.getElementById('estilos-modificar-recepcion')) return;
  const style = document.createElement('style');
  style.id = 'estilos-modificar-recepcion';
  style.textContent = `
    .container { max-width: 1400px; margin: 0 auto; padding: 30px; }
    .page-header { margin-bottom: 25px; }
    .page-title { font-family: 'Libre Caslon Text', serif; color: #1e3a8a; font-size: 28px; margin-bottom: 8px; }
    .page-subtitle { color: #6b7280; font-size: 14px; }
    fieldset { background-color: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 25px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
    legend { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600; }
    .btn-action { padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s; font-family: 'Poppins', sans-serif; margin-right: 8px; }
    .btn-primary { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; }
    .btn-secondary { background-color: #6b7280; color: white; }
    .btn-success { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; }
    .btn-warning { background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); color: white; }
    .btn-action:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .table-container { overflow-x: auto; margin-top: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
    table { width: 100%; border-collapse: collapse; background: white; }
    th { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    .contador-info { background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 15px; font-weight: 700; color: #1e40af; }
    .paginacion { margin-top: 20px; display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
    .paginacion button { padding: 8px 16px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .paginacion button:disabled { opacity: 0.4; cursor: not-allowed; }
    .badge-estado { padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; display: inline-block; }
    .estado-completa { background: #d1fae5; color: #065f46; }
    .estado-con_faltantes { background: #fee2e2; color: #991b1b; }
    .estado-parcial { background: #fef3c7; color: #92400e; }
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
    .escaner-section { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 25px; border-radius: 12px; border: 2px dashed #3b82f6; margin-bottom: 20px; text-align: center; }
    .escaner-input { width: 100%; padding: 15px 20px; font-size: 18px; font-family: 'Courier New', monospace; font-weight: 700; text-align: center; border: 3px solid #1e3a8a; border-radius: 8px; letter-spacing: 2px; text-transform: uppercase; }
    .escaner-input:focus { outline: none; border-color: #10b981; box-shadow: 0 0 0 4px rgba(16,185,129,0.2); }
    .item-recibido { background: #d1fae5 !important; border-left: 4px solid #10b981; }
    .item-faltante { background: #fee2e2 !important; border-left: 4px solid #dc2626; }
    .item-modificado { animation: flashModRec 0.6s; }
    @keyframes flashModRec { 0% { background: #fef3c7; } 100% { background: transparent; } }
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
async function inicializarModificarRecepcion() {
  console.log('✏️ === INICIANDO MODIFICAR RECEPCIÓN ===');
  inyectarEstilosModRecepcion();

  // Reset
  recepcionesModCache = [];
  recepcionEditando = null;
  itemsEdicionRec = [];
  colaEscaneosModRec = [];

  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }
  if (typeof supabaseClient === 'undefined') {
    mostrarToastModRec('Error: Supabase no está disponible', 'error');
    return;
  }

  await cargarUsuarioModRec();
  configurarInputEscaneoModRec();
  await cargarRecepcionesModificables();

  console.log('✅ === MODIFICAR RECEPCIÓN INICIALIZADO ===');
}

// ==========================================
// CARGAR USUARIO
// ==========================================
async function cargarUsuarioModRec() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    const { data } = await supabaseClient
      .from('usuarios')
      .select('*')
      .eq('email', session.user.email)
      .maybeSingle();
    usuarioActualModRec = data || { email: session.user.email, id: session.user.id, rol: 'consultor' };
  } catch (err) {
    console.error('Error al cargar usuario:', err);
  }
}

// ==========================================
// ✅ CARGAR RECEPCIONES (1 SOLA CONSULTA)
// ==========================================
async function cargarRecepcionesModificables() {
  const tbody = document.getElementById('tbodyListaModRec');
  if (!tbody) return;

  const filtroTexto = document.getElementById('filtroBusquedaModRec')?.value.trim() || '';
  const soloFaltantes = document.getElementById('filtroSoloFaltantes')?.checked || false;

  // Skeleton
  tbody.innerHTML = Array(5).fill(0).map(() => `<tr><td colspan="9" style="padding:14px;"><div style="height:16px; background:#f0f0f0; border-radius:4px;"></div></td></tr>`).join('');

  try {
    let query = supabaseClient
      .from('recepcion_equipos')
      .select('*', { count: 'exact' })
      .order('fecha_recepcion', { ascending: false });

    if (filtroTexto) {
      query = query.or(`numero_recepcion.ilike.%${filtroTexto}%,numero_renta.ilike.%${filtroTexto}%,cliente_nombre.ilike.%${filtroTexto}%`);
    }
    if (soloFaltantes) {
      query = query.gt('equipos_faltantes', 0);
    }

    const desde = (paginaActualModRec - 1) * POR_PAGINA_MODREC;
    const hasta = desde + POR_PAGINA_MODREC - 1;
    query = query.range(desde, hasta);

    const { data, error, count } = await query;
    if (error) throw error;

    recepcionesModCache = data || [];
    totalModRec = count || 0;

    const contador = document.getElementById('contadorModRec');
    if (contador) contador.textContent = `Total: ${totalModRec} recepción(es)`;

    renderizarListaModRec();
    renderizarPaginacionModRec();
  } catch (err) {
    console.error('Error al cargar recepciones:', err);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:40px; color:#ef4444;">Error: ${err.message}</td></tr>`;
  }
}

// ==========================================
// RENDERIZAR LISTA
// ==========================================
function renderizarListaModRec() {
  const tbody = document.getElementById('tbodyListaModRec');
  if (!tbody) return;

  if (recepcionesModCache.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px; color: #6b7280;">
          <div style="font-size: 40px; margin-bottom: 10px;">📭</div>
          <div>No se encontraron recepciones con los filtros aplicados</div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = recepcionesModCache.map((rec, index) => {
    const globalIndex = (paginaActualModRec - 1) * POR_PAGINA_MODREC + index + 1;
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
          <button type="button" onclick="seleccionarRecepcionMod(${rec.id})"
                  class="btn-action btn-primary" style="padding: 6px 14px; font-size: 12px; margin-right: 0;">
            ✏️ Editar
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================
// PAGINACIÓN
// ==========================================
function renderizarPaginacionModRec() {
  const cont = document.getElementById('paginacionModRec');
  if (!cont) return;
  const totalPaginas = Math.ceil(totalModRec / POR_PAGINA_MODREC);
  if (totalPaginas <= 1) {
    cont.innerHTML = `<span style="color: #6b7280; font-size: 13px;">Página 1 de 1</span>`;
    return;
  }
  cont.innerHTML = `
    <button onclick="cambiarPaginaModRec(${paginaActualModRec - 1})" ${paginaActualModRec === 1 ? 'disabled' : ''}>‹ Anterior</button>
    <span style="font-weight: 600;">Página ${paginaActualModRec} de ${totalPaginas}</span>
    <button onclick="cambiarPaginaModRec(${paginaActualModRec + 1})" ${paginaActualModRec === totalPaginas ? 'disabled' : ''}>Siguiente ›</button>
  `;
}

async function cambiarPaginaModRec(nuevaPagina) {
  const totalPaginas = Math.ceil(totalModRec / POR_PAGINA_MODREC);
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
  paginaActualModRec = nuevaPagina;
  await cargarRecepcionesModificables();
}

// ==========================================
// ✅ SELECCIONAR RECEPCIÓN PARA EDITAR
// ==========================================
async function seleccionarRecepcionMod(recepcionId) {
  try {
    const recepcion = recepcionesModCache.find(r => r.id === recepcionId);
    if (!recepcion) {
      mostrarToastModRec('Recepción no encontrada', 'error');
      return;
    }

    const { data: items, error } = await supabaseClient
      .from('recepcion_equipos_items')
      .select('*')
      .eq('recepcion_id', recepcionId)
      .order('id', { ascending: true });

    if (error) throw error;

    recepcionEditando = recepcion;
    // Guardar estado original para detectar cambios
    itemsEdicionRec = (items || []).map(item => ({
      ...item,
      estado_original: item.estado_recepcion,
      modificado: false
    }));

    document.getElementById('edicionNumeroRecepcion').textContent = `#${recepcion.numero_recepcion}`;
    document.getElementById('observacionesModRec').value = '';
    document.getElementById('btnImprimirModRec').style.display = 'none';

    const btnGuardar = document.getElementById('btnGuardarModRec');
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = '💾 Guardar Cambios';
    }

    renderizarInfoEdicion();
    renderizarItemsEdicionRec();
    actualizarEstadisticasModRec();
    actualizarIndicadorCambios();

    document.getElementById('fieldsetListaModRec').style.display = 'none';
    document.getElementById('fieldsetEdicionModRec').style.display = 'block';
    document.getElementById('fieldsetEdicionModRec').scrollIntoView({ behavior: 'smooth', block: 'start' });

    setTimeout(() => {
      document.getElementById('inputEscaneoModRec')?.focus();
    }, 300);
  } catch (err) {
    console.error('Error al seleccionar recepción:', err);
    mostrarToastModRec('Error al cargar recepción: ' + err.message, 'error');
  }
}

// ==========================================
// RENDERIZAR INFO DE LA RECEPCIÓN
// ==========================================
function renderizarInfoEdicion() {
  const rec = recepcionEditando;
  const container = document.getElementById('edicionInfoRecepcion');
  if (!container) return;
  const fechaRec = rec.fecha_recepcion ? new Date(rec.fecha_recepcion).toLocaleString('es-ES') : '-';

  container.innerHTML = `
    <div class="renta-info-box"><label>📋 N° Renta</label><strong>${rec.numero_renta}</strong></div>
    <div class="renta-info-box"><label>👤 Cliente</label><strong>${rec.cliente_nombre}</strong></div>
    <div class="renta-info-box"><label>📅 Recepción</label><strong>${fechaRec}</strong></div>
    <div class="renta-info-box"><label>👷 Recibido Por</label><strong>${rec.recibido_por_email || 'N/A'}</strong></div>
  `;
}

// ==========================================
// RENDERIZAR ITEMS EN EDICIÓN
// ==========================================
function renderizarItemsEdicionRec() {
  const tbody = document.getElementById('tbodyEdicionItems');
  if (!tbody) return;

  const esAdmin = usuarioActualModRec?.rol === 'administrador';

  tbody.innerHTML = itemsEdicionRec.map((item, index) => {
    const estadoClass = `item-${item.estado_recepcion}`;
    const estadoIcono = item.estado_recepcion === 'recibido' ? '✅' :
                        item.estado_recepcion === 'faltante' ? '❌' : '⏳';
    const estadoTexto = item.estado_recepcion === 'recibido' ? 'Recibido' :
                        item.estado_recepcion === 'faltante' ? 'Faltante' : 'Pendiente';

    // Botón de acción según el estado actual
    let botonAccion = '';
    if (item.estado_recepcion === 'faltante') {
      botonAccion = `
        <button type="button" class="btn-action btn-success" style="padding: 6px 14px; font-size: 12px; margin-right: 0;"
                onclick="marcarComoRecibidoManual(${item.id})">
          ✅ Marcar Recibido
        </button>
      `;
    } else if (item.estado_recepcion === 'recibido' && esAdmin) {
      botonAccion = `
        <button type="button" class="btn-action btn-warning" style="padding: 6px 14px; font-size: 12px; margin-right: 0;"
                onclick="marcarComoFaltanteManual(${item.id})">
          ↩️ Devolver a Faltante
        </button>
      `;
    } else if (item.estado_recepcion === 'recibido' && !esAdmin) {
      botonAccion = `<span style="font-size: 11px; color: #9ca3af;">Solo admin puede revertir</span>`;
    }

    return `
      <tr class="${estadoClass}" id="fila-modrec-${item.id}">
        <td>${index + 1}</td>
        <td style="font-family: monospace; font-size: 11px;">${item.codigo_barras}</td>
        <td><strong>${item.nombre_equipo}</strong></td>
        <td>${item.serial || '-'}</td>
        <td style="text-align: center;">${item.cantidad}</td>
        <td style="text-align: center;" id="estado-modrec-${item.id}">
          <strong>${estadoIcono} ${estadoTexto}</strong>
        </td>
        <td style="text-align: center;" id="accion-modrec-${item.id}">${botonAccion}</td>
      </tr>
    `;
  }).join('');
}

// ==========================================
// ✅ CONFIGURAR INPUT DE ESCANEO
// ==========================================
function configurarInputEscaneoModRec() {
  const input = document.getElementById('inputEscaneoModRec');
  if (!input || input.dataset.modRecListenerAttached) return;

  input.addEventListener('input', (e) => {
    const cursorPos = e.target.selectionStart;
    e.target.value = e.target.value.toUpperCase();
    e.target.setSelectionRange(cursorPos, cursorPos);
  });

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const codigo = input.value.trim();
      if (codigo) {
        colaEscaneosModRec.push(codigo);
        procesarColaEscaneosModRec();
      }
      input.value = '';
      input.focus();
    }
  });

  input.dataset.modRecListenerAttached = 'true';
}

// ==========================================
// PROCESAR COLA DE ESCANEOS
// ==========================================
async function procesarColaEscaneosModRec() {
  if (procesandoEscaneoModRec) return;
  procesandoEscaneoModRec = true;

  while (colaEscaneosModRec.length > 0) {
    const codigo = colaEscaneosModRec.shift();
    try {
      await procesarEscaneoModRec(codigo);
    } catch (err) {
      console.error('Error procesando escaneo:', err);
    }
  }

  procesandoEscaneoModRec = false;
  document.getElementById('inputEscaneoModRec')?.focus();
}

// ==========================================
// ✅ PROCESAR ESCANEO (FALTANTE → RECIBIDO)
// ==========================================
async function procesarEscaneoModRec(codigo) {
  if (!codigo || !recepcionEditando) return;

  codigo = codigo.replace(/['"`]/g, '').trim();
  const codigoNormalizado = normalizarCodigoModRec(codigo);
  if (!codigoNormalizado) return;

  // Buscar entre los items FALTANTES de esta recepción
  const itemFaltante = itemsEdicionRec.find(item =>
    item.estado_recepcion === 'faltante' &&
    (normalizarCodigoModRec(item.codigo_barras) === codigoNormalizado ||
     (item.serial && normalizarCodigoModRec(item.serial) === codigoNormalizado))
  );

  if (itemFaltante) {
    // ✅ Cambiar a recibido
    itemFaltante.estado_recepcion = 'recibido';
    itemFaltante.modificado = true;
    itemFaltante.fecha_escaneo = new Date().toISOString();
    itemFaltante.escaneado_por = usuarioActualModRec?.email || 'unknown';
    itemFaltante.observacion_item = 'Equipo faltante recibido posteriormente';

    actualizarFilaModRec(itemFaltante);
    actualizarEstadisticasModRec();
    actualizarIndicadorCambios();
    mostrarToastModRec(`✅ ${itemFaltante.nombre_equipo} marcado como RECIBIDO`, 'exito');
    return;
  }

  // Verificar si ya está recibido
  const itemRecibido = itemsEdicionRec.find(item =>
    item.estado_recepcion === 'recibido' &&
    (normalizarCodigoModRec(item.codigo_barras) === codigoNormalizado ||
     (item.serial && normalizarCodigoModRec(item.serial) === codigoNormalizado))
  );

  if (itemRecibido) {
    mostrarToastModRec(`ℹ️ ${itemRecibido.nombre_equipo} ya está como recibido`, 'warning');
    return;
  }

  // No está en la recepción
  mostrarToastModRec(`⚠️ Código "${codigo}" no corresponde a equipos faltantes de esta recepción`, 'error');
}

// ==========================================
// ✅ MARCAR MANUALMENTE COMO RECIBIDO
// ==========================================
function marcarComoRecibidoManual(itemId) {
  const item = itemsEdicionRec.find(i => i.id === itemId);
  if (!item) return;

  item.estado_recepcion = 'recibido';
  item.modificado = true;
  item.fecha_escaneo = new Date().toISOString();
  item.escaneado_por = usuarioActualModRec?.email || 'unknown';
  item.observacion_item = 'Equipo faltante recibido posteriormente';

  actualizarFilaModRec(item);
  actualizarEstadisticasModRec();
  actualizarIndicadorCambios();
  mostrarToastModRec(`✅ ${item.nombre_equipo} marcado como RECIBIDO`, 'exito');
}

// ==========================================
// ✅ DEVOLVER A FALTANTE (SOLO ADMIN)
// ==========================================
function marcarComoFaltanteManual(itemId) {
  if (usuarioActualModRec?.rol !== 'administrador') {
    mostrarToastModRec('⚠️ Solo administradores pueden revertir un equipo a faltante', 'error');
    return;
  }

  const item = itemsEdicionRec.find(i => i.id === itemId);
  if (!item) return;

  item.estado_recepcion = 'faltante';
  item.modificado = true;
  item.observacion_item = 'Equipo devuelto a faltante por administrador';

  actualizarFilaModRec(item);
  actualizarEstadisticasModRec();
  actualizarIndicadorCambios();
  mostrarToastModRec(`↩️ ${item.nombre_equipo} devuelto a FALTANTE`, 'warning');
}

// ==========================================
// ACTUALIZAR FILA INDIVIDUAL (SIN RE-RENDERIZAR)
// ==========================================
function actualizarFilaModRec(item) {
  const fila = document.getElementById(`fila-modrec-${item.id}`);
  if (!fila) return;

  const estadoIcono = item.estado_recepcion === 'recibido' ? '✅' :
                      item.estado_recepcion === 'faltante' ? '❌' : '⏳';
  const estadoTexto = item.estado_recepcion === 'recibido' ? 'Recibido' :
                      item.estado_recepcion === 'faltante' ? 'Faltante' : 'Pendiente';

  fila.className = `item-${item.estado_recepcion} item-modificado`;

  const celdaEstado = document.getElementById(`estado-modrec-${item.id}`);
  if (celdaEstado) celdaEstado.innerHTML = `<strong>${estadoIcono} ${estadoTexto}</strong>`;

  // Actualizar botón de acción
  const celdaAccion = document.getElementById(`accion-modrec-${item.id}`);
  if (celdaAccion) {
    const esAdmin = usuarioActualModRec?.rol === 'administrador';
    if (item.estado_recepcion === 'faltante') {
      celdaAccion.innerHTML = `<button type="button" class="btn-action btn-success" style="padding:6px 14px; font-size:12px; margin-right:0;" onclick="marcarComoRecibidoManual(${item.id})">✅ Marcar Recibido</button>`;
    } else if (item.estado_recepcion === 'recibido' && esAdmin) {
      celdaAccion.innerHTML = `<button type="button" class="btn-action btn-warning" style="padding:6px 14px; font-size:12px; margin-right:0;" onclick="marcarComoFaltanteManual(${item.id})">↩️ Devolver a Faltante</button>`;
    } else {
      celdaAccion.innerHTML = `<span style="font-size: 11px; color: #9ca3af;">Solo admin puede revertir</span>`;
    }
  }
}

// ==========================================
// ACTUALIZAR ESTADÍSTICAS
// ==========================================
function actualizarEstadisticasModRec() {
  const total = itemsEdicionRec.length;
  const recibidos = itemsEdicionRec.filter(i => i.estado_recepcion === 'recibido').length;
  const faltantes = itemsEdicionRec.filter(i => i.estado_recepcion !== 'recibido').length;

  document.getElementById('modStatTotal').textContent = total;
  document.getElementById('modStatRecibidos').textContent = recibidos;
  document.getElementById('modStatFaltantes').textContent = faltantes;
}

// ==========================================
// ✅ INDICADOR DE CAMBIOS SIN GUARDAR
// ==========================================
function actualizarIndicadorCambios() {
  const cambios = itemsEdicionRec.filter(i => i.modificado).length;
  const indicador = document.getElementById('indicadorCambios');
  const contador = document.getElementById('contadorCambios');

  if (indicador) indicador.style.display = cambios > 0 ? 'block' : 'none';
  if (contador) contador.textContent = cambios;
}

// ==========================================
// ✅ GUARDAR MODIFICACIÓN
// ==========================================
async function guardarModificacionRecepcion() {
  if (!recepcionEditando) return;

  const itemsModificados = itemsEdicionRec.filter(i => i.modificado);

  if (itemsModificados.length === 0) {
    mostrarToastModRec('ℹ️ No hay cambios para guardar', 'warning');
    return;
  }

  const btnGuardar = document.getElementById('btnGuardarModRec');
  if (btnGuardar) {
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '⏳ Guardando...';
  }

  try {
    // 1. Actualizar cada item modificado (en lote)
    const actualizaciones = itemsModificados.map(item =>
      supabaseClient
        .from('recepcion_equipos_items')
        .update({
          estado_recepcion: item.estado_recepcion,
          observacion_item: item.observacion_item,
          fecha_escaneo: item.fecha_escaneo,
          escaneado_por: item.escaneado_por
        })
        .eq('id', item.id)
    );

    await Promise.all(actualizaciones);

    // 2. Recalcular contadores
    const nuevosRecibidos = itemsEdicionRec.filter(i => i.estado_recepcion === 'recibido').length;
    const nuevosFaltantes = itemsEdicionRec.filter(i => i.estado_recepcion !== 'recibido').length;

    // Determinar nuevo estado
    let nuevoEstado = 'completa';
    if (nuevosFaltantes > 0) nuevoEstado = 'con_faltantes';

    // 3. Construir nota de modificación
    const observacionesMod = document.getElementById('observacionesModRec')?.value.trim() || '';
    const recibidosAhora = itemsModificados.filter(i => i.estado_recepcion === 'recibido').length;
    const faltantesAhora = itemsModificados.filter(i => i.estado_recepcion === 'faltante').length;

    let notaModificacion = `Modificada el ${new Date().toLocaleString('es-ES')}: `;
    if (recibidosAhora > 0) notaModificacion += `${recibidosAhora} equipo(s) faltante(s) recibidos. `;
    if (faltantesAhora > 0) notaModificacion += `${faltantesAhora} equipo(s) devueltos a faltante. `;
    if (observacionesMod) notaModificacion += `Obs: ${observacionesMod}`;

    // 4. Actualizar la recepción principal
    const { error: errorUpdate } = await supabaseClient
      .from('recepcion_equipos')
      .update({
        equipos_recibidos: nuevosRecibidos,
        equipos_faltantes: nuevosFaltantes,
        estado: nuevoEstado,
        observaciones: notaModificacion
      })
      .eq('id', recepcionEditando.id);

    if (errorUpdate) throw errorUpdate;

    // 5. Actualizar la copia en el objeto local
    recepcionEditando.equipos_recibidos = nuevosRecibidos;
    recepcionEditando.equipos_faltantes = nuevosFaltantes;
    recepcionEditando.estado = nuevoEstado;
    recepcionEditando.observaciones = notaModificacion;

    // 6. Registrar log
    if (typeof registrarLog === 'function') {
      const descripcion = `Modificó Recepción ${recepcionEditando.numero_recepcion} | Renta: ${recepcionEditando.numero_renta} | Cliente: ${recepcionEditando.cliente_nombre} | Cambios: ${itemsModificados.length} | Recibidos totales: ${nuevosRecibidos}/${itemsEdicionRec.length} | Faltantes: ${nuevosFaltantes} | Por: ${usuarioActualModRec?.email || 'Desconocido'}`;
      await registrarLog('rentar', 'Recepción modificada', descripcion, 'warning');
    }

    mostrarToastModRec(`✅ Recepción ${recepcionEditando.numero_recepcion} actualizada correctamente`, 'exito');

    // Resetear flags de modificación
    itemsEdicionRec.forEach(i => i.modificado = false);
    actualizarIndicadorCambios();

    // Mostrar botón imprimir
    document.getElementById('btnImprimirModRec').style.display = 'inline-block';

    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = '✅ Guardada';
    }

    // Imprimir automáticamente
    setTimeout(() => imprimirComprobanteModRec(), 800);

  } catch (err) {
    console.error('Error al guardar modificación:', err);
    mostrarToastModRec('Error al guardar: ' + err.message, 'error');
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = '💾 Guardar Cambios';
    }
  }
}

// ==========================================
// CANCELAR MODIFICACIÓN
// ==========================================
function cancelarModificacionRecepcion() {
  const cambios = itemsEdicionRec.filter(i => i.modificado).length;
  if (cambios > 0 && !confirm(`¿Cancelar la modificación? Se perderán ${cambios} cambio(s) sin guardar.`)) {
    return;
  }

  recepcionEditando = null;
  itemsEdicionRec = [];
  colaEscaneosModRec = [];

  document.getElementById('fieldsetEdicionModRec').style.display = 'none';
  document.getElementById('fieldsetListaModRec').style.display = 'block';

  cargarRecepcionesModificables();
}

// ==========================================
// ✅ IMPRIMIR COMPROBANTE DE MODIFICACIÓN (TAMAÑO CARTA)
// ==========================================
function imprimirComprobanteModRec() {
  if (!recepcionEditando) {
    mostrarToastModRec('No hay recepción para imprimir', 'error');
    return;
  }

  const rec = recepcionEditando;
  const logoUrl = new URL('img/logo.png', window.location.href).href;
  const fechaRec = rec.fecha_recepcion ? new Date(rec.fecha_recepcion).toLocaleString('es-ES') : '-';

  const itemsHTML = itemsEdicionRec.map((item, i) => {
    const icono = item.estado_recepcion === 'recibido' ? '✅' :
                  item.estado_recepcion === 'faltante' ? '❌' : '⏳';
    const color = item.estado_recepcion === 'recibido' ? '#10b981' :
                  item.estado_recepcion === 'faltante' ? '#dc2626' : '#f59e0b';
    // Marcar visualmente los que fueron modificados en esta edición
    const marcaModificado = item.modificado ? ' 🔸' : '';
    const hora = item.fecha_escaneo ?
      new Date(item.fecha_escaneo).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '-';
    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${i + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 10px;">${item.codigo_barras}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>${item.nombre_equipo}</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.serial || '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.cantidad}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center; color: ${color}; font-weight: 700;">${icono} ${item.estado_recepcion.toUpperCase()}${marcaModificado}</td>
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
<title>Comprobante Modificado - Recepción ${rec.numero_recepcion}</title>
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
.aviso-modificacion { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px 15px; border-radius: 6px; font-size: 12px; color: #92400e; margin-bottom: 15px; text-align: center; }
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
.leyenda { font-size: 11px; color: #6b7280; margin-top: 10px; font-style: italic; }
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
<div class="numero-box"><div style="font-size:10px; color:#666;">COMPROBANTE DE RECEPCIÓN (MODIFICADO) N°</div><div class="valor">${rec.numero_recepcion}</div></div>
</div>
<div class="aviso-modificacion">📝 Este comprobante refleja una <strong>modificación</strong> de la recepción original. Los equipos marcados con 🔸 fueron actualizados en esta edición.</div>
<div class="estado-final">ESTADO ACTUAL DE LA RECEPCIÓN: ${estadoTexto}</div>
<div class="info-grid">
<div class="info-box">
<h3>👤 Cliente</h3>
<p><strong>Nombre:</strong> ${rec.cliente_nombre}</p>
<p><strong>Teléfono:</strong> ${rec.cliente_telefono || 'N/A'}</p>
<p><strong>Renta:</strong> ${rec.numero_renta}</p>
</div>
<div class="info-box">
<h3>📅 Detalles</h3>
<p><strong>Fecha Recepción Original:</strong> ${fechaRec}</p>
<p><strong>Última Modificación:</strong> ${new Date().toLocaleString('es-ES')}</p>
<p><strong>Modificado por:</strong> ${usuarioActualModRec?.email || 'N/A'}</p>
</div>
</div>
<div class="stats">
<div class="stat-box" style="border-color:#1e3a8a; background:#eff6ff;"><div class="num" style="color:#1e3a8a;">${itemsEdicionRec.length}</div><div>TOTAL</div></div>
<div class="stat-box" style="border-color:#10b981; background:#d1fae5;"><div class="num" style="color:#10b981;">${rec.equipos_recibidos}</div><div>RECIBIDOS</div></div>
<div class="stat-box" style="border-color:#dc2626; background:#fee2e2;"><div class="num" style="color:#dc2626;">${rec.equipos_faltantes}</div><div>FALTANTES</div></div>
</div>
<table>
<thead><tr><th>#</th><th>Código</th><th>Equipo</th><th>Serial</th><th style="text-align:center;">Cant.</th><th style="text-align:center;">Estado</th><th style="text-align:center;">Hora</th></tr></thead>
<tbody>${itemsHTML}</tbody>
</table>
<div class="leyenda">🔸 = Equipo actualizado en esta modificación | ✅ = Recibido | ❌ = Faltante</div>
${rec.observaciones ? `<div style="padding:15px; background:#fef3c7; border-left:4px solid #f59e0b; border-radius:4px; margin-top:15px;"><strong>📝 Observaciones:</strong> ${rec.observaciones}</div>` : ''}
<div class="firmas">
<div><div class="firma-line"><p><strong>${rec.cliente_nombre}</strong></p><p>Cliente / Responsable</p></div></div>
<div><div class="firma-line"><p><strong>${usuarioActualModRec?.email || 'Responsable'}</strong></p><p>Modificado por</p></div></div>
</div>
<div class="footer"><p>©copyright Eventos de Primera | 2026-2027 | Comprobante modificado el ${new Date().toLocaleString('es-ES')}</p></div>
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
function mostrarToastModRec(texto, tipo) {
  let toastContainer = document.getElementById('toastContainerModRec');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainerModRec';
    toastContainer.style.cssText = `position: fixed; top: 80px; right: 20px; z-index: 999999; display: flex; flex-direction: column; gap: 10px; max-width: 380px; pointer-events: none;`;
    document.body.appendChild(toastContainer);
  }
  const bgColor = tipo === 'exito' ? '#d1fae5' : (tipo === 'error' ? '#fee2e2' : '#fef3c7');
  const borderColor = tipo === 'exito' ? '#10b981' : (tipo === 'error' ? '#dc2626' : '#f59e0b');
  const textColor = tipo === 'exito' ? '#065f46' : (tipo === 'error' ? '#991b1b' : '#92400e');
  const icono = tipo === 'exito' ? '✅' : (tipo === 'error' ? '⚠️' : 'ℹ️');
  const toast = document.createElement('div');
  toast.style.cssText = `background:${bgColor}; border-left:4px solid ${borderColor}; color:${textColor}; padding:12px 16px; border-radius:8px; font-size:13px; font-family:'Poppins',sans-serif; font-weight:500; box-shadow:0 4px 12px rgba(0,0,0,0.2); animation: toastInModRec 0.3s ease; display:flex; align-items:center; gap:10px; pointer-events:auto;`;
  toast.innerHTML = `<span>${icono}</span><span style="flex:1;">${texto}</span><span onclick="this.parentElement.remove()" style="cursor:pointer; opacity:0.6;">✕</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => { if (toast.parentElement) { toast.style.animation = 'toastOutModRec 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); } }, 3000);
}
if (!document.getElementById('toastStylesModRec')) {
  const style = document.createElement('style');
  style.id = 'toastStylesModRec';
  style.textContent = `@keyframes toastInModRec { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes toastOutModRec { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }`;
  document.head.appendChild(style);
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  inicializarModificarRecepcion();
});
