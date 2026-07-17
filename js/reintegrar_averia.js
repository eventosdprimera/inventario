// ==========================================
// VARIABLES GLOBALES
// ==========================================
let averiaSeleccionadaReint = null;
let paginaActualReint = 1;
const POR_PAGINA_REINT = 20;
let totalAveriasReint = 0;
let usuarioActualReint = null;

// ==========================================
// SISTEMA TOAST
// ==========================================
function mostrarToastReint(texto, tipo) {
  let toastContainer = document.getElementById('toastContainerReint');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainerReint';
    toastContainer.style.cssText = `position: fixed; top: 80px; right: 20px; z-index: 999999; display: flex; flex-direction: column; gap: 10px; max-width: 350px;`;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgColor = tipo === 'exito' ? '#d1fae5' : (tipo === 'error' ? '#fee2e2' : '#fef3c7');
  const borderColor = tipo === 'exito' ? '#10b981' : (tipo === 'error' ? '#dc2626' : '#f59e0b');
  const textColor = tipo === 'exito' ? '#065f46' : (tipo === 'error' ? '#991b1b' : '#92400e');
  
  toast.style.cssText = `background: ${bgColor}; border-left: 4px solid ${borderColor}; color: ${textColor}; padding: 14px 18px; border-radius: 8px; font-size: 14px; font-family: 'Poppins', sans-serif; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: toastSlideIn 0.3s ease; display: flex; align-items: center; gap: 10px;`;
  toast.innerHTML = `<span style="font-size: 18px;">${tipo === 'exito' ? '✅' : '️'}</span><span style="flex: 1;">${texto}</span><span onclick="this.parentElement.remove()" style="cursor: pointer; font-size: 18px; opacity: 0.6;">✕</span>`;

  toastContainer.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'toastSlideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 3000);
}

if (!document.getElementById('toastStylesReint')) {
  const style = document.createElement('style');
  style.id = 'toastStylesReint';
  style.textContent = `@keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes toastSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }`;
  document.head.appendChild(style);
}

// ==========================================
// ZOOM INFALIBLE
// ==========================================
function abrirZoomInfalibleReint(url) {
  const modal = document.createElement('div');
  modal.id = 'modalZoomDinamicoReint';
  modal.style.cssText = `position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background-color: rgba(0, 0, 0, 0.95) !important; z-index: 999999 !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: zoom-out;`;
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = `position: absolute !important; top: 20px !important; right: 30px !important; color: #fff !important; font-size: 40px !important; font-weight: bold !important; cursor: pointer !important; background: none !important; border: none !important; z-index: 1000000 !important;`;
  closeBtn.onclick = function(e) { e.stopPropagation(); cerrarZoomInfalibleReint(); };
  
  const img = document.createElement('img');
  img.src = url;
  img.style.cssText = `max-width: 90% !important; max-height: 90vh !important; border-radius: 8px; box-shadow: 0 0 30px rgba(0,0,0,0.8);`;
  
  modal.appendChild(closeBtn);
  modal.appendChild(img);
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  modal.addEventListener('click', function(e) { if (e.target === modal) cerrarZoomInfalibleReint(); });
}

function cerrarZoomInfalibleReint() {
  const modal = document.getElementById('modalZoomDinamicoReint');
  if (modal) { modal.remove(); document.body.style.overflow = ''; }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarReintegrarAveria() {
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }

  if (typeof supabaseClient === 'undefined') {
    mostrarToastReint('Error: Supabase no está disponible', 'error');
    return;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    const { data } = await supabaseClient.from('usuarios').select('*').eq('email', session.user.email).maybeSingle();
    usuarioActualReint = data || { email: session.user.email, id: session.user.id };
  }

  const inputBusqueda = document.getElementById('buscarReintegrar');
  if (inputBusqueda) {
    inputBusqueda.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); buscarEquipoReintegrar(); }
    });
  }

  await cargarListaAverias();
}

