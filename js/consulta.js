// ==========================================
// VARIABLES GLOBALES
// ==========================================
let equipoSeleccionadoConsulta = null;
let paginaActualConsulta = 1;
const POR_PAGINA_CONSULTA = 20;
let totalEquiposConsulta = 0;
let usuarioActualConsulta = null;
let equiposEnriquecidosCache = [];
let filtrosActuales = { estatus: '', fechaInicio: '', fechaFin: '' };

// ==========================================
// INYECTAR ESTILOS CSS
// ==========================================
function inyectarEstilosConsulta() {
  if (document.getElementById('estilos-consulta-inyectados')) return;
  const style = document.createElement('style');
  style.id = 'estilos-consulta-inyectados';
  style.textContent = `
    .container { max-width: 1200px; margin: 0 auto; padding: 30px; }
    .page-header { text-align: center; margin-bottom: 35px; }
    .page-title { font-family: 'Libre Caslon Text', serif; color: #1e3a8a; font-size: 32px; margin: 0; font-weight: 700; }
    .page-subtitle { color: #6b7280; font-size: 15px; margin-top: 8px; }
    fieldset { border: 1px solid #d1d5db; border-radius: 10px; padding: 25px; margin-bottom: 25px; background: #fafafa; }
    legend { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; }
    .mensaje { padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; font-weight: 600; display: none; }
    .mensaje.exito { background: #d1fae5; color: #065f46; border-left: 4px solid #10b981; display: block; }
    .mensaje.error { background: #fee2e2; color: #991b1b; border-left: 4px solid #ef4444; display: block; }
    .btn-action { padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s; font-family: 'Poppins', sans-serif; }
    .btn-primary { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(30, 58, 138, 0.3); }
    .btn-secondary { background-color: #6b7280; color: white; }
    .btn-secondary:hover { background-color: #4b5563; }
    .btn-success { background: #10b981; color: white; }
    .btn-success:hover { background: #059669; }
    .badge { padding: 6px 14px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; display: inline-block; letter-spacing: 0.5px; }
    .badge-operativo { background: #d1fae5; color: #065f46; }
    .badge-inoperativo { background: #fee2e2; color: #991b1b; }
    .badge-rentado { background: #dbeafe; color: #1e40af; }
    .badge-averiado { background: #fef3c7; color: #92400e; }
    .table-container { overflow-x: auto; margin-top: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
    table { width: 100%; border-collapse: collapse; background: white; }
    th { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 14px 12px; text-align: left; font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    tr:hover { background: #f9fafb; cursor: pointer; }
    tr.selected { background: #eff6ff; border-left: 4px solid #1e3a8a; }
    .fotos-grid-consulta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 10px; }
    .foto-preview-consulta { width: 100%; height: 140px; border: 2px solid #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; background-color: #f9fafb; overflow: hidden; cursor: pointer; transition: all 0.3s; position: relative; }
    .foto-preview-consulta:hover { border-color: #1e3a8a; transform: scale(1.02); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .foto-preview-consulta img { width: 100%; height: 100%; object-fit: cover; }
    .foto-preview-placeholder { text-align: center; color: #9ca3af; font-size: 11px; padding: 30px; grid-column: 1 / -1; }
    .foto-preview-placeholder-icon { font-size: 40px; margin-bottom: 8px; }
    /* ✅ NUEVO: Skeleton loader para carga rápida */
    .skeleton-row td { padding: 14px 12px; }
    .skeleton-bar { height: 14px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    @media print { .no-print { display: none !important; } body { padding: 0; } fieldset { border: none; padding: 0; } }
    @media (max-width: 768px) { .fotos-grid-consulta { grid-template-columns: repeat(2, 1fr); } }
  `;
  document.head.appendChild(style);
}

// ==========================================
// CARGAR FOTOS
// ==========================================
async function cargarFotosConsulta(equipo) {
  const contenedor = document.getElementById('consultaFotos');
  contenedor.innerHTML = '';
  contenedor.className = 'fotos-grid-consulta';
  let fotos = [];
  if (equipo.foto_url) fotos.push(equipo.foto_url);
  if (equipo.foto2_url) fotos.push(equipo.foto2_url);
  if (equipo.foto3_url) fotos.push(equipo.foto3_url);
  if (equipo.foto4_url) fotos.push(equipo.foto4_url);
  if (fotos.length === 0) {
    contenedor.innerHTML = `<div class="foto-preview-placeholder"><div class="foto-preview-placeholder-icon">📷</div><div>Sin fotos registradas</div></div>`;
    return;
  }
  fotos.forEach((fotoUrl, index) => {
    const div = document.createElement('div');
    div.className = 'foto-preview-consulta';
    div.title = 'Clic para ver en zoom';
    const img = document.createElement('img');
    img.src = fotoUrl;
    img.alt = `Foto ${index + 1}`;
    img.style.cursor = 'pointer';
    img.onclick = function() { abrirZoomInfalibleConsulta(fotoUrl); };
    img.onerror = function() {
      this.parentElement.innerHTML = '<div style="color: #ef4444; font-size: 11px; text-align: center; padding: 10px;">❌ Error al cargar</div>';
    };
    div.appendChild(img);
    contenedor.appendChild(div);
  });
}

