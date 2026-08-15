// ==========================================
// VARIABLES GLOBALES
// ==========================================
let rentasPendientes = [];
let rentaSeleccionadaRecepcion = null;
let itemsRecepcion = [];
let usuarioActualRecepcion = null;
let numeroRecepcionActual = null;
let recepcionGuardadaId = null;

// ✅ Cola de escaneos para múltiples escáneres simultáneos
let colaEscaneosRecepcion = [];
let procesandoEscaneoRecepcion = false;

// ==========================================
// ✅ INYECTAR ESTILOS CSS (porque el dashboard descarta el <head>)
// ==========================================
function inyectarEstilosRecepcion() {
  if (document.getElementById('estilos-recepcion-inyectados')) return;
  const style = document.createElement('style');
  style.id = 'estilos-recepcion-inyectados';
  style.textContent = `
    .container { max-width: 1400px; margin: 0 auto; padding: 30px; }
    .page-header { margin-bottom: 25px; }
    .page-title { font-family: 'Libre Caslon Text', serif; color: #1e3a8a; font-size: 28px; margin-bottom: 8px; }
    .page-subtitle { color: #6b7280; font-size: 14px; }
    fieldset { background-color: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 25px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
    legend { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600; letter-spacing: 0.5px; }
    .table-container { overflow-x: auto; margin-top: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
    table { width: 100%; border-collapse: collapse; background: white; }
    th { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    tr:hover { background: #f9fafb; }
    .btn-action { padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s; font-family: 'Poppins', sans-serif; margin-right: 10px; }
    .btn-primary { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(30,58,138,0.3); }
    .btn-secondary { background-color: #6b7280; color: white; }
    .btn-success { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; }
    .btn-danger { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; }
    .button-group { margin-top: 25px; padding-top: 20px; border-top: 2px solid #e5e7eb; display: flex; flex-wrap: wrap; gap: 10px; }
    .mensaje { padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; display: none; }
    .mensaje.exito { background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; display: block; }
    .mensaje.error { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; display: block; }
    .mensaje.warning { background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; display: block; }
    .badge-activa { background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-vencida { background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; animation: pulseRecepcion 2s infinite; }
    .item-pendiente { background: #f9fafb; }
    .item-recibido { background: #d1fae5 !important; border-left: 4px solid #10b981; }
    .item-faltante { background: #fee2e2 !important; border-left: 4px solid #dc2626; }
    .item-escaneando { background: #dbeafe !important; animation: flashRecepcion 0.5s; }
    @keyframes pulseRecepcion { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    @keyframes flashRecepcion { 0% { background: #fef3c7; } 100% { background: #d1fae5; } }
    .progress-container { background: #f3f4f6; border-radius: 20px; overflow: hidden; height: 30px; margin: 15px 0; position: relative; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); }
    .progress-bar { height: 100%; background: linear-gradient(90deg, #10b981 0%, #34d399 100%); transition: width 0.5s ease; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 13px; }
    .progress-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #374151; font-weight: 600; font-size: 13px; z-index: 2; text-shadow: 0 0 3px white, 0 0 3px white; }
    .escaner-section { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 25px; border-radius: 12px; border: 2px dashed #3b82f6; margin-bottom: 20px; text-align: center; }
    .escaner-input { width: 100%; padding: 15px 20px; font-size: 18px; font-family: 'Courier New', monospace; font-weight: 700; text-align: center; border: 3px solid #1e3a8a; border-radius: 8px; letter-spacing: 2px; text-transform: uppercase; }
    .escaner-input:focus { outline: none; border-color: #10b981; box-shadow: 0 0 0 4px rgba(16,185,129,0.2); }
    .renta-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
    .renta-info-box { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .renta-info-box label { font-size: 11px; color: #6b7280; text-transform: uppercase; display: block; margin-bottom: 5px; font-weight: 600; }
    .renta-info-box strong { color: #1e3a8a; font-size: 14px; display: block; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
    .stat-card { background: white; padding: 20px; border-radius: 12px; text-align: center; border-top: 4px solid; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .stat-card.total { border-color: #1e3a8a; }
    .stat-card.recibidos { border-color: #10b981; }
    .stat-card.pendientes { border-color: #f59e0b; }
    .stat-card.faltantes { border-color: #dc2626; }
    .stat-number { font-size: 32px; font-weight: 700; font-family: 'Courier New', monospace; margin-bottom: 5px; }
    .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
    .stat-card.total .stat-number { color: #1e3a8a; }
    .stat-card.recibidos .stat-number { color: #10b981; }
    .stat-card.pendientes .stat-number { color: #f59e0b; }
    .stat-card.faltantes .stat-number { color: #dc2626; }
    .faltante-checkbox { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .faltante-checkbox input[type="checkbox"] { width: 20px; height: 20px; cursor: pointer; accent-color: #dc2626; }
    .faltante-checkbox label { cursor: pointer; font-size: 12px; color: #dc2626; font-weight: 600; }
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .renta-info { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);
}

// ==========================================
// ✅ NORMALIZAR CÓDIGO (quita guiones y espacios, mayúsculas)
// ==========================================
function normalizarCodigo(codigo) {
  return (codigo || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarRecepcionEquipos() {
  console.log('📥 === INICIANDO RECEPCIÓN DE EQUIPOS ===');

  // ✅ Inyectar estilos primero
  inyectarEstilosRecepcion();

  // Resetear estado
  rentasPendientes = [];
  rentaSeleccionadaRecepcion = null;
  itemsRecepcion = [];
  colaEscaneosRecepcion = [];
  numeroRecepcionActual = null;
  recepcionGuardadaId = null;

  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }

  if (typeof supabaseClient === 'undefined') {
    mostrarToastRecepcion('Error: Supabase no está disponible', 'error');
    return;
  }

  await cargarUsuarioRecepcion();
  configurarInputEscaneo();
  await cargarRentasPendientes();

  console.log('✅ === RECEPCIÓN DE EQUIPOS INICIALIZADA ===');
}

// ==========================================
// CARGAR USUARIO
// ==========================================
async function cargarUsuarioRecepcion() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    const { data } = await supabaseClient
      .from('usuarios')
      .select('*')
      .eq('email', session.user.email)
      .maybeSingle();
    usuarioActualRecepcion = data || { email: session.user.email, id: session.user.id, rol: 'consultor' };
  } catch (err) {
    console.error('Error al cargar usuario:', err);
  }
}

// ==========================================
// CARGAR RENTAS PENDIENTES (ACTIVAS Y VENCIDAS)
// ==========================================
async function cargarRentasPendientes() {
  const tbody = document.getElementById('tbodyRentas');
  if (!tbody) return;

  try {
    const { data, error } = await supabaseClient
      .from('rentas')
      .select('*')
      .eq('estado', 'activa')
      .order('fecha_devolucion', { ascending: true });

    if (error) throw error;

    // Enriquecer con conteo de items y detectar vencidas
    const hoy = new Date().toISOString().split('T')[0];
    const rentasConItems = await Promise.all(
      (data || []).map(async (renta) => {
        const { data: items, error: errItems } = await supabaseClient
          .from('rentas_items')
          .select('id', { count: 'exact', head: true })
          .eq('renta_id', renta.id);

        const totalEquipos = items !== null ? 0 : 0;
        // Obtener conteo real
        const { count } = await supabaseClient
          .from('rentas_items')
          .select('*', { count: 'exact', head: true })
          .eq('renta_id', renta.id);

        const estadoVisual = (renta.fecha_devolucion && renta.fecha_devolucion < hoy) ? 'vencida' : 'activa';
        return { ...renta, total_equipos: count || 0, estado_visual: estadoVisual };
      })
    );

    rentasPendientes = rentasConItems;
    renderizarListaRentas();
  } catch (err) {
    console.error('Error al cargar rentas:', err);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 40px; color: #ef4444;">Error al cargar: ${err.message}</td></tr>`;
  }
}