// ==========================================
// CARGAR LISTA DE AVERÍAS (SIN FILTRO DE ESTADO)
// ==========================================
async function cargarListaAverias() {
  const tbody = document.getElementById('tbodyAverias');
  const totalSpan = document.getElementById('totalAverias');
  
  if (!tbody) return;

  try {
    const desde = (paginaActualReint - 1) * POR_PAGINA_REINT;
    const hasta = desde + POR_PAGINA_REINT - 1;

    // ✅ CORREGIDO: Ya no filtramos por estado. La tabla solo contiene averías activas.
    const { data, count, error } = await supabaseClient
      .from('equipos_averiados')
      .select('*', { count: 'exact' })
      .order('fecha_averia', { ascending: false })
      .range(desde, hasta);

    if (error) throw error;

    totalAveriasReint = count || 0;
    if (totalSpan) totalSpan.textContent = totalAveriasReint;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;"><div style="font-size: 40px; margin-bottom: 10px;">✅</div><div>No hay averías pendientes de reintegración</div></td></tr>`;
      document.getElementById('paginacionReintegrar').innerHTML = '';
      return;
    }

    tbody.innerHTML = data.map((averia, index) => {
      const globalIndex = desde + index + 1;
      const fechaFormateada = averia.fecha_averia ? new Date(averia.fecha_averia + 'T12:00:00').toLocaleDateString('es-ES') : '-';
      const reportante = `${averia.reportante_nombre || ''} ${averia.reportante_apellidos || ''}`.trim() || '-';
      const marcaModelo = `${averia.marca || ''} ${averia.modelo || ''}`.trim() || '-';
      
      const estadoClass = averia.estado_reparacion === 'reparado' ? 'badge-reparado' : 'badge-pendiente';
      const estadoTexto = averia.estado_reparacion === 'reparado' ? 'Reparado' : 'Pendiente';

      return `
        <tr onclick="seleccionarAveria('${averia.id}')" id="fila-averia-${averia.id}">
          <td>${globalIndex}</td>
          <td style="font-family: monospace; font-weight: 600; color: #1e3a8a;">${averia.codigo_barras}</td>
          <td><strong>${averia.nombre_equipo}</strong></td>
          <td>${marcaModelo}</td>
          <td>${fechaFormateada}</td>
          <td>${reportante}</td>
          <td><span class="badge ${estadoClass}">${estadoTexto}</span></td>
        </tr>
      `;
    }).join('');

    renderizarPaginacionReint();

  } catch (err) {
    console.error('Error al cargar averías:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: #ef4444;">Error al cargar: ${err.message}</td></tr>`;
  }
}

// ==========================================
// PAGINACIÓN
// ==========================================
function renderizarPaginacionReint() {
  const cont = document.getElementById('paginacionReintegrar');
  if (!cont) return;

  const totalPaginas = Math.ceil(totalAveriasReint / POR_PAGINA_REINT);
  
  if (totalPaginas <= 1) {
    cont.innerHTML = `<span style="color: #6b7280; font-size: 13px;">Total: ${totalAveriasReint} avería(s)</span>`;
    return;
  }

  let html = '';
  html += `<button type="button" onclick="cambiarPaginaReint(${paginaActualReint - 1})" style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px;" ${paginaActualReint === 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>‹ Anterior</button>`;
  html += `<span style="color: #374151; font-size: 13px; font-weight: 600;">Página ${paginaActualReint} de ${totalPaginas}</span>`;
  html += `<button type="button" onclick="cambiarPaginaReint(${paginaActualReint + 1})" style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px;" ${paginaActualReint === totalPaginas ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>Siguiente ›</button>`;
  html += `<span style="color: #6b7280; font-size: 13px;">Total: ${totalAveriasReint}</span>`;

  cont.innerHTML = html;
}

async function cambiarPaginaReint(nuevaPagina) {
  const totalPaginas = Math.ceil(totalAveriasReint / POR_PAGINA_REINT);
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
  
  paginaActualReint = nuevaPagina;
  await cargarListaAverias();
}

// ==========================================
// BUSCAR EQUIPO ESPECÍFICO
// ==========================================
async function buscarEquipoReintegrar() {
  const input = document.getElementById('buscarReintegrar');
  if (!input) return;

  let codigo = input.value.trim();
  if (!codigo) {
    mostrarToastReint('Por favor ingrese un código de barras o serial', 'error');
    return;
  }

  codigo = codigo.replace(/'/g, '-').replace(/"/g, '-').replace(/`/g, '-').trim();

  try {
    const { data, error } = await supabaseClient
      .from('equipos_averiados')
      .select('*')
      .or(`codigo_barras.eq.${codigo},serial.eq.${codigo}`)
      .maybeSingle();

    if (error || !data) {
      mostrarToastReint('Avería no encontrada para este equipo', 'error');
      input.value = '';
      input.focus();
      return;
    }

    await mostrarFichaReintegrar(data);

  } catch (err) {
    mostrarToastReint('Error al buscar: ' + err.message, 'error');
  }
}

// ==========================================
// SELECCIONAR AVERÍA DE LA LISTA
// ==========================================
async function seleccionarAveria(id) {
  try {
    const { data, error } = await supabaseClient
      .from('equipos_averiados')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      mostrarToastReint('Error al cargar la avería', 'error');
      return;
    }

    document.querySelectorAll('#tbodyAverias tr').forEach(tr => tr.classList.remove('selected'));
    const fila = document.getElementById(`fila-averia-${id}`);
    if (fila) fila.classList.add('selected');

    await mostrarFichaReintegrar(data);

  } catch (err) {
    mostrarToastReint('Error: ' + err.message, 'error');
  }
}