// ==========================================
// SISTEMA TOAST
// ==========================================
function mostrarToastConsulta(texto, tipo) {
  let toastContainer = document.getElementById('toastContainerConsulta');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainerConsulta';
    toastContainer.style.cssText = `position: fixed; top: 80px; right: 20px; z-index: 999999; display: flex; flex-direction: column; gap: 10px; max-width: 350px;`;
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  const bgColor = tipo === 'exito' ? '#d1fae5' : (tipo === 'error' ? '#fee2e2' : '#fef3c7');
  const borderColor = tipo === 'exito' ? '#10b981' : (tipo === 'error' ? '#dc2626' : '#f59e0b');
  const textColor = tipo === 'exito' ? '#065f46' : (tipo === 'error' ? '#991b1b' : '#92400e');
  toast.style.cssText = `background: ${bgColor}; border-left: 4px solid ${borderColor}; color: ${textColor}; padding: 14px 18px; border-radius: 8px; font-size: 14px; font-family: 'Poppins', sans-serif; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: toastSlideIn 0.3s ease; display: flex; align-items: center; gap: 10px;`;
  toast.innerHTML = `<span style="font-size: 20px;">${tipo === 'exito' ? '✅' : '⚠️'}</span><span style="flex: 1;">${texto}</span><span onclick="this.parentElement.remove()" style="cursor: pointer; font-size: 20px; opacity: 0.6;">✕</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'toastSlideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}
if (!document.getElementById('toastStylesConsulta')) {
  const style = document.createElement('style');
  style.id = 'toastStylesConsulta';
  style.textContent = `@keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes toastSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }`;
  document.head.appendChild(style);
}

// ==========================================
// ZOOM INFALIBLE
// ==========================================
function abrirZoomInfalibleConsulta(url) {
  const modal = document.createElement('div');
  modal.id = 'modalZoomDinamicoConsulta';
  modal.style.cssText = `position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background-color: rgba(0, 0, 0, 0.95) !important; z-index: 999999 !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: zoom-out;`;
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = `position: absolute !important; top: 20px !important; right: 30px !important; color: #fff !important; font-size: 40px !important; font-weight: bold !important; cursor: pointer !important; background: none !important; border: none !important; z-index: 1000000 !important;`;
  closeBtn.onclick = function(e) { e.stopPropagation(); cerrarZoomInfalibleConsulta(); };
  const img = document.createElement('img');
  img.src = url;
  img.style.cssText = `max-width: 90% !important; max-height: 90vh !important; border-radius: 8px; box-shadow: 0 0 30px rgba(0,0,0,0.8);`;
  modal.appendChild(closeBtn);
  modal.appendChild(img);
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  modal.addEventListener('click', function(e) { if (e.target === modal) cerrarZoomInfalibleConsulta(); });
}
function cerrarZoomInfalibleConsulta() {
  const modal = document.getElementById('modalZoomDinamicoConsulta');
  if (modal) { modal.remove(); document.body.style.overflow = ''; }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarConsulta() {
  // Inyectar estilos primero
  inyectarEstilosConsulta();

  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }

  if (typeof supabaseClient === 'undefined') {
    mostrarToastConsulta('Error: Supabase no está disponible', 'error');
    return;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    const { data } = await supabaseClient.from('usuarios').select('*').eq('email', session.user.email).maybeSingle();
    usuarioActualConsulta = data || { email: session.user.email, id: session.user.id, rol: 'consultor' };
  }

  const inputBusqueda = document.getElementById('buscarConsulta');
  if (inputBusqueda) {
    // ✅ Forzar MAYÚSCULAS en tiempo real (para el lector USB)
    inputBusqueda.addEventListener('input', (e) => {
      const cursorPos = e.target.selectionStart;
      e.target.value = e.target.value.toUpperCase();
      e.target.setSelectionRange(cursorPos, cursorPos);
    });

    // ✅ Detectar Enter para buscar (el lector USB envía Enter automáticamente)
    inputBusqueda.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        buscarEquipoConsulta();
      }
    });

    // ✅ Auto-focus para que el lector funcione inmediatamente
    setTimeout(() => inputBusqueda.focus(), 100);
  }

  const filtroEstatus = document.getElementById('filtroEstatus');
  const filtroFechaInicio = document.getElementById('filtroFechaInicio');
  const filtroFechaFin = document.getElementById('filtroFechaFin');
  if (filtroEstatus) filtroEstatus.addEventListener('change', () => { paginaActualConsulta = 1; aplicarFiltrosYRenderizar(); });
  if (filtroFechaInicio) filtroFechaInicio.addEventListener('change', () => { paginaActualConsulta = 1; aplicarFiltrosYRenderizar(); });
  if (filtroFechaFin) filtroFechaFin.addEventListener('change', () => { paginaActualConsulta = 1; aplicarFiltrosYRenderizar(); });

  await cargarListaEquipos();
}