// ==========================================
// RENDERIZAR LISTA DE RENTAS
// ==========================================
function renderizarListaRentas() {
  const tbody = document.getElementById('tbodyRentas');
  if (!tbody) return;

  if (rentasPendientes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px; color: #6b7280;">
          <div style="font-size: 40px; margin-bottom: 10px;">✅</div>
          <div>No hay rentas pendientes de recepción</div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = rentasPendientes.map((renta, index) => {
    const fechaInicio = new Date(renta.fecha_renta + 'T12:00:00').toLocaleDateString('es-ES');
    const fechaDev = new Date(renta.fecha_devolucion + 'T12:00:00').toLocaleDateString('es-ES');
    const badgeClass = renta.estado_visual === 'vencida' ? 'badge-vencida' : 'badge-activa';
    const estadoTexto = renta.estado_visual === 'vencida' ? '⚠️ Vencida' : '✅ Activa';

    return `
      <tr>
        <td>${index + 1}</td>
        <td style="font-family: monospace; font-weight: 600; color: #1e3a8a;">${renta.numero_renta}</td>
        <td><strong>${renta.cliente_nombre}</strong></td>
        <td>${renta.cliente_telefono || '-'}</td>
        <td>${fechaInicio}</td>
        <td>${fechaDev}</td>
        <td style="text-align: center;"><strong>${renta.total_equipos}</strong></td>
        <td style="text-align: center;"><span class="${badgeClass}">${estadoTexto}</span></td>
        <td style="text-align: center;">
          <button type="button" onclick="seleccionarRentaRecepcion('${renta.numero_renta}')"
                  class="btn-action btn-primary" style="padding: 6px 14px; font-size: 12px; margin-right: 0;">
            📥 Recibir
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================
// SELECCIONAR RENTA PARA RECEPCIÓN
// ==========================================
async function seleccionarRentaRecepcion(numeroRenta) {
  try {
    const { data: renta, error } = await supabaseClient
      .from('rentas')
      .select('*')
      .eq('numero_renta', numeroRenta)
      .single();

    if (error || !renta) {
      mostrarToastRecepcion('No se pudo cargar la renta', 'error');
      return;
    }

    const { data: items, error: errorItems } = await supabaseClient
      .from('rentas_items')
      .select('*')
      .eq('renta_id', renta.id)
      .order('id', { ascending: true });

    if (errorItems) throw errorItems;

    rentaSeleccionadaRecepcion = renta;

    // Inicializar items con estado pendiente
    itemsRecepcion = (items || []).map(item => ({
      ...item,
      estado_recepcion: 'pendiente',
      fecha_escaneo: null,
      escaneado_por: null,
      observacion_item: ''
    }));

    // Resetear cola y contador
    colaEscaneosRecepcion = [];
    procesandoEscaneoRecepcion = false;

    // Renderizar info
    renderizarInfoRenta(renta);
    renderizarTablaEquiposRecepcion();
    actualizarEstadisticas();
    await generarNumeroRecepcion();

    // Limpiar campos
    const obsEl = document.getElementById('observacionesRecepcion');
    if (obsEl) obsEl.value = '';

    // Mostrar sección de recepción
    document.getElementById('fieldsetListaRentas').style.display = 'none';
    document.getElementById('fieldsetRecepcion').style.display = 'block';
    const numRentaEl = document.getElementById('recepcionNumeroRenta');
    if (numRentaEl) numRentaEl.textContent = `#${renta.numero_renta}`;

    // Resetear botón de guardar
    const btnGuardar = document.getElementById('btnGuardarRecepcion');
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = '💾 Guardar Recepción';
      btnGuardar.style.animation = '';
    }
    const btnImprimir = document.getElementById('btnImprimirRecepcion');
    if (btnImprimir) btnImprimir.style.display = 'none';

    // ✅ Focus en input de escaneo
    setTimeout(() => {
      const input = document.getElementById('inputEscaneo');
      if (input) input.focus();
    }, 300);

  } catch (err) {
    console.error('Error al seleccionar renta:', err);
    mostrarToastRecepcion('Error al cargar la renta: ' + err.message, 'error');
  }
}

// ==========================================
// RENDERIZAR INFO DE LA RENTA
// ==========================================
function renderizarInfoRenta(renta) {
  const container = document.getElementById('rentaInfoContainer');
  if (!container) return;

  const fechaInicio = new Date(renta.fecha_renta + 'T12:00:00').toLocaleDateString('es-ES');
  const fechaDev = new Date(renta.fecha_devolucion + 'T12:00:00').toLocaleDateString('es-ES');
  const hoy = new Date().toISOString().split('T')[0];
  const estaVencida = renta.fecha_devolucion < hoy;

  container.innerHTML = `
    <div class="renta-info-box">
      <label>👤 Cliente</label>
      <strong>${renta.cliente_nombre}</strong>
    </div>
    <div class="renta-info-box">
      <label>📞 Teléfono</label>
      <strong>${renta.cliente_telefono || 'N/A'}</strong>
    </div>
    <div class="renta-info-box">
      <label>📅 Fecha Inicio</label>
      <strong>${fechaInicio}</strong>
    </div>
    <div class="renta-info-box">
      <label>📅 Fecha Devolución</label>
      <strong style="color: ${estaVencida ? '#dc2626' : '#1e3a8a'};">${fechaDev} ${estaVencida ? '⚠️' : ''}</strong>
    </div>
    <div class="renta-info-box">
      <label>💰 Total Renta</label>
      <strong>$${parseFloat(renta.total).toFixed(2)}</strong>
    </div>
    <div class="renta-info-box">
      <label>🔧 Ingeniero</label>
      <strong>${renta.ingeniero_nombre || 'N/A'}</strong>
    </div>
  `;
}

// ==========================================
// RENDERIZAR TABLA DE EQUIPOS
// ==========================================
function renderizarTablaEquiposRecepcion() {
  const tbody = document.getElementById('tbodyEquiposRecepcion');
  if (!tbody) return;

  if (itemsRecepcion.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 30px; color: #6b7280;">
          No hay equipos en esta renta.
        </td>
      </tr>`;
    return;
  }

  const esAdmin = usuarioActualRecepcion?.rol === 'administrador';

  tbody.innerHTML = itemsRecepcion.map((item, index) => {
    const estadoClass = `item-${item.estado_recepcion}`;
    const estadoIcon = item.estado_recepcion === 'recibido' ? '✅' :
                       item.estado_recepcion === 'faltante' ? '❌' : '⏳';
    const estadoTexto = item.estado_recepcion === 'recibido' ? 'Recibido' :
                        item.estado_recepcion === 'faltante' ? 'Faltante' : 'Pendiente';
    const horaEscaneo = item.fecha_escaneo ?
      new Date(item.fecha_escaneo).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-';

    return `
      <tr class="${estadoClass}" id="fila-item-${item.id}">
        <td>${index + 1}</td>
        <td style="font-family: monospace; font-size: 11px; font-weight: 600;">${item.codigo_barras}</td>
        <td><strong>${item.nombre_equipo}</strong></td>
        <td>${item.serial || '-'}</td>
        <td style="text-align: center;">${item.cantidad}</td>
        <td style="text-align: center; font-weight: 700;">${estadoIcon} ${estadoTexto}</td>
        <td style="text-align: center;">
          <div class="faltante-checkbox" style="justify-content: center;">
            <input type="checkbox" id="faltante-${item.id}"
                   ${item.estado_recepcion === 'faltante' ? 'checked' : ''}
                   ${!esAdmin ? 'disabled title="Solo administradores"' : ''}
                   onchange="toggleFaltante(${item.id}, this.checked)">
            <label for="faltante-${item.id}">Faltante</label>
          </div>
        </td>
        <td style="font-family: monospace; font-size: 12px; text-align: center;">${horaEscaneo}</td>
      </tr>
    `;
  }).join('');
}

// ==========================================
// ✅ CONFIGURAR INPUT DE ESCANEO (FOCO AUTOMÁTICO + MULTI-ESCÁNER)
// ==========================================
function configurarInputEscaneo() {
  const input = document.getElementById('inputEscaneo');
  if (!input) return;

  // Evitar listeners duplicados
  if (input.dataset.recepcionListenerAttached) return;

  // Forzar mayúsculas en tiempo real
  input.addEventListener('input', (e) => {
    const cursorPos = e.target.selectionStart;
    e.target.value = e.target.value.toUpperCase();
    e.target.setSelectionRange(cursorPos, cursorPos);
  });

  // ✅ Procesar al presionar Enter (el escáner envía Enter automáticamente)
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const codigo = input.value.trim();

      if (codigo) {
        // Agregar a la cola y procesar (soporta múltiples escáneres)
        colaEscaneosRecepcion.push(codigo);
        procesarColaEscaneosRecepcion();
      }

      // ✅ Limpiar y reenfoncar INMEDIATAMENTE para el siguiente escaneo
      input.value = '';
      input.focus();
    }
  });

  // ✅ Mantener foco permanente: si se hace click fuera de controles, volver al input
  document.addEventListener('click', (e) => {
    const esControl = e.target.closest('button') ||
                      e.target.closest('input') ||
                      e.target.closest('textarea') ||
                      e.target.closest('select');

    if (!esControl) {
      const inputEscaneo = document.getElementById('inputEscaneo');
      const fieldsetRecepcion = document.getElementById('fieldsetRecepcion');
      // Solo reenfoncar si estamos en la sección de recepción activa
      if (inputEscaneo && fieldsetRecepcion && fieldsetRecepcion.style.display !== 'none') {
        inputEscaneo.focus();
      }
    }
  });

  input.dataset.recepcionListenerAttached = 'true';
}

// ==========================================
// ✅ PROCESAR COLA DE ESCANEOS (evita perder códigos con escaneo rápido)
// ==========================================
async function procesarColaEscaneosRecepcion() {
  if (procesandoEscaneoRecepcion) return;
  procesandoEscaneoRecepcion = true;

  while (colaEscaneosRecepcion.length > 0) {
    const codigo = colaEscaneosRecepcion.shift();
    try {
      await procesarEscaneo(codigo);
    } catch (err) {
      console.error('Error procesando escaneo:', err);
    }
  }

  procesandoEscaneoRecepcion = false;

  // ✅ Asegurar foco al terminar la cola
  const input = document.getElementById('inputEscaneo');
  if (input) input.focus();
}

// ==========================================
// ✅ PROCESAR ESCANEO (CON NORMALIZACIÓN DE CÓDIGOS)
// ==========================================
async function procesarEscaneo(codigo) {
  if (!codigo || !rentaSeleccionadaRecepcion) return;

  // Sanitizar
  codigo = codigo.replace(/'/g, '').replace(/"/g, '').replace(/`/g, '').trim();
  const codigoNormalizado = normalizarCodigo(codigo);

  if (!codigoNormalizado) return;

  // ✅ Buscar NORMALIZANDO ambos lados (con o sin guiones, mayúsculas/minúsculas)
  const itemEncontrado = itemsRecepcion.find(item =>
    normalizarCodigo(item.codigo_barras) === codigoNormalizado ||
    (item.serial && normalizarCodigo(item.serial) === codigoNormalizado)
  );

  if (!itemEncontrado) {
    mostrarToastRecepcion(`⚠️ Código "${codigo}" NO está en esta renta`, 'error');
    return;
  }

  if (itemEncontrado.estado_recepcion === 'recibido') {
    mostrarToastRecepcion(`ℹ️ ${itemEncontrado.nombre_equipo} ya fue escaneado`, 'warning');
    return;
  }

  if (itemEncontrado.estado_recepcion === 'faltante') {
    mostrarToastRecepcion(`⚠️ ${itemEncontrado.nombre_equipo} estaba como faltante. Actualizando...`, 'warning');
  }

  // ✅ Marcar como recibido
  itemEncontrado.estado_recepcion = 'recibido';
  itemEncontrado.fecha_escaneo = new Date().toISOString();
  itemEncontrado.escaneado_por = usuarioActualRecepcion?.email || 'unknown';

  actualizarFilaItem(itemEncontrado);
  actualizarEstadisticas();

  // Efecto visual de confirmación y scroll a la fila
  const fila = document.getElementById(`fila-item-${itemEncontrado.id}`);
  if (fila) {
    fila.classList.add('item-escaneando');
    setTimeout(() => fila.classList.remove('item-escaneando'), 500);
    fila.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  mostrarToastRecepcion(`✅ ${itemEncontrado.nombre_equipo} recibido`, 'exito');
  verificarRecepcionCompleta();
}

// ==========================================
// ACTUALIZAR FILA INDIVIDUAL (sin re-renderizar todo)
// ==========================================
function actualizarFilaItem(item) {
  const fila = document.getElementById(`fila-item-${item.id}`);
  if (!fila) return;

  const estadoClass = `item-${item.estado_recepcion}`;
  fila.className = estadoClass;

  const estadoIcon = item.estado_recepcion === 'recibido' ? '✅' :
                     item.estado_recepcion === 'faltante' ? '❌' : '⏳';
  const estadoTexto = item.estado_recepcion === 'recibido' ? 'Recibido' :
                      item.estado_recepcion === 'faltante' ? 'Faltante' : 'Pendiente';

  // Actualizar celda de estado (índice 5)
  const celdas = fila.querySelectorAll('td');
  if (celdas[5]) {
    celdas[5].innerHTML = `${estadoIcon} ${estadoTexto}`;
    celdas[5].style.fontWeight = '700';
    celdas[5].style.textAlign = 'center';
  }

  // Actualizar hora de escaneo (índice 7)
  if (celdas[7]) {
    const horaEscaneo = item.fecha_escaneo ?
      new Date(item.fecha_escaneo).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-';
    celdas[7].innerHTML = horaEscaneo;
  }

  // Actualizar checkbox
  const checkbox = document.getElementById(`faltante-${item.id}`);
  if (checkbox) {
    checkbox.checked = item.estado_recepcion === 'faltante';
  }
}

// ==========================================
// TOGGLE FALTANTE (solo admin)
// ==========================================
function toggleFaltante(itemId, esFaltante) {
  if (usuarioActualRecepcion?.rol !== 'administrador') {
    mostrarToastRecepcion('⚠️ Solo administradores pueden marcar equipos como faltantes', 'error');
    return;
  }

  const item = itemsRecepcion.find(i => i.id === itemId);
  if (!item) return;

  if (esFaltante) {
    item.estado_recepcion = 'faltante';
    item.fecha_escaneo = new Date().toISOString();
    item.escaneado_por = usuarioActualRecepcion?.email || 'admin';
    item.observacion_item = 'Marcado como faltante por administrador';
    mostrarToastRecepcion(`❌ ${item.nombre_equipo} marcado como FALTANTE`, 'warning');
  } else {
    item.estado_recepcion = 'pendiente';
    item.fecha_escaneo = null;
    item.escaneado_por = null;
    item.observacion_item = '';
    mostrarToastRecepcion(`⏳ ${item.nombre_equipo} vuelto a pendiente`, 'exito');
  }

  actualizarFilaItem(item);
  actualizarEstadisticas();
  verificarRecepcionCompleta();
}

// ==========================================
// ACTUALIZAR ESTADÍSTICAS EN VIVO
// ==========================================
function actualizarEstadisticas() {
  const total = itemsRecepcion.length;
  const recibidos = itemsRecepcion.filter(i => i.estado_recepcion === 'recibido').length;
  const pendientes = itemsRecepcion.filter(i => i.estado_recepcion === 'pendiente').length;
  const faltantes = itemsRecepcion.filter(i => i.estado_recepcion === 'faltante').length;
  const procesados = recibidos + faltantes;

  const elTotal = document.getElementById('statTotal');
  const elRecibidos = document.getElementById('statRecibidos');
  const elPendientes = document.getElementById('statPendientes');
  const elFaltantes = document.getElementById('statFaltantes');
  if (elTotal) elTotal.textContent = total;
  if (elRecibidos) elRecibidos.textContent = recibidos;
  if (elPendientes) elPendientes.textContent = pendientes;
  if (elFaltantes) elFaltantes.textContent = faltantes;

  const porcentaje = total > 0 ? Math.round((procesados / total) * 100) : 0;
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');

  if (progressBar) {
    progressBar.style.width = `${porcentaje}%`;
    if (porcentaje === 100) {
      progressBar.style.background = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
    } else if (porcentaje >= 50) {
      progressBar.style.background = 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';
    } else {
      progressBar.style.background = 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)';
    }
  }
  if (progressText) {
    progressText.textContent = `${porcentaje}% completado (${procesados} de ${total})`;
  }
}

// ==========================================
// VERIFICAR SI LA RECEPCIÓN ESTÁ COMPLETA
// ==========================================
function verificarRecepcionCompleta() {
  const pendientes = itemsRecepcion.filter(i => i.estado_recepcion === 'pendiente').length;
  const btnGuardar = document.getElementById('btnGuardarRecepcion');

  if (pendientes === 0 && btnGuardar) {
    btnGuardar.style.animation = 'pulseRecepcion 1s infinite';
    btnGuardar.innerHTML = '✅ ¡Listo para guardar!';
  } else if (btnGuardar) {
    btnGuardar.style.animation = '';
    btnGuardar.innerHTML = '💾 Guardar Recepción';
  }
}

// ==========================================
// ✅ GENERAR NÚMERO DE RECEPCIÓN (CORREGIDO)
// ==========================================
async function generarNumeroRecepcion() {
  try {
    const año = new Date().getFullYear();
    const serie = 'REC';
    const patron = `${serie}-${año}-%`;

    const resRecepciones = await supabaseClient
      .from('recepcion_equipos')
      .select('numero_recepcion')
      .like('numero_recepcion', patron);

    let numeroMaximo = 0;

    if (resRecepciones.data && Array.isArray(resRecepciones.data)) {
      resRecepciones.data.forEach(row => {
        try {
          if (row.numero_recepcion) {
            const num = parseInt(row.numero_recepcion.split('-').pop());
            if (!isNaN(num) && num > numeroMaximo) numeroMaximo = num;
          }
        } catch (e) {
          console.warn('Número de recepción inválido:', row.numero_recepcion);
        }
      });
    }

    numeroRecepcionActual = `${serie}-${año}-${String(numeroMaximo + 1).padStart(4, '0')}`;
    console.log(`✅ Número de recepción generado: ${numeroRecepcionActual}`);
  } catch (err) {
    console.error('Error generando número:', err);
    numeroRecepcionActual = `REC-${new Date().getFullYear()}-0001`;
  }
}

// ==========================================
// ✅ GUARDAR RECEPCIÓN (CORREGIDO PARA TU ESTRUCTURA DE TABLAS)
// ==========================================
async function guardarRecepcion() {
  if (!rentaSeleccionadaRecepcion) return;

  const pendientes = itemsRecepcion.filter(i => i.estado_recepcion === 'pendiente').length;
  const recibidos = itemsRecepcion.filter(i => i.estado_recepcion === 'recibido').length;
  const faltantes = itemsRecepcion.filter(i => i.estado_recepcion === 'faltante').length;

  // ✅ VALIDACIÓN ESTRICTA: NO se puede guardar con equipos pendientes
  if (pendientes > 0) {
    mostrarToastRecepcion(
      `⚠️ Hay ${pendientes} equipo(s) pendiente(s). Debe escanearlos como recibidos o marcarlos como faltantes antes de guardar.`,
      'error'
    );

    itemsRecepcion.forEach(item => {
      if (item.estado_recepcion === 'pendiente') {
        const fila = document.getElementById(`fila-item-${item.id}`);
        if (fila) {
          fila.style.transition = 'all 0.3s';
          fila.style.background = '#fef3c7';
          fila.style.borderLeft = '4px solid #f59e0b';
        }
      }
    });

    setTimeout(() => {
      itemsRecepcion.forEach(item => {
        if (item.estado_recepcion === 'pendiente') {
          const fila = document.getElementById(`fila-item-${item.id}`);
          if (fila) {
            fila.style.background = '';
            fila.style.borderLeft = '';
          }
        }
      });
    }, 3000);

    return;
  }

  const btnGuardar = document.getElementById('btnGuardarRecepcion');
  if (btnGuardar) {
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '⏳ Guardando...';
  }

  try {
    // Determinar estado final
    let estadoFinal = faltantes > 0 ? 'con_faltantes' : 'completa';
    const observaciones = document.getElementById('observacionesRecepcion')?.value.trim() || '';

    // ========================================
    // ✅ CALCULAR DÍAS DE RETRASO/ANTICIPACIÓN
    // ========================================
    const fechaProgramada = new Date(rentaSeleccionadaRecepcion.fecha_devolucion + 'T12:00:00');
    const fechaReal = new Date();
    fechaReal.setHours(12, 0, 0, 0);

    const diffMs = fechaReal - fechaProgramada;
    const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

    let dias_anticipados = 0;
    let dias_retraso = 0;
    if (diffDias < 0) {
      dias_anticipados = Math.abs(diffDias);
    } else if (diffDias > 0) {
      dias_retraso = diffDias;
    }

    // Generar mensaje de terminación
    let observacionesTerminacion = '';
    if (dias_retraso > 0) {
      observacionesTerminacion = `Recibida con ${dias_retraso} día(s) de retraso.`;
    } else if (dias_anticipados > 0) {
      observacionesTerminacion = `Recibida ${dias_anticipados} día(s) antes de lo previsto.`;
    } else {
      observacionesTerminacion = 'Recibida en la fecha programada.';
    }

    if (faltantes > 0) {
      observacionesTerminacion += ` Equipos faltantes: ${faltantes}.`;
    }
    if (observaciones) {
      observacionesTerminacion += ` Obs: ${observaciones}`;
    }

    const fechaHoyCaracas = obtenerFechaHoyCaracas();

    // ========================================
    // 1. Insertar recepción principal
    // ========================================
    const { data: recepcionData, error: errorRecepcion } = await supabaseClient
      .from('recepcion_equipos')
      .insert({
        numero_recepcion: numeroRecepcionActual,
        renta_id: rentaSeleccionadaRecepcion.id,
        numero_renta: rentaSeleccionadaRecepcion.numero_renta,
        cliente_nombre: rentaSeleccionadaRecepcion.cliente_nombre,
        cliente_telefono: rentaSeleccionadaRecepcion.cliente_telefono,
        fecha_devolucion_esperada: rentaSeleccionadaRecepcion.fecha_devolucion,
        total_equipos: itemsRecepcion.length,
        equipos_recibidos: recibidos,
        equipos_faltantes: faltantes,
        estado: estadoFinal,
        observaciones: observaciones,
        recibido_por_email: usuarioActualRecepcion?.email || 'unknown',
        recibido_por_id: usuarioActualRecepcion?.id || null
      })
      .select()
      .single();

    if (errorRecepcion) throw errorRecepcion;
    recepcionGuardadaId = recepcionData.id;

    // ========================================
    // 2. Insertar items de recepción en lotes de 100
    // ========================================
    const TAMANO_LOTE = 100;
    for (let i = 0; i < itemsRecepcion.length; i += TAMANO_LOTE) {
      const lote = itemsRecepcion.slice(i, i + TAMANO_LOTE).map(item => ({
        recepcion_id: recepcionData.id,
        codigo_barras: item.codigo_barras,
        nombre_equipo: item.nombre_equipo,
        marca: item.marca,
        modelo: item.modelo,
        serial: item.serial,
        cantidad: item.cantidad,
        estado_recepcion: item.estado_recepcion,
        observacion_item: item.observacion_item || null,
        fecha_escaneo: item.fecha_escaneo || null,
        escaneado_por: item.escaneado_por || null
      }));

      const { error: errorLote } = await supabaseClient
        .from('recepcion_equipos_items')
        .insert(lote);

      if (errorLote) throw errorLote;
    }

    // ========================================
    // ✅ 3. GUARDAR EN RENTAS_TERMINADAS (CON COLUMNAS CORRECTAS)
    // ========================================
    const { data: rentaTerminadaData, error: errorTerminada } = await supabaseClient
      .from('rentas_terminadas')
      .insert({
        numero_renta: rentaSeleccionadaRecepcion.numero_renta,
        serie: rentaSeleccionadaRecepcion.serie || 'RENT',
        fecha_creacion: rentaSeleccionadaRecepcion.fecha_creacion,
        fecha_renta: rentaSeleccionadaRecepcion.fecha_renta,
        fecha_devolucion_programada: rentaSeleccionadaRecepcion.fecha_devolucion,
        fecha_devolucion_real: fechaHoyCaracas,
        cliente_nombre: rentaSeleccionadaRecepcion.cliente_nombre,
        cliente_telefono: rentaSeleccionadaRecepcion.cliente_telefono,
        cliente_email: rentaSeleccionadaRecepcion.cliente_email,
        cliente_direccion: rentaSeleccionadaRecepcion.cliente_direccion,
        ingeniero_nombre: rentaSeleccionadaRecepcion.ingeniero_nombre,
        ingeniero_contacto: rentaSeleccionadaRecepcion.ingeniero_contacto,
        subtotal: rentaSeleccionadaRecepcion.subtotal,
        descuento: rentaSeleccionadaRecepcion.descuento,
        total: rentaSeleccionadaRecepcion.total,
        estado: 'devuelta',
        observaciones: rentaSeleccionadaRecepcion.observaciones,
        usuario_registro: rentaSeleccionadaRecepcion.usuario_registro,
        usuario_registro_id: rentaSeleccionadaRecepcion.usuario_registro_id,
        fecha_terminacion: new Date().toISOString(),
        recibido_por_email: usuarioActualRecepcion?.email || 'unknown',
        recibido_por_id: usuarioActualRecepcion?.id || null,
        dias_anticipados: dias_anticipados,
        dias_retraso: dias_retraso,
        observaciones_terminacion: observacionesTerminacion
      })
      .select()
      .single();

    if (errorTerminada) {
      throw new Error('Error al guardar en rentas_terminadas: ' + errorTerminada.message);
    }

    // ========================================
    // ✅ 4. GUARDAR ITEMS EN RENTAS_ITEMS_TERMINADAS (EN LOTES DE 100)
    // ========================================
    for (let i = 0; i < itemsRecepcion.length; i += TAMANO_LOTE) {
      const loteItems = itemsRecepcion.slice(i, i + TAMANO_LOTE).map(item => ({
        renta_terminada_id: rentaTerminadaData.id,
        renta_id_original: rentaSeleccionadaRecepcion.id,
        codigo_barras: item.codigo_barras,
        nombre_equipo: item.nombre_equipo,
        marca: item.marca,
        modelo: item.modelo,
        serial: item.serial,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal
      }));

      const { error: errorLoteTerminadas } = await supabaseClient
        .from('rentas_items_terminadas')
        .insert(loteItems);

      if (errorLoteTerminadas) {
        throw new Error('Error al guardar items terminados: ' + errorLoteTerminadas.message);
      }
    }

    // ========================================
    // 5. Actualizar estado de la renta original a 'devuelta'
    // ========================================
    const { error: errorUpdateRenta } = await supabaseClient
      .from('rentas')
      .update({ estado: 'devuelta' })
      .eq('id', rentaSeleccionadaRecepcion.id);

    if (errorUpdateRenta) {
      console.warn('No se pudo actualizar la renta a devuelta:', errorUpdateRenta);
    }

    // ========================================
    // 6. Registrar log
    // ========================================
    if (typeof registrarLog === 'function') {
      const descripcion = `Recepción ${numeroRecepcionActual} | Renta: ${rentaSeleccionadaRecepcion.numero_renta} | Cliente: ${rentaSeleccionadaRecepcion.cliente_nombre} | Recibidos: ${recibidos}/${itemsRecepcion.length} | Faltantes: ${faltantes} | Retraso: ${dias_retraso} día(s) | Guardada en historial | Por: ${usuarioActualRecepcion?.email || 'Desconocido'}`;
      await registrarLog('rentar', 'Recepción de equipos', descripcion, estadoFinal === 'completa' ? 'success' : 'warning');
    }

    mostrarToastRecepcion(`✅ Recepción ${numeroRecepcionActual} guardada exitosamente`, 'exito');

    if (btnGuardar) {
      btnGuardar.innerHTML = '✅ Guardada';
      btnGuardar.style.animation = '';
    }

    // ========================================
    // ✅ 7. FLUJO DE IMPRESIÓN CORREGIDO (SIN DOBLE VISTA)
    // ========================================
    setTimeout(() => {
      // 1. Imprimir UNA sola vez
      imprimirComprobanteRecepcion();

      // 2. Después de 1.5 segundos, limpiar TODO y volver a la lista
      setTimeout(() => {
        limpiarYVolverALista();
      }, 1500);
    }, 800);

  } catch (err) {
    console.error('Error al guardar recepción:', err);
    mostrarToastRecepcion('Error al guardar: ' + err.message, 'error');
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = '💾 Guardar Recepción';
    }
  }
}