// ==========================================
// MOSTRAR FICHA COMPLETA
// ==========================================
async function mostrarFichaReintegrar(data) {
  averiaSeleccionadaReint = data;

  document.getElementById('reintFichaCodigo').textContent = data.codigo_barras || '-';
  document.getElementById('reintFichaNombre').textContent = data.nombre_equipo || '-';
  document.getElementById('reintFichaMarca').textContent = data.marca || '-';
  document.getElementById('reintFichaModelo').textContent = data.modelo || '-';
  document.getElementById('reintFichaSerial').textContent = data.serial || '-';
  document.getElementById('reintFichaCosto').textContent = data.costo ? `$${parseFloat(data.costo).toFixed(2)}` : '$0.00';

  const reportanteCompleto = `${data.reportante_nombre || ''} ${data.reportante_apellidos || ''}`.trim();
  document.getElementById('reintReportante').textContent = reportanteCompleto || '-';
  document.getElementById('reintFechaAveria').textContent = data.fecha_averia ? new Date(data.fecha_averia + 'T12:00:00').toLocaleDateString('es-ES') : '-';
  document.getElementById('reintDetalles').textContent = data.detalles_averia || '-';

  document.getElementById('fieldsetFichaReintegrar').style.display = 'block';
  document.getElementById('fieldsetReparacion').style.display = 'block';
  document.getElementById('botonesReintegrar').style.display = 'flex';

  const hoy = new Date().toISOString().split('T')[0];
  document.getElementById('reintFechaReparacion').value = hoy;

  await cargarFotosEvidenciaReint(data);

  document.getElementById('fieldsetFichaReintegrar').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// CARGAR FOTOS DE EVIDENCIA
// ==========================================
async function cargarFotosEvidenciaReint(data) {
  const contenedor = document.getElementById('reintFotosEvidencia');
  contenedor.innerHTML = '';

  let fotos = [];
  if (data.fotos_evidencia && Array.isArray(data.fotos_evidencia)) {
    fotos = data.fotos_evidencia.filter(url => url && url.trim() !== '');
  }

  if (fotos.length === 0) {
    contenedor.innerHTML = `<div class="foto-preview-placeholder"><div class="foto-preview-placeholder-icon">📷</div><div>Sin fotos de evidencia</div></div>`;
    return;
  }

  fotos.forEach((fotoUrl, index) => {
    const div = document.createElement('div');
    div.className = 'foto-preview';
    
    const img = document.createElement('img');
    img.src = fotoUrl;
    img.alt = `Evidencia ${index + 1}`;
    img.style.cursor = 'pointer';
    img.onclick = function() { abrirZoomInfalibleReint(fotoUrl); };
    img.onerror = function() { this.parentElement.innerHTML = '<div style="color: #ef4444; font-size: 11px; text-align: center; padding: 10px;">❌ Error</div>'; };
    
    div.appendChild(img);
    contenedor.appendChild(div);
  });
}

// ==========================================
// ✅ REINTEGRAR EQUIPO (LÓGICA DE MOVER REGISTRO)
// ==========================================
async function reintegrarEquipo() {
  if (!averiaSeleccionadaReint) {
    mostrarToastReint('No hay avería seleccionada', 'error');
    return;
  }

  const tecnico = document.getElementById('reintTecnico').value.trim();
  const fechaReparacion = document.getElementById('reintFechaReparacion').value;
  const costoReparacion = document.getElementById('reintCostoReparacion').value || '0';
  const observacionesReparacion = document.getElementById('reintObservacionesReparacion').value.trim();

  if (!tecnico || !fechaReparacion || !observacionesReparacion) {
    mostrarToastReint('Complete los campos obligatorios: técnico, fecha y observaciones', 'error');
    return;
  }

  if (!confirm(`¿Confirmar la reintegración del equipo ${averiaSeleccionadaReint.codigo_barras} al inventario?\n\nEsta acción:\n- Eliminará el registro de la tabla de averías activas\n- Lo archivará en el historial de averías\n- Devolverá el equipo a la tabla de equipos como operativo`)) {
    return;
  }

  const btnReintegrar = document.getElementById('btnReintegrar');
  btnReintegrar.disabled = true;
  btnReintegrar.textContent = '⏳ Reintegrando...';

  try {
    // 1. ✅ ELIMINAR de la tabla activa (equipos_averiados)
    const { error: errorDelete } = await supabaseClient
      .from('equipos_averiados')
      .delete()
      .eq('id', averiaSeleccionadaReint.id);

    if (errorDelete) throw errorDelete;

    // 2. ARCHIVAR en historial_averias
    const { error: errorHistorial } = await supabaseClient
      .from('historial_averias')
      .insert({
        averia_original_id: averiaSeleccionadaReint.id,
        equipo_id: averiaSeleccionadaReint.equipo_id_original,
        codigo_barras: averiaSeleccionadaReint.codigo_barras,
        nombre_equipo: averiaSeleccionadaReint.nombre_equipo,
        marca: averiaSeleccionadaReint.marca,
        modelo: averiaSeleccionadaReint.modelo,
        serial: averiaSeleccionadaReint.serial,
        categoria: averiaSeleccionadaReint.categoria || null,
        costo_original: averiaSeleccionadaReint.costo || 0,
        reportante_nombre: averiaSeleccionadaReint.reportante_nombre,
        reportante_apellidos: averiaSeleccionadaReint.reportante_apellidos,
        reportante_cedula: averiaSeleccionadaReint.reportante_cedula,
        fecha_averia: averiaSeleccionadaReint.fecha_averia,
        hora_averia: averiaSeleccionadaReint.hora_averia,
        detalles_averia: averiaSeleccionadaReint.detalles_averia,
        observaciones: averiaSeleccionadaReint.observaciones,
        fotos_evidencia: averiaSeleccionadaReint.fotos_evidencia,
        tecnico_reparador: tecnico,
        fecha_reparacion: fechaReparacion,
        costo_reparacion: parseFloat(costoReparacion),
        observaciones_reparacion: observacionesReparacion,
        fecha_reintegracion: new Date().toISOString(),
        reintegrado_por: usuarioActualReint?.email || 'unknown',
        reintegrado_por_id: usuarioActualReint?.id || null,
        estado_final: 'reintegrado'
      });

    if (errorHistorial) throw errorHistorial;

    // 3. REINSERTAR en la tabla equipos como operativo
    const equipoData = {
      codigo_barras: averiaSeleccionadaReint.codigo_barras,
      nombre_equipo: averiaSeleccionadaReint.nombre_equipo,
      marca: averiaSeleccionadaReint.marca,
      modelo: averiaSeleccionadaReint.modelo,
      serial: averiaSeleccionadaReint.serial,
      costo: averiaSeleccionadaReint.costo || 0,
      estatus: 'operativo',
      activo: true,
      usuario_registro: usuarioActualReint?.email || 'unknown',
      usuario_registro_id: usuarioActualReint?.id || null,
      fecha_registro: new Date().toISOString()
    };

    const { error: errorInsertEquipo } = await supabaseClient
      .from('equipos')
      .insert(equipoData);

    if (errorInsertEquipo) throw errorInsertEquipo;

    // 4. Registrar en logs
    if (typeof registrarLog === 'function') {
      const descripcion = `Equipo REINTEGRADO al inventario | Código: ${averiaSeleccionadaReint.codigo_barras} (${averiaSeleccionadaReint.nombre_equipo}) | Técnico: ${tecnico} | Costo reparación: $${parseFloat(costoReparacion).toFixed(2)} | Reintegrado por: ${usuarioActualReint?.email || 'Desconocido'}`;
      await registrarLog('averias', 'Equipo reintegrado', descripcion, 'success');
    }

    mostrarToastReint('✅ Equipo reintegrado exitosamente al inventario', 'exito');

    // 5. Limpiar formulario y recargar lista
    setTimeout(() => {
      cancelarReintegrar();
      paginaActualReint = 1;
      cargarListaAverias();
    }, 1000);

  } catch (err) {
    console.error('Error al reintegrar:', err);
    mostrarToastReint('Error al reintegrar: ' + err.message, 'error');
    btnReintegrar.disabled = false;
    btnReintegrar.textContent = '✅ Reintegrar al Inventario';
  }
}

// ==========================================
// CANCELAR / LIMPIAR
// ==========================================
function cancelarReintegrar() {
  averiaSeleccionadaReint = null;

  document.getElementById('buscarReintegrar').value = '';
  document.getElementById('reintTecnico').value = '';
  document.getElementById('reintFechaReparacion').value = '';
  document.getElementById('reintCostoReparacion').value = '';
  document.getElementById('reintObservacionesReparacion').value = '';

  document.getElementById('fieldsetFichaReintegrar').style.display = 'none';
  document.getElementById('fieldsetReparacion').style.display = 'none';
  document.getElementById('botonesReintegrar').style.display = 'none';

  const btnReintegrar = document.getElementById('btnReintegrar');
  if (btnReintegrar) {
    btnReintegrar.disabled = false;
    btnReintegrar.textContent = '✅ Reintegrar al Inventario';
  }

  document.querySelectorAll('#tbodyAverias tr').forEach(tr => tr.classList.remove('selected'));
}

function limpiarBusquedaReintegrar() {
  document.getElementById('buscarReintegrar').value = '';
  document.getElementById('buscarReintegrar').focus();
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  inicializarReintegrarAveria();
});