// ==========================================
// ✅ DETERMINAR ESTATUS OPTIMIZADO (3 consultas EN PARALELO)
// ==========================================
async function determinarEstatus(codigoBarras) {
  let estatus = 'operativo';
  let infoAdicional = null;

  // ✅ EJECUTAR LAS 3 CONSULTAS EN PARALELO (no secuenciales)
  const [averiaResult, rentaResult, equipoResult] = await Promise.all([
    supabaseClient.from('equipos_averiados').select('*').eq('codigo_barras', codigoBarras).neq('estado_reparacion', 'reintegrado').maybeSingle(),
    verificarSiEstaRentado(codigoBarras),
    supabaseClient.from('equipos').select('estatus').eq('codigo_barras', codigoBarras).maybeSingle()
  ]);

  // 1. ¿Está averiado?
  const averiaActiva = averiaResult.data;
  if (averiaActiva && !averiaResult.error) {
    estatus = 'averiado';
    infoAdicional = {
      tipo: 'averia',
      titulo: '🔧 Información de Avería',
      datos: [
        { label: 'Reportante', valor: `${averiaActiva.reportante_nombre || ''} ${averiaActiva.reportante_apellidos || ''}`.trim() || 'N/A' },
        { label: 'Fecha Avería', valor: averiaActiva.fecha_averia ? new Date(averiaActiva.fecha_averia + 'T12:00:00').toLocaleDateString('es-ES') : '-' },
        { label: 'Detalles', valor: averiaActiva.detalles_averia || 'Sin detalles' },
        { label: 'Estado Reparación', valor: averiaActiva.estado_reparacion || 'pendiente' }
      ]
    };
    return { estatus, infoAdicional };
  }

  // 2. ¿Está rentado?
  const { estaRentado, renta, item } = rentaResult;
  if (estaRentado && renta) {
    estatus = 'rentado';
    infoAdicional = {
      tipo: 'renta',
      titulo: '🤝 Información de Renta Activa',
      datos: [
        { label: 'Número de Renta', valor: renta.numero_renta || 'N/A' },
        { label: 'Cliente', valor: renta.cliente_nombre || 'N/A' },
        { label: 'Teléfono', valor: renta.cliente_telefono || 'N/A' },
        { label: 'Fecha Renta', valor: renta.fecha_renta ? new Date(renta.fecha_renta).toLocaleDateString('es-ES') : '-' },
        { label: 'Fecha Devolución', valor: renta.fecha_devolucion ? new Date(renta.fecha_devolucion).toLocaleDateString('es-ES') : '-' },
        { label: 'Cantidad', valor: item?.cantidad || '1' },
        { label: 'Precio Unitario', valor: item?.precio_unitario ? `$${parseFloat(item.precio_unitario).toFixed(2)}` : '$0.00' }
      ]
    };
    return { estatus, infoAdicional };
  }

  // 3. Estatus normal de la tabla equipos
  if (equipoResult.data) {
    estatus = equipoResult.data.estatus || 'operativo';
  }
  return { estatus, infoAdicional };
}

// ==========================================
// VERIFICAR SI UN EQUIPO ESTÁ RENTADO
// ==========================================
async function verificarSiEstaRentado(codigoBarras) {
  try {
    const { data: itemsRenta, error: errorItems } = await supabaseClient
      .from('rentas_items')
      .select('renta_id, cantidad, precio_unitario')
      .eq('codigo_barras', codigoBarras);
    if (errorItems || !itemsRenta || itemsRenta.length === 0) {
      return { estaRentado: false, renta: null, item: null };
    }
    for (const item of itemsRenta) {
      const { data: renta, error: errorRenta } = await supabaseClient
        .from('rentas')
        .select('*')
        .eq('id', item.renta_id)
        .eq('estado', 'activa')
        .maybeSingle();
      if (!errorRenta && renta) {
        return { estaRentado: true, renta: renta, item: item };
      }
    }
    return { estaRentado: false, renta: null, item: null };
  } catch (err) {
    console.error('Error al verificar renta:', err);
    return { estaRentado: false, renta: null, item: null };
  }
}