// ==========================================
// ✅ LIMPIAR Y VOLVER A LA LISTA DE RENTAS
// ==========================================
function limpiarYVolverALista() {
  // Limpiar variables
  rentaSeleccionadaRecepcion = null;
  itemsRecepcion = [];
  recepcionGuardadaId = null;
  colaEscaneosRecepcion = [];
  numeroRecepcionActual = null;

  // Limpiar campos
  const obsEl = document.getElementById('observacionesRecepcion');
  if (obsEl) obsEl.value = '';

  // Ocultar botón de imprimir (ya se imprimió automáticamente)
  const btnImprimir = document.getElementById('btnImprimirRecepcion');
  if (btnImprimir) btnImprimir.style.display = 'none';

  // Cambiar vista: mostrar lista, ocultar formulario de recepción
  document.getElementById('fieldsetListaRentas').style.display = 'block';
  document.getElementById('fieldsetRecepcion').style.display = 'none';

  // Recargar lista de rentas pendientes
  cargarRentasPendientes();

  // Scroll al top
  document.getElementById('fieldsetListaRentas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
// ==========================================
// CANCELAR RECEPCIÓN
// ==========================================
function cancelarRecepcion() {
  const pendientes = itemsRecepcion.filter(i => i.estado_recepcion === 'pendiente').length;
  const procesados = itemsRecepcion.length - pendientes;

  if (procesados > 0 && !recepcionGuardadaId && !confirm(`¿Cancelar recepción? Se perderán ${procesados} equipo(s) ya escaneados.`)) {
    return;
  }

  rentaSeleccionadaRecepcion = null;
  itemsRecepcion = [];
  recepcionGuardadaId = null;
  colaEscaneosRecepcion = [];

  document.getElementById('fieldsetListaRentas').style.display = 'block';
  document.getElementById('fieldsetRecepcion').style.display = 'none';

  // Recargar lista de rentas
  cargarRentasPendientes();
}

// ==========================================
// ✅ IMPRIMIR COMPROBANTE DE RECEPCIÓN (TAMAÑO CARTA)
// ==========================================
function imprimirComprobanteRecepcion() {
  if (!rentaSeleccionadaRecepcion) {
    mostrarToastRecepcion('No hay recepción para imprimir', 'error');
    return;
  }

  const recibidos = itemsRecepcion.filter(i => i.estado_recepcion === 'recibido').length;
  const faltantes = itemsRecepcion.filter(i => i.estado_recepcion === 'faltante').length;
  const pendientes = itemsRecepcion.filter(i => i.estado_recepcion === 'pendiente').length;
  const observaciones = document.getElementById('observacionesRecepcion')?.value.trim() || '';

  const logoUrl = new URL('img/logo.png', window.location.href).href;

  const itemsHTML = itemsRecepcion.map((item, i) => {
    const icono = item.estado_recepcion === 'recibido' ? '✅' :
                  item.estado_recepcion === 'faltante' ? '❌' : '⏳';
    const estadoTexto = item.estado_recepcion.toUpperCase();
    const colorEstado = item.estado_recepcion === 'recibido' ? '#10b981' :
                        item.estado_recepcion === 'faltante' ? '#dc2626' : '#f59e0b';
    const hora = item.fecha_escaneo ?
      new Date(item.fecha_escaneo).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '-';

    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${i + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 10px;">${item.codigo_barras}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>${item.nombre_equipo}</strong><br><small style="color:#666;">${item.marca || ''} ${item.modelo || ''}</small></td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.serial || '-'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.cantidad}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center; color: ${colorEstado}; font-weight: 700;">${icono} ${estadoTexto}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${hora}</td>
      </tr>
    `;
  }).join('');

  const estadoFinal = pendientes > 0 ? 'PARCIAL' : (faltantes > 0 ? 'CON FALTANTES' : 'COMPLETA');
  const estadoColor = estadoFinal === 'COMPLETA' ? '#10b981' : (estadoFinal === 'PARCIAL' ? '#f59e0b' : '#dc2626');

  const ventana = window.open('', '_blank', 'width=900,height=1100');
  const html = `<!DOCTYPE html>
<html>
<head>
<title>Comprobante de Recepción ${numeroRecepcionActual}</title>
<style>
@page { size: letter; margin: 15mm; }
* { box-sizing: border-box; }
body { font-family: Arial, sans-serif; font-size: 12px; color: #333; max-width: 216mm; margin: 0 auto; padding: 10mm; }
.header { text-align: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; }
.logo-container { display: flex; justify-content: center; align-items: center; margin-bottom: 10px; }
.logo-img { max-width: 250px; max-height: 250px; object-fit: contain; }
.brand h1 { color: #1e3a8a; margin: 10px 0 5px 0; font-size: 26px; font-family: 'Libre Caslon Text', serif; }
.brand p { margin: 3px 0 0 0; color: #666; font-size: 12px; }
.numero-recepcion-box { background: linear-gradient(135deg, #eff6ff, #dbeafe); padding: 12px 20px; border-radius: 8px; margin: 15px auto; display: inline-block; border: 2px dashed #3b82f6; }
.numero-recepcion-box .label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
.numero-recepcion-box .valor { font-size: 22px; font-weight: bold; color: #1e3a8a; font-family: monospace; margin-top: 3px; }
.estado-final { text-align: center; padding: 12px; margin: 15px 0; border: 2px solid ${estadoColor}; border-radius: 8px; background: ${estadoColor}15; color: ${estadoColor}; font-weight: bold; font-size: 16px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.info-box { background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; }
.info-box h3 { margin: 0 0 10px 0; color: #1e3a8a; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
.info-box p { margin: 5px 0; font-size: 12px; }
.info-box p strong { color: #374151; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
.stat-box { text-align: center; padding: 15px; border-radius: 8px; border: 2px solid; }
.stat-box.total { border-color: #1e3a8a; background: #eff6ff; }
.stat-box.recibidos { border-color: #10b981; background: #d1fae5; }
.stat-box.faltantes { border-color: #dc2626; background: #fee2e2; }
.stat-box .stat-num { font-size: 28px; font-weight: 700; font-family: monospace; }
.stat-box.total .stat-num { color: #1e3a8a; }
.stat-box.recibidos .stat-num { color: #10b981; }
.stat-box.faltantes .stat-num { color: #dc2626; }
.stat-box .stat-label { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600; margin-top: 5px; }
table { width: 100%; border-collapse: collapse; margin: 20px 0; }
th { background: #1e3a8a; color: white; padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; }
td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
.observaciones { margin-top: 20px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; }
.observaciones h4 { margin: 0 0 5px 0; color: #92400e; font-size: 12px; }
.observaciones p { margin: 0; font-size: 12px; }
.firmas { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; text-align: center; }
.firma-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; }
.firma-line p { margin: 3px 0; font-size: 12px; }
.footer { margin-top: 30px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
@media print { .no-print { display: none !important; } body { padding: 0; } }
</style>
</head>
<body>
<div class="header">
<div class="logo-container">
<img src="${logoUrl}" alt="Logo Eventos D' Primera" class="logo-img" onerror="this.style.display='none'">
</div>
<div class="brand">
<h1>Eventos D' Primera</h1>
<p>Sistema de Inventario y Rentas</p>
</div>
<div class="numero-recepcion-box">
<div class="label">Comprobante de Recepción N°</div>
<div class="valor">${numeroRecepcionActual}</div>
</div>
</div>

<div class="estado-final">
ESTADO DE LA RECEPCIÓN: ${estadoFinal}
</div>

<div class="info-grid">
<div class="info-box">
<h3>👤 Cliente / Responsable</h3>
<p><strong>Nombre:</strong> ${rentaSeleccionadaRecepcion.cliente_nombre}</p>
<p><strong>Teléfono:</strong> ${rentaSeleccionadaRecepcion.cliente_telefono || 'N/A'}</p>
<p><strong>Renta Asociada:</strong> ${rentaSeleccionadaRecepcion.numero_renta}</p>
</div>
<div class="info-box">
<h3>📅 Detalles de Recepción</h3>
<p><strong>Fecha Recepción:</strong> ${new Date().toLocaleString('es-ES')}</p>
<p><strong>Devolución Esperada:</strong> ${rentaSeleccionadaRecepcion.fecha_devolucion ? new Date(rentaSeleccionadaRecepcion.fecha_devolucion + 'T12:00:00').toLocaleDateString('es-ES') : 'N/A'}</p>
<p><strong>Recibido por:</strong> ${usuarioActualRecepcion?.email || 'N/A'}</p>
</div>
</div>

<div class="stats">
<div class="stat-box total">
<div class="stat-num">${itemsRecepcion.length}</div>
<div class="stat-label">Total Equipos</div>
</div>
<div class="stat-box recibidos">
<div class="stat-num">${recibidos}</div>
<div class="stat-label">✅ Recibidos</div>
</div>
<div class="stat-box faltantes">
<div class="stat-num">${faltantes + pendientes}</div>
<div class="stat-label">❌ Faltantes</div>
</div>
</div>

<h3 style="margin: 20px 0 10px 0; color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px;">📦 Detalle de Equipos (${itemsRecepcion.length})</h3>
<table>
<thead>
<tr>
<th style="width: 30px;">#</th>
<th style="width: 130px;">Código</th>
<th>Equipo</th>
<th style="width: 100px;">Serial</th>
<th style="text-align: center; width: 50px;">Cant.</th>
<th style="text-align: center; width: 110px;">Estado</th>
<th style="text-align: center; width: 70px;">Hora</th>
</tr>
</thead>
<tbody>
${itemsHTML}
</tbody>
</table>

${observaciones ? `
<div class="observaciones">
<h4>📝 Observaciones</h4>
<p>${observaciones}</p>
</div>
` : ''}

<div class="firmas">
<div>
<div class="firma-line">
<p><strong>${rentaSeleccionadaRecepcion.cliente_nombre}</strong></p>
<p>Cliente / Responsable</p>
<p style="font-size: 10px; color: #666;">Firma de conformidad</p>
</div>
</div>
<div>
<div class="firma-line">
<p><strong>${usuarioActualRecepcion?.email || 'Administrador'}</strong></p>
<p>Recibido por</p>
<p style="font-size: 10px; color: #666;">Firma del responsable</p>
</div>
</div>
</div>

<div class="footer">
<p>©copyright Eventos de Primera | 2026-2027 | Comprobante generado el ${new Date().toLocaleString('es-ES')}</p>
</div>

<div class="no-print" style="margin-top: 30px; text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
<button onclick="window.print()" style="padding: 12px 30px; background: #1e3a8a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-right: 10px;">🖨️ Imprimir Comprobante</button>
<button onclick="window.close()" style="padding: 12px 30px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">❌ Cerrar</button>
</div>
</body>
</html>`;

  ventana.document.write(html);
  ventana.document.close();

  // Auto-abrir diálogo de impresión
  setTimeout(() => {
    ventana.focus();
    ventana.print();
  }, 500);
}

// ==========================================
// ✅ SISTEMA TOAST (mensajes flotantes laterales - SIN SCROLL)
// ==========================================
function mostrarToastRecepcion(texto, tipo) {
  let toastContainer = document.getElementById('toastContainerRecepcion');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainerRecepcion';
    toastContainer.style.cssText = `position: fixed; top: 80px; right: 20px; z-index: 999999; display: flex; flex-direction: column; gap: 10px; max-width: 380px; pointer-events: none;`;
    document.body.appendChild(toastContainer);
  }

  const bgColor = tipo === 'exito' ? '#d1fae5' : (tipo === 'error' ? '#fee2e2' : '#fef3c7');
  const borderColor = tipo === 'exito' ? '#10b981' : (tipo === 'error' ? '#dc2626' : '#f59e0b');
  const textColor = tipo === 'exito' ? '#065f46' : (tipo === 'error' ? '#991b1b' : '#92400e');
  const icono = tipo === 'exito' ? '✅' : (tipo === 'error' ? '⚠️' : 'ℹ️');

  const toast = document.createElement('div');
  toast.style.cssText = `background: ${bgColor}; border-left: 4px solid ${borderColor}; color: ${textColor}; padding: 12px 16px; border-radius: 8px; font-size: 13px; font-family: 'Poppins', sans-serif; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.2); animation: toastSlideInRecepcion 0.3s ease; display: flex; align-items: center; gap: 10px; pointer-events: auto;`;
  toast.innerHTML = `<span style="font-size: 16px;">${icono}</span><span style="flex: 1;">${texto}</span><span onclick="this.parentElement.remove()" style="cursor: pointer; font-size: 16px; opacity: 0.6;">✕</span>`;

  toastContainer.appendChild(toast);

  // Limitar a 5 toasts visibles
  while (toastContainer.children.length > 5) {
    toastContainer.removeChild(toastContainer.firstChild);
  }

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'toastSlideOutRecepcion 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 3000);
}

// ✅ Animaciones toast
if (!document.getElementById('toastStylesRecepcion')) {
  const style = document.createElement('style');
  style.id = 'toastStylesRecepcion';
  style.textContent = `
    @keyframes toastSlideInRecepcion { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes toastSlideOutRecepcion { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
  `;
  document.head.appendChild(style);
}

// ==========================================
// INICIALIZAR AL CARGAR EL DOM
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 Recepción de Equipos DOM cargado');
  inicializarRecepcionEquipos();
});
