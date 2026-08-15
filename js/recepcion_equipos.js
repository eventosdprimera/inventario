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
}// ==========================================
// VARIABLES GLOBALES
// ==========================================
let rentasPendientes = [];
let rentaSeleccionadaRecepcion = null;
let itemsRecepcion = [];
let usuarioActualRecepcion = null;
let numeroRecepcionActual = null;
let recepcionGuardadaId = null;

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarRecepcionEquipos() {
  console.log('📥 === INICIANDO RECEPCIÓN DE EQUIPOS ===');
    inyectarEstilosRecepcion();
  
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }

  if (typeof supabaseClient === 'undefined') {
    mostrarMensajeRecepcion('Error: Supabase no está disponible', 'error');
    return;
  }

  await cargarUsuarioRecepcion();
  await cargarRentasPendientes();
  configurarInputEscaneo();
  
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
      .select(`
        *,
        rentas_items(count)
      `)
      .in('estado', ['activa'])
      .order('fecha_devolucion', { ascending: true });

    if (error) throw error;

    // Enriquecer con conteo de items y detectar vencidas
    const hoy = new Date().toISOString().split('T')[0];
    rentasPendientes = (data || []).map(r => {
      const totalEquipos = r.rentas_items?.[0]?.count || 0;
      const estadoVisual = (r.fecha_devolucion && r.fecha_devolucion < hoy) ? 'vencida' : 'activa';
      return { ...r, total_equipos: totalEquipos, estado_visual: estadoVisual };
    });

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
                  class="btn-action btn-primary" style="padding: 6px 14px; font-size: 12px;">
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
      mostrarMensajeRecepcion('No se pudo cargar la renta', 'error');
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

    // Renderizar info
    renderizarInfoRenta(renta);
    renderizarTablaEquiposRecepcion();
    actualizarEstadisticas();
    await generarNumeroRecepcion();

    // Mostrar sección de recepción
    document.getElementById('fieldsetListaRentas').style.display = 'none';
    document.getElementById('fieldsetRecepcion').style.display = 'block';
    document.getElementById('recepcionNumeroRenta').textContent = `#${renta.numero_renta}`;

    // Focus en input de escaneo
    setTimeout(() => {
      document.getElementById('inputEscaneo')?.focus();
    }, 300);

  } catch (err) {
    console.error('Error al seleccionar renta:', err);
    mostrarMensajeRecepcion('Error al cargar la renta: ' + err.message, 'error');
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

  tbody.innerHTML = itemsRecepcion.map((item, index) => {
    const estadoClass = `item-${item.estado_recepcion}`;
    const estadoIcon = item.estado_recepcion === 'recibido' ? '✅' :
                       item.estado_recepcion === 'faltante' ? '❌' : '⏳';
    const estadoTexto = item.estado_recepcion === 'recibido' ? 'Recibido' :
                        item.estado_recepcion === 'faltante' ? 'Faltante' : 'Pendiente';
    const horaEscaneo = item.fecha_escaneo ?
      new Date(item.fecha_escaneo).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-';
    const esAdmin = usuarioActualRecepcion?.rol === 'administrador';
    
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
            <label for="faltante-${item.id}">Marcar faltante</label>
          </div>
        </td>
        <td style="font-family: monospace; font-size: 12px; text-align: center;">${horaEscaneo}</td>
      </tr>
    `;
  }).join('');
}

// ==========================================
// CONFIGURAR INPUT DE ESCANEO (SOPORTE MÚLTIPLES ESCÁNERES)
// ==========================================
function configurarInputEscaneo() {
  const input = document.getElementById('inputEscaneo');
  if (!input) return;

  // Forzar mayúsculas
  input.addEventListener('input', (e) => {
    const cursorPos = e.target.selectionStart;
    e.target.value = e.target.value.toUpperCase();
    e.target.setSelectionRange(cursorPos, cursorPos);
  });

  // Procesar al presionar Enter (el escáner envía Enter automáticamente)
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      procesarEscaneo(input.value.trim());
      input.value = '';
    }
  });
}

// ==========================================
// PROCESAR ESCANEO (SOPORTA MÚLTIPLES ESCÁNERES SIMULTÁNEOS)
// ==========================================
async function procesarEscaneo(codigo) {
  if (!codigo || !rentaSeleccionadaRecepcion) return;

  // Sanitizar
  codigo = codigo.replace(/'/g, '').replace(/"/g, '').replace(/`/g, '').trim();

  // Buscar en la lista de items (case-insensitive)
  const codigoUpper = codigo.toUpperCase();
  const itemEncontrado = itemsRecepcion.find(item =>
    item.codigo_barras.toUpperCase() === codigoUpper ||
    (item.serial && item.serial.toUpperCase() === codigoUpper)
  );

  if (!itemEncontrado) {
    mostrarToastRecepcion(`⚠️ Código "${codigo}" NO está en esta renta`, 'error');
    return;
  }

  if (itemEncontrado.estado_recepcion === 'recibido') {
    mostrarToastRecepcion(`ℹ️ Equipo "${itemEncontrado.nombre_equipo}" ya fue escaneado`, 'warning');
    return;
  }

  if (itemEncontrado.estado_recepcion === 'faltante') {
    mostrarToastRecepcion(`⚠️ Equipo "${itemEncontrado.nombre_equipo}" estaba marcado como faltante. Actualizando...`, 'warning');
  }

  // ✅ Marcar como recibido
  itemEncontrado.estado_recepcion = 'recibido';
  itemEncontrado.fecha_escaneo = new Date().toISOString();
  itemEncontrado.escaneado_por = usuarioActualRecepcion?.email || 'unknown';

  // Actualizar visualmente solo esa fila
  actualizarFilaItem(itemEncontrado);
  actualizarEstadisticas();

  // Efecto visual de confirmación
  const fila = document.getElementById(`fila-item-${itemEncontrado.id}`);
  if (fila) {
    fila.classList.add('item-escaneando');
    setTimeout(() => fila.classList.remove('item-escaneando'), 500);
  }

  mostrarToastRecepcion(`✅ ${itemEncontrado.nombre_equipo} recibido`, 'exito');

  // Verificar si todos están recibidos/marcados
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

  // Actualizar celda de estado
  const celdasEstado = fila.querySelectorAll('td');
  if (celdasEstado[5]) {
    celdasEstado[5].innerHTML = `${estadoIcon} ${estadoTexto}`;
    celdasEstado[5].style.fontWeight = '700';
    celdasEstado[5].style.textAlign = 'center';
  }

  // Actualizar hora de escaneo
  if (celdasEstado[7]) {
    const horaEscaneo = item.fecha_escaneo ?
      new Date(item.fecha_escaneo).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-';
    celdasEstado[7].innerHTML = horaEscaneo;
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

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statRecibidos').textContent = recibidos;
  document.getElementById('statPendientes').textContent = pendientes;
  document.getElementById('statFaltantes').textContent = faltantes;

  const porcentaje = total > 0 ? Math.round((procesados / total) * 100) : 0;
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  
  if (progressBar) {
    progressBar.style.width = `${porcentaje}%`;
    // Cambiar color según el progreso
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
    btnGuardar.style.animation = 'pulse 1s infinite';
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

    // ✅ Solo una consulta (la tabla de recepciones)
    const resRecepciones = await supabaseClient
      .from('recepcion_equipos')
      .select('numero_recepcion')
      .like('numero_renta', patron);

    let numeroMaximo = 0;
    
    // ✅ Verificar que data exista antes de iterar
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
// GUARDAR RECEPCIÓN
// ==========================================
async function guardarRecepcion() {
  if (!rentaSeleccionadaRecepcion) return;

  const pendientes = itemsRecepcion.filter(i => i.estado_recepcion === 'pendiente').length;
  const recibidos = itemsRecepcion.filter(i => i.estado_recepcion === 'recibido').length;
  const faltantes = itemsRecepcion.filter(i => i.estado_recepcion === 'faltante').length;

  // Validación: si hay pendientes, requerir confirmación del admin
  if (pendientes > 0) {
    if (usuarioActualRecepcion?.rol !== 'administrador') {
      mostrarMensajeRecepcion(`⚠️ Hay ${pendientes} equipo(s) pendiente(s). Solo un administrador puede guardar con faltantes.`, 'error');
      return;
    }
    
    const confirmacion = confirm(
      `⚠️ ATENCIÓN ADMINISTRADOR\n\n` +
      `Hay ${pendientes} equipo(s) SIN procesar:\n` +
      `- Recibidos: ${recibidos}\n` +
      `- Faltantes marcados: ${faltantes}\n` +
      `- Pendientes: ${pendientes}\n\n` +
      `¿Está SEGURO de guardar la recepción INCOMPLETA?\n` +
      `Los equipos pendientes quedarán registrados como NO RECIBIDOS.`
    );
    if (!confirmacion) return;
  }

  const btnGuardar = document.getElementById('btnGuardarRecepcion');
  if (btnGuardar) {
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '⏳ Guardando...';
  }

  try {
    // Determinar estado final
    let estadoFinal = 'completa';
    if (faltantes > 0 && pendientes === 0) estadoFinal = 'con_faltantes';
    if (pendientes > 0) estadoFinal = 'parcial';

    const observaciones = document.getElementById('observacionesRecepcion')?.value.trim() || '';

    // 1. Insertar recepción principal
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
        equipos_faltantes: faltantes + pendientes,
        estado: estadoFinal,
        observaciones: observaciones,
        recibido_por_email: usuarioActualRecepcion?.email || 'unknown',
        recibido_por_id: usuarioActualRecepcion?.id || null
      })
      .select()
      .single();

    if (errorRecepcion) throw errorRecepcion;
    recepcionGuardadaId = recepcionData.id;

    // 2. Insertar items en lotes de 100
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

    // 3. Actualizar estado de la renta original a 'devuelta'
    const { error: errorUpdateRenta } = await supabaseClient
      .from('rentas')
      .update({ estado: 'devuelta' })
      .eq('id', rentaSeleccionadaRecepcion.id);

    if (errorUpdateRenta) {
      console.warn('No se pudo actualizar la renta a devuelta:', errorUpdateRenta);
    }

    // 4. Registrar log
    if (typeof registrarLog === 'function') {
      const descripcion = `Recepción ${numeroRecepcionActual} | Renta: ${rentaSeleccionadaRecepcion.numero_renta} | Cliente: ${rentaSeleccionadaRecepcion.cliente_nombre} | Recibidos: ${recibidos}/${itemsRecepcion.length} | Faltantes: ${faltantes} | Estado: ${estadoFinal} | Por: ${usuarioActualRecepcion?.email || 'Desconocido'}`;
      await registrarLog('rentar', 'Recepción de equipos', descripcion, estadoFinal === 'completa' ? 'success' : 'warning');
    }

    mostrarMensajeRecepcion(`✅ Recepción ${numeroRecepcionActual} guardada exitosamente`, 'exito');
    
    // Mostrar botón de imprimir
    const btnImprimir = document.getElementById('btnImprimirRecepcion');
    if (btnImprimir) btnImprimir.style.display = 'inline-block';

    if (btnGuardar) {
      btnGuardar.innerHTML = '✅ Guardada';
      btnGuardar.style.animation = '';
    }

    // Auto-imprimir y luego volver a la lista
    setTimeout(() => {
      imprimirComprobanteRecepcion();
    }, 800);

  } catch (err) {
    console.error('Error al guardar recepción:', err);
    mostrarMensajeRecepcion('Error al guardar: ' + err.message, 'error');
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.innerHTML = '💾 Guardar Recepción';
    }
  }
}

// ==========================================
// CANCELAR RECEPCIÓN
// ==========================================
function cancelarRecepcion() {
  const pendientes = itemsRecepcion.filter(i => i.estado_recepcion === 'pendiente').length;
  const procesados = itemsRecepcion.length - pendientes;
  
  if (procesados > 0 && !confirm(`¿Cancelar recepción? Se perderán ${procesados} equipo(s) ya escaneados.`)) {
    return;
  }

  rentaSeleccionadaRecepcion = null;
  itemsRecepcion = [];
  recepcionGuardadaId = null;

  document.getElementById('fieldsetListaRentas').style.display = 'block';
  document.getElementById('fieldsetRecepcion').style.display = 'none';

  // Recargar lista
  cargarRentasPendientes();
}

// ==========================================
// IMPRIMIR COMPROBANTE PEQUEÑO (TICKET)
// ==========================================
function imprimirComprobanteRecepcion() {
  if (!rentaSeleccionadaRecepcion || !recepcionGuardadaId) {
    mostrarMensajeRecepcion('No hay recepción guardada para imprimir', 'error');
    return;
  }

  const recibidos = itemsRecepcion.filter(i => i.estado_recepcion === 'recibido').length;
  const faltantes = itemsRecepcion.filter(i => i.estado_recepcion === 'faltante').length;
  const pendientes = itemsRecepcion.filter(i => i.estado_recepcion === 'pendiente').length;
  const observaciones = document.getElementById('observacionesRecepcion')?.value.trim() || '';

  const itemsHTML = itemsRecepcion.map((item, i) => {
    const icono = item.estado_recepcion === 'recibido' ? '✅' :
                  item.estado_recepcion === 'faltante' ? '❌' : '⏳';
    const estadoTexto = item.estado_recepcion.toUpperCase();
    const hora = item.fecha_escaneo ?
      new Date(item.fecha_escaneo).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '-';
    
    return `
      <tr>
        <td style="padding: 4px 6px; border-bottom: 1px dashed #ddd; font-size: 10px;">${i + 1}</td>
        <td style="padding: 4px 6px; border-bottom: 1px dashed #ddd; font-size: 10px; font-family: monospace;">${item.codigo_barras}</td>
        <td style="padding: 4px 6px; border-bottom: 1px dashed #ddd; font-size: 10px;">${item.nombre_equipo}</td>
        <td style="padding: 4px 6px; border-bottom: 1px dashed #ddd; font-size: 10px; text-align: center;">${icono}</td>
        <td style="padding: 4px 6px; border-bottom: 1px dashed #ddd; font-size: 9px; text-align: center;">${hora}</td>
      </tr>
    `;
  }).join('');

  const estadoFinal = pendientes > 0 ? 'PARCIAL' : (faltantes > 0 ? 'CON FALTANTES' : 'COMPLETA');
  const estadoColor = estadoFinal === 'COMPLETA' ? '#10b981' : (estadoFinal === 'PARCIAL' ? '#f59e0b' : '#dc2626');

  const ventana = window.open('', '_blank', 'width=400,height=700');
  const html = `<!DOCTYPE html>
<html>
<head>
<title>Comprobante Recepción ${numeroRecepcionActual}</title>
<style>
@page { size: 80mm auto; margin: 3mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Courier New', monospace; font-size: 11px; color: #000; padding: 5mm; width: 80mm; }
.header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
.header h1 { font-size: 14px; margin-bottom: 3px; }
.header p { font-size: 10px; color: #555; }
.numero-rec { text-align: center; background: #000; color: white; padding: 6px; margin: 8px 0; font-weight: bold; font-size: 13px; letter-spacing: 1px; }
.info-section { margin: 8px 0; padding: 6px 0; border-bottom: 1px dashed #000; }
.info-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 10px; }
.info-row strong { font-weight: bold; }
.estado-final { text-align: center; padding: 8px; margin: 8px 0; border: 2px solid ${estadoColor}; border-radius: 4px; background: ${estadoColor}15; color: ${estadoColor}; font-weight: bold; font-size: 13px; }
.stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; margin: 8px 0; }
.stat-box { text-align: center; padding: 4px; border: 1px solid #000; font-size: 10px; }
.stat-box strong { display: block; font-size: 16px; margin: 2px 0; }
table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 10px; }
th { background: #000; color: white; padding: 4px; font-size: 9px; text-align: left; }
.observaciones { margin: 8px 0; padding: 6px; border: 1px dashed #000; font-size: 10px; font-style: italic; }
.footer { text-align: center; margin-top: 10px; padding-top: 8px; border-top: 2px dashed #000; font-size: 9px; color: #555; }
.firma { margin-top: 15px; text-align: center; }
.firma-line { border-top: 1px solid #000; margin-top: 25px; padding-top: 3px; font-size: 10px; }
@media print {
  .no-print { display: none; }
  body { width: 80mm; padding: 0; }
}
</style>
</head>
<body>
<div class="header">
<h1>EVENTOS D' PRIMERA</h1>
<p>Comprobante de Recepción</p>
</div>

<div class="numero-rec">N° ${numeroRecepcionActual}</div>

<div class="estado-final">
${estadoFinal}
</div>

<div class="info-section">
<div class="info-row"><span>Renta:</span> <strong>${rentaSeleccionadaRecepcion.numero_renta}</strong></div>
<div class="info-row"><span>Cliente:</span> <strong>${rentaSeleccionadaRecepcion.cliente_nombre}</strong></div>
<div class="info-row"><span>Teléfono:</span> <strong>${rentaSeleccionadaRecepcion.cliente_telefono || 'N/A'}</strong></div>
<div class="info-row"><span>Fecha Recepción:</span> <strong>${new Date().toLocaleString('es-ES')}</strong></div>
<div class="info-row"><span>Recibido por:</span> <strong>${usuarioActualRecepcion?.email || 'N/A'}</strong></div>
</div>

<div class="stats">
<div class="stat-box">Total<strong>${itemsRecepcion.length}</strong></div>
<div class="stat-box" style="color: #10b981;">Recib.<strong>${recibidos}</strong></div>
<div class="stat-box" style="color: #dc2626;">Falt.<strong>${faltantes + pendientes}</strong></div>
</div>

<table>
<thead>
<tr>
<th>#</th>
<th>Código</th>
<th>Equipo</th>
<th>Est.</th>
<th>Hora</th>
</tr>
</thead>
<tbody>${itemsHTML}</tbody>
</table>

${observaciones ? `<div class="observaciones"><strong>Obs:</strong> ${observaciones}</div>` : ''}

<div class="firma">
<div class="firma-line">
<strong>${rentaSeleccionadaRecepcion.cliente_nombre}</strong><br>
Firma del Cliente
</div>
</div>

<div class="footer">
<p>© Eventos D' Primera</p>
<p>${new Date().toLocaleString('es-ES')}</p>
</div>

<div class="no-print" style="margin-top: 20px; text-align: center;">
<button onclick="window.print()" style="padding: 8px 20px; background: #1e3a8a; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;">🖨️ Imprimir</button>
<button onclick="window.close()" style="padding: 8px 20px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;">Cerrar</button>
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
// MOSTRAR MENSAJE
// ==========================================
function mostrarMensajeRecepcion(texto, tipo) {
  const msg = document.getElementById('mensaje');
  if (msg) {
    msg.textContent = texto;
    msg.className = `mensaje ${tipo}`;
    setTimeout(() => { msg.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
    if (tipo === 'exito') {
      setTimeout(() => { if (msg.classList.contains('exito')) msg.className = 'mensaje'; }, 5000);
    }
  }
}

// ==========================================
// SISTEMA TOAST (mensajes flotantes laterales)
// ==========================================
function mostrarToastRecepcion(texto, tipo) {
  let toastContainer = document.getElementById('toastContainerRecepcion');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainerRecepcion';
    toastContainer.style.cssText = `position: fixed; top: 80px; right: 20px; z-index: 999999; display: flex; flex-direction: column; gap: 10px; max-width: 350px;`;
    document.body.appendChild(toastContainer);
  }

  const bgColor = tipo === 'exito' ? '#d1fae5' : (tipo === 'error' ? '#fee2e2' : '#fef3c7');
  const borderColor = tipo === 'exito' ? '#10b981' : (tipo === 'error' ? '#dc2626' : '#f59e0b');
  const textColor = tipo === 'exito' ? '#065f46' : (tipo === 'error' ? '#991b1b' : '#92400e');

  const toast = document.createElement('div');
  toast.style.cssText = `background: ${bgColor}; border-left: 4px solid ${borderColor}; color: ${textColor}; padding: 12px 16px; border-radius: 8px; font-size: 13px; font-family: 'Poppins', sans-serif; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: toastSlideIn 0.3s ease; display: flex; align-items: center; gap: 10px;`;
  toast.innerHTML = `<span style="font-size: 16px;">${tipo === 'exito' ? '✅' : (tipo === 'error' ? '⚠️' : 'ℹ️')}</span><span style="flex: 1;">${texto}</span><span onclick="this.parentElement.remove()" style="cursor: pointer; font-size: 16px; opacity: 0.6;">✕</span>`;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'toastSlideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 3000);
}

// Animaciones toast
if (!document.getElementById('toastStylesRecepcion')) {
  const style = document.createElement('style');
  style.id = 'toastStylesRecepcion';
  style.textContent = `
    @keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes toastSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
  `;
  document.head.appendChild(style);
}

// ==========================================
// INICIALIZAR AL CARGAR EL DOM
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  inicializarRecepcionEquipos();
});