// ==========================================
// BUSCAR EQUIPO (CASE-INSENSITIVE)
// ==========================================
async function buscarEquipoConsulta() {
  const input = document.getElementById('buscarConsulta');
  if (!input) return;
  let codigo = input.value.trim();
  if (!codigo) {
    mostrarToastConsulta('Por favor ingrese un código de barras o serial', 'error');
    return;
  }

  // ✅ Sanitizar y convertir a MAYÚSCULAS
  codigo = codigo.replace(/'/g, '-').replace(/"/g, '-').replace(/`/g, '-').trim().toUpperCase();
  input.value = codigo; // ✅ Actualizar el input con mayúsculas

  try {
    // ✅ Primero buscar por código de barras (case-insensitive)
    let { data: equipo, error } = await supabaseClient
      .from('equipos')
      .select('*')
      .ilike('codigo_barras', codigo)  // ✅ ilike = case-insensitive
      .maybeSingle();

    // ✅ Si no encontró por código, buscar por serial (case-insensitive)
    if (!equipo && !error) {
      const resultado = await supabaseClient
        .from('equipos')
        .select('*')
        .ilike('serial', codigo)  // ✅ ilike = case-insensitive
        .maybeSingle();
      equipo = resultado.data;
      error = resultado.error;
    }

    if (error || !equipo) {
      mostrarToastConsulta('Equipo no encontrado', 'error');
      input.value = '';
      input.focus();
      return;
    }

    equipoSeleccionadoConsulta = equipo;
    const { estatus, infoAdicional } = await determinarEstatus(equipo.codigo_barras);

    document.getElementById('consultaCodigo').textContent = equipo.codigo_barras || '-';
    document.getElementById('consultaNombre').textContent = equipo.nombre_equipo || '-';
    document.getElementById('consultaMarca').textContent = equipo.marca || '-';
    document.getElementById('consultaModelo').textContent = equipo.modelo || '-';
    document.getElementById('consultaSerial').textContent = equipo.serial || '-';
    document.getElementById('consultaCosto').textContent = equipo.costo ? `$${parseFloat(equipo.costo).toFixed(2)}` : '$0.00';
    document.getElementById('consultaMedida').textContent = equipo.medida_valor ? `${equipo.medida_valor} ${equipo.medida_unidad || ''}` : '-';

    const estatusBadge = `<span class="badge badge-${estatus}">${estatus.toUpperCase()}</span>`;
    document.getElementById('consultaEstatus').innerHTML = estatusBadge;

    const infoDiv = document.getElementById('infoAdicional');
    if (infoAdicional) {
      infoDiv.innerHTML = `
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 12px; border-left: 4px solid #f59e0b; margin-top: 25px;">
          <h4 style="color: #92400e; margin: 0 0 20px 0; font-size: 16px; font-family: 'Libre Caslon Text', serif;">${infoAdicional.titulo}</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">
            ${infoAdicional.datos.map(d => `
              <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <label style="font-size: 11px; color: #6b7280; text-transform: uppercase; display: block; margin-bottom: 8px; font-weight: 600;">${d.label}</label>
                <strong style="color: #374151; font-size: 14px; display: block;">${d.valor}</strong>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      infoDiv.innerHTML = '<p style="color: #065f46; font-size: 14px; text-align: center; padding: 20px; background: #d1fae5; border-radius: 8px; font-weight: 600;">✅ Este equipo está disponible (no está rentado ni averiado).</p>';
    }

    await cargarFotosConsulta(equipo);

    document.getElementById('btnImprimirSticker').style.display = 'inline-block';
    document.getElementById('btnImprimirFicha').style.display = 'inline-block';
    document.getElementById('fieldsetFichaConsulta').style.display = 'block';
    document.getElementById('fieldsetFichaConsulta').scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (typeof registrarLog === 'function') {
      await registrarLog('consulta', 'Equipo consultado', `Código: ${equipo.codigo_barras} (${equipo.nombre_equipo}) | Estatus: ${estatus} | Consultado por: ${usuarioActualConsulta?.email || 'Desconocido'}`, 'info');
    }
  } catch (err) {
    console.error('Error al buscar:', err);
    mostrarToastConsulta('Error al buscar: ' + err.message, 'error');
  }
}
// ==========================================
// ✅ CARGAR LISTA DE EQUIPOS (OPTIMIZADO CON PAGINACIÓN REAL)
// ==========================================
async function cargarListaEquipos() {
  const tbody = document.getElementById('tbodyEquipos');
  if (!tbody) return;

  // ✅ Mostrar skeleton loader inmediatamente (no espera nada)
  const skeletonRows = Array(POR_PAGINA_CONSULTA).fill(0).map(() => `
    <tr class="skeleton-row">
      <td><div class="skeleton-bar" style="width: 30px;"></div></td>
      <td><div class="skeleton-bar" style="width: 140px;"></div></td>
      <td><div class="skeleton-bar" style="width: 180px;"></div></td>
      <td><div class="skeleton-bar" style="width: 120px;"></div></td>
      <td><div class="skeleton-bar" style="width: 100px;"></div></td>
      <td><div class="skeleton-bar" style="width: 80px;"></div></td>
      <td><div class="skeleton-bar" style="width: 90px;"></div></td>
      <td><div class="skeleton-bar" style="width: 70px;"></div></td>
    </tr>
  `).join('');
  tbody.innerHTML = skeletonRows;

  try {
    // Leer filtros actuales
    filtrosActuales.estatus = document.getElementById('filtroEstatus')?.value || '';
    filtrosActuales.fechaInicio = document.getElementById('filtroFechaInicio')?.value || '';
    filtrosActuales.fechaFin = document.getElementById('filtroFechaFin')?.value || '';

    // ✅ 1. Construir query base con filtros (reutilizable)
    const construirQuery = (soloConteo = false) => {
      let q = supabaseClient.from('equipos').select(soloConteo ? 'id' : '*', soloConteo ? { count: 'exact', head: true } : {});
      if (filtrosActuales.estatus) q = q.eq('estatus', filtrosActuales.estatus);
      if (filtrosActuales.fechaInicio) q = q.gte('fecha_registro', filtrosActuales.fechaInicio);
      if (filtrosActuales.fechaFin) q = q.lte('fecha_registro', filtrosActuales.fechaFin + 'T23:59:59');
      if (!soloConteo) q = q.order('fecha_registro', { ascending: false });
      return q;
    };

    // ✅ 2. Ejecutar CONTEO y DATOS en PARALELO (gran optimización)
    const desde = (paginaActualConsulta - 1) * POR_PAGINA_CONSULTA;
    const hasta = desde + POR_PAGINA_CONSULTA - 1;

    const [conteoResult, datosResult] = await Promise.all([
      construirQuery(true),
      construirQuery(false).range(desde, hasta)
    ]);

    const { count, error: errorCount } = conteoResult;
    const { data: equipos, error } = datosResult;

    if (error) throw error;

    totalEquiposConsulta = count || 0;
    const contadorDiv = document.getElementById('contadorEquipos');
    if (contadorDiv) contadorDiv.textContent = `Total: ${totalEquiposConsulta} equipo(s)`;

    if (!equipos || equipos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;"><div style="font-size: 40px; margin-bottom: 10px;">📭</div><div>No se encontraron equipos</div></td></tr>`;
      renderizarPaginacionConsulta();
      return;
    }

    // ✅ 3. PRIMERO mostrar la tabla SIN enriquecer (respuesta instantánea)
    renderizarTablaBasica(equipos);

    // ✅ 4. Enriquecer SOLO los 20 equipos de esta página EN PARALELO
    const equiposEnriquecidos = await Promise.all(
      equipos.map(async (equipo) => {
        try {
          const { estatus, infoAdicional } = await determinarEstatus(equipo.codigo_barras);
          return { ...equipo, estatus_real: estatus, info_adicional: infoAdicional };
        } catch (err) {
          return { ...equipo, estatus_real: equipo.estatus || 'operativo', info_adicional: null };
        }
      })
    );

    // ✅ 5. Actualizar la tabla con el estatus real (solo cambia la columna de estatus)
    actualizarEstatusEnTabla(equiposEnriquecidos);
    renderizarPaginacionConsulta();

  } catch (err) {
    console.error('Error al cargar equipos:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: #ef4444;">Error al cargar: ${err.message}</td></tr>`;
  }
}

// ==========================================
// ✅ RENDERIZAR TABLA BÁSICA (sin estatus enriquecido - MUY RÁPIDO)
// ==========================================
function renderizarTablaBasica(equipos) {
  const tbody = document.getElementById('tbodyEquipos');
  if (!tbody) return;
  const desde = (paginaActualConsulta - 1) * POR_PAGINA_CONSULTA;

  tbody.innerHTML = equipos.map((equipo, index) => {
    const globalIndex = desde + index + 1;
    const fechaFormateada = equipo.fecha_registro ? new Date(equipo.fecha_registro).toLocaleDateString('es-ES') : '-';
    const marcaModelo = `${equipo.marca || ''} ${equipo.modelo || ''}`.trim() || '-';
    const estatusBasico = equipo.estatus || 'operativo';
    return `
      <tr onclick="seleccionarEquipoLista('${equipo.codigo_barras}')" id="fila-equipo-${equipo.id}">
        <td>${globalIndex}</td>
        <td style="font-family: monospace; font-weight: 600; color: #1e3a8a;">${equipo.codigo_barras}</td>
        <td><strong>${equipo.nombre_equipo}</strong></td>
        <td>${marcaModelo}</td>
        <td>${equipo.serial || '-'}</td>
        <td>${equipo.costo ? `$${parseFloat(equipo.costo).toFixed(2)}` : '$0.00'}</td>
        <td>${fechaFormateada}</td>
        <td id="celda-estatus-${equipo.id}"><span class="badge badge-${estatusBasico}">${estatusBasico.toUpperCase()}</span></td>
      </tr>
    `;
  }).join('');
}

// ==========================================
// ✅ ACTUALIZAR ESTATUS EN LA TABLA (solo cambia la celda)
// ==========================================
function actualizarEstatusEnTabla(equiposEnriquecidos) {
  equiposEnriquecidos.forEach(equipo => {
    const celda = document.getElementById(`celda-estatus-${equipo.id}`);
    if (celda) {
      celda.innerHTML = `<span class="badge badge-${equipo.estatus_real}">${equipo.estatus_real.toUpperCase()}</span>`;
    }
  });
}

// ==========================================
// APLICAR FILTROS Y RENDERIZAR (ahora recarga desde BD)
// ==========================================
async function aplicarFiltrosYRenderizar() {
  await cargarListaEquipos();
}

// ==========================================
// SELECCIONAR EQUIPO DE LA LISTA
// ==========================================
async function seleccionarEquipoLista(codigoBarras) {
  document.getElementById('buscarConsulta').value = codigoBarras;
  await buscarEquipoConsulta();
}

// ==========================================
// PAGINACIÓN
// ==========================================
function renderizarPaginacionConsulta() {
  const cont = document.getElementById('paginacionConsulta');
  if (!cont) return;
  const totalPaginas = Math.ceil(totalEquiposConsulta / POR_PAGINA_CONSULTA);
  if (totalPaginas <= 1) {
    cont.innerHTML = `<span style="color: #6b7280; font-size: 13px;">Página 1 de 1</span>`;
    return;
  }
  let html = '';
  html += `<button type="button" onclick="cambiarPaginaConsulta(${paginaActualConsulta - 1})" style="padding: 8px 16px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;" ${paginaActualConsulta === 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>‹ Anterior</button>`;
  html += `<span style="color: #374151; font-size: 13px; font-weight: 600;">Página ${paginaActualConsulta} de ${totalPaginas}</span>`;
  html += `<button type="button" onclick="cambiarPaginaConsulta(${paginaActualConsulta + 1})" style="padding: 8px 16px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;" ${paginaActualConsulta === totalPaginas ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>Siguiente ›</button>`;
  cont.innerHTML = html;
}

async function cambiarPaginaConsulta(nuevaPagina) {
  const totalPaginas = Math.ceil(totalEquiposConsulta / POR_PAGINA_CONSULTA);
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
  paginaActualConsulta = nuevaPagina;
  await cargarListaEquipos();
  // Scroll al top de la tabla
  document.getElementById('tbodyEquipos')?.closest('.table-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// LIMPIAR FILTROS
// ==========================================
function limpiarFiltros() {
  const filtroEstatus = document.getElementById('filtroEstatus');
  const filtroFechaInicio = document.getElementById('filtroFechaInicio');
  const filtroFechaFin = document.getElementById('filtroFechaFin');
  if (filtroEstatus) filtroEstatus.value = '';
  if (filtroFechaInicio) filtroFechaInicio.value = '';
  if (filtroFechaFin) filtroFechaFin.value = '';
  paginaActualConsulta = 1;
  cargarListaEquipos();
  mostrarToastConsulta('Filtros limpiados', 'exito');
}

// ==========================================
// LIMPIAR CONSULTA
// ==========================================
function limpiarConsulta() {
  equipoSeleccionadoConsulta = null;
  document.getElementById('buscarConsulta').value = '';
  document.getElementById('fieldsetFichaConsulta').style.display = 'none';
  document.getElementById('btnImprimirSticker').style.display = 'none';
  document.getElementById('btnImprimirFicha').style.display = 'none';
  document.getElementById('buscarConsulta').focus();
}

// ==========================================
// IMPRIMIR STICKER CON CÓDIGO DE BARRAS (ROTADO 90° ESQUINA SUPERIOR IZQUIERDA)
// ==========================================
function imprimirStickerCodigo() {
  if (!equipoSeleccionadoConsulta) {
    mostrarToastConsulta('No hay equipo seleccionado', 'error');
    return;
  }
  const equipo = equipoSeleccionadoConsulta;

  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.innerHTML = '<svg id="stickerBarcodeConsulta"></svg>';
  document.body.appendChild(tempDiv);

  try {
    JsBarcode("#stickerBarcodeConsulta", equipo.codigo_barras, {
      format: "CODE128", width: 1.2, height: 35, displayValue: true,
      fontSize: 9, margin: 1, font: "Courier New", fontOptions: "bold"
    });

    const barcodeSVG = tempDiv.querySelector('svg').outerHTML;
    document.body.removeChild(tempDiv);

    const ventana = window.open('', '_blank', 'width=400,height=300');
    if (!ventana || ventana.closed) {
      mostrarToastConsulta('⚠️ El navegador bloqueó la ventana emergente', 'error');
      return;
    }

    const htmlSticker = `
<!DOCTYPE html>
<html>
<head>
  <title>Sticker - ${equipo.codigo_barras}</title>
  <style>
    @page { size: letter; margin: 5mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 216mm; height: 279mm; font-family: Arial, sans-serif; overflow: hidden; }
    body { display: flex; justify-content: flex-start; align-items: flex-start; padding: 5mm; }
    .sticker { width: 70mm; height: 35mm; border: 0.5mm solid #000; padding: 1.5mm 2mm; text-align: center; display: flex; flex-direction: column; justify-content: space-between; transform: rotate(90deg); transform-origin: top left; margin-left: 35mm; margin-top: 0mm; }
    .empresa { font-size: 6pt; font-weight: bold; color: #1e3a8a; line-height: 1; margin-bottom: 0.5mm; }
    .nombre { font-size: 6pt; font-weight: bold; line-height: 1.1; margin-bottom: 0.5mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .barcode { margin: 0.5mm 0; display: flex; justify-content: center; align-items: center; }
    .barcode svg { max-width: 100%; height: auto; max-height: 12mm; }
    .codigo { font-size: 7pt; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 0.3mm; line-height: 1; }
    .info { font-size: 5pt; color: #333; line-height: 1.1; margin-top: 0.3mm; }
    @media print { body { padding: 5mm; } .sticker { border: 0.3mm solid #000; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="empresa">EVENTOS D' PRIMERA</div>
    <div class="nombre">${(equipo.nombre_equipo || '').substring(0, 40)}</div>
    <div class="barcode">${barcodeSVG}</div>
    <div class="codigo">${equipo.codigo_barras}</div>
    <div class="info">${equipo.marca || ''}${equipo.modelo ? ' ' + equipo.modelo : ''}${equipo.serial ? ' | S/N: ' + equipo.serial : ''}</div>
  </div>
  <div class="no-print" style="position: fixed; bottom: 20px; right: 20px; display: flex; gap: 10px;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #1e3a8a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">🖨️ Imprimir</button>
    <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Cerrar</button>
  </div>
</body>
</html>
    `;

    ventana.document.open();
    ventana.document.write(htmlSticker);
    ventana.document.close();

  } catch (err) {
    console.error('❌ Error al generar sticker:', err);
    mostrarToastConsulta('Error al generar el sticker: ' + err.message, 'error');
    if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
  }
}

// ==========================================
// IMPRIMIR FICHA COMPLETA
// ==========================================
function imprimirFichaCompleta() {
  if (!equipoSeleccionadoConsulta) {
    mostrarToastConsulta('No hay equipo seleccionado', 'error');
    return;
  }
  const equipo = equipoSeleccionadoConsulta;
  const estatus = document.getElementById('consultaEstatus').textContent;
  let fotos = [];
  if (equipo.foto_url) fotos.push(equipo.foto_url);
  if (equipo.foto2_url) fotos.push(equipo.foto2_url);
  if (equipo.foto3_url) fotos.push(equipo.foto3_url);
  if (equipo.foto4_url) fotos.push(equipo.foto4_url);
  const fotosHTML = fotos.map((fotoUrl, i) => `
    <div style="display: inline-block; width: 48%; margin: 1%; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <img src="${fotoUrl}" style="width: 100%; height: 200px; object-fit: cover;">
      <div style="padding: 8px; text-align: center; font-size: 11px; color: #6b7280;">Foto ${i + 1}</div>
    </div>
  `).join('');
  const infoAdicionalHTML = document.getElementById('infoAdicional').innerHTML;
  const ventana = window.open('', '_blank', 'width=900,height=1100');
  ventana.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Ficha del Equipo - ${equipo.codigo_barras}</title>
<link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:wght@400;700&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
@page { size: letter; margin: 15mm; }
* { box-sizing: border-box; }
body { font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #333; max-width: 216mm; margin: 0 auto; padding: 10mm; }
.header { text-align: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; }
.logo-img { max-width: 120px; max-height: 120px; }
.brand h1 { color: #1e3a8a; margin: 10px 0 5px 0; font-size: 28px; font-family: 'Libre Caslon Text', serif; font-weight: 700; }
.brand p { margin: 3px 0 0 0; color: #666; font-size: 12px; }
.ficha-titulo { background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 20px; }
.ficha-titulo h2 { color: #1e40af; margin: 0; font-size: 20px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.info-box { background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; }
.info-box h3 { margin: 0 0 10px 0; color: #1e3a8a; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
.info-box p { margin: 5px 0; font-size: 12px; }
.info-box p strong { color: #374151; }
.estatus-badge { display: inline-block; padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
.estatus-operativo { background: #d1fae5; color: #065f46; }
.estatus-inoperativo { background: #fee2e2; color: #991b1b; }
.estatus-rentado { background: #dbeafe; color: #1e40af; }
.estatus-averiado { background: #fef3c7; color: #92400e; }
.fotos-section { margin-top: 20px; }
.fotos-section h3 { color: #1e3a8a; font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
.footer { margin-top: 30px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
@media print { .no-print { display: none !important; } body { padding: 0; } }
</style>
</head>
<body>
<div class="header">
<img src="${new URL('../img/logo.png', window.location.href).href}" class="logo-img" onerror="this.style.display='none'">
<div class="brand">
<h1>Eventos D' Primera</h1>
<p>Sistema de Inventario y Rentas</p>
</div>
</div>
<div class="ficha-titulo">
<h2>📋 FICHA DEL EQUIPO</h2>
<p style="margin: 10px 0 0 0; font-size: 14px;">Código: <strong>${equipo.codigo_barras}</strong></p>
</div>
<div class="info-grid">
<div class="info-box">
<h3>📦 Información del Equipo</h3>
<p><strong>Nombre:</strong> ${equipo.nombre_equipo}</p>
<p><strong>Marca:</strong> ${equipo.marca || 'N/A'}</p>
<p><strong>Modelo:</strong> ${equipo.modelo || 'N/A'}</p>
<p><strong>Serial:</strong> ${equipo.serial || 'N/A'}</p>
<p><strong>Costo:</strong> ${equipo.costo ? `$${parseFloat(equipo.costo).toFixed(2)}` : '$0.00'}</p>
<p><strong>Medida:</strong> ${equipo.medida_valor ? `${equipo.medida_valor} ${equipo.medida_unidad || ''}` : 'N/A'}</p>
</div>
<div class="info-box">
<h3>📊 Estatus Actual</h3>
<p><span class="estatus-badge estatus-${estatus.toLowerCase()}">${estatus}</span></p>
<p><strong>Fecha Registro:</strong> ${equipo.fecha_registro ? new Date(equipo.fecha_registro).toLocaleDateString('es-ES') : 'N/A'}</p>
<p><strong>Registrado por:</strong> ${equipo.usuario_registro || 'N/A'}</p>
</div>
</div>
${infoAdicionalHTML ? `<div class="info-box" style="margin-bottom: 20px;">${infoAdicionalHTML}</div>` : ''}
${fotosHTML ? `
<div class="fotos-section">
<h3>📸 Fotos del Equipo</h3>
<div style="display: flex; flex-wrap: wrap;">
${fotosHTML}
</div>
</div>
` : ''}
<div class="footer">
<p>©copyright Eventos de Primera | 2026-2027 | Ficha generada el ${new Date().toLocaleString('es-ES')}</p>
</div>
<div class="no-print" style="margin-top: 30px; text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
<button onclick="window.print()" style="padding: 12px 30px; background: #1e3a8a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-right: 10px;">🖨️ Imprimir Ficha</button>
<button onclick="window.close()" style="padding: 12px 30px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">❌ Cerrar</button>
</div>
</body>
</html>`);
  ventana.document.close();
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  inicializarConsulta();
});
