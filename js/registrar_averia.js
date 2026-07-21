// ==========================================
// VARIABLES GLOBALES
// ==========================================
let equipoSeleccionadoAveria = null;
let fotosEvidencia = [];
let usuarioActualAveria = null;
let streamCamara = null;

// ==========================================
// SISTEMA DE NOTIFICACIONES TOAST
// ==========================================
function mostrarToast(texto, tipo) {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.style.cssText = `position: fixed; top: 80px; right: 20px; z-index: 999999; display: flex; flex-direction: column; gap: 10px; max-width: 350px;`;
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  const bgColor = tipo === 'exito' ? '#d1fae5' : (tipo === 'error' ? '#fee2e2' : '#fef3c7');
  const borderColor = tipo === 'exito' ? '#10b981' : (tipo === 'error' ? '#dc2626' : '#f59e0b');
  const textColor = tipo === 'exito' ? '#065f46' : (tipo === 'error' ? '#991b1b' : '#92400e');
  toast.style.cssText = `background: ${bgColor}; border-left: 4px solid ${borderColor}; color: ${textColor}; padding: 14px 18px; border-radius: 8px; font-size: 14px; font-family: 'Poppins', sans-serif; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: toastSlideIn 0.3s ease; display: flex; align-items: center; gap: 10px;`;
  toast.innerHTML = `<span style="font-size: 18px;">${tipo === 'exito' ? '✅' : '⚠️'}</span><span style="flex: 1;">${texto}</span><span onclick="this.parentElement.remove()" style="cursor: pointer; font-size: 18px; opacity: 0.6;">✕</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'toastSlideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 3000);
}

if (!document.getElementById('toastStyles')) {
  const style = document.createElement('style');
  style.id = 'toastStyles';
  style.textContent = `@keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes toastSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }`;
  document.head.appendChild(style);
}

// ==========================================
// FUNCIÓN INFALIBLE PARA ABRIR ZOOM
// ==========================================
function abrirZoomInfalible(url) {
  const modal = document.createElement('div');
  modal.id = 'modalZoomDinamico';
  modal.style.cssText = `
    position: fixed !important; top: 0 !important; left: 0 !important;
    width: 100vw !important; height: 100vh !important;
    background-color: rgba(0, 0, 0, 0.95) !important; z-index: 999999 !important;
    display: flex !important; align-items: center !important; justify-content: center !important;
    cursor: zoom-out;
  `;
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = `
    position: absolute !important; top: 20px !important; right: 30px !important;
    color: #fff !important; font-size: 40px !important; font-weight: bold !important;
    cursor: pointer !important; background: none !important; border: none !important;
    z-index: 1000000 !important;
  `;
  closeBtn.onclick = function(e) { e.stopPropagation(); cerrarZoomInfalible(); };
  const img = document.createElement('img');
  img.src = url;
  img.alt = 'Zoom de foto';
  img.style.cssText = `max-width: 90% !important; max-height: 90vh !important; border-radius: 8px; box-shadow: 0 0 30px rgba(0,0,0,0.8); cursor: default;`;
  modal.appendChild(closeBtn);
  modal.appendChild(img);
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  modal.addEventListener('click', function(e) {
    if (e.target === modal) cerrarZoomInfalible();
  });
}

function cerrarZoomInfalible() {
  const modal = document.getElementById('modalZoomDinamico');
  if (modal) {
    modal.remove();
    document.body.style.overflow = '';
  }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarRegistrarAveria() {
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }
  if (typeof supabaseClient === 'undefined') {
    mostrarToast('Error: Supabase no está disponible', 'error');
    return;
  }
  await cargarUsuarioAveria();
  
  const ahora = new Date();
  const fechaInput = document.getElementById('fechaAveria');
  const horaInput = document.getElementById('horaAveria');
  if (fechaInput) fechaInput.value = ahora.toISOString().split('T')[0];
  if (horaInput) horaInput.value = ahora.toTimeString().slice(0, 5);

  const inputBusqueda = document.getElementById('buscarEquipoAveria');
  if (inputBusqueda) {
    inputBusqueda.addEventListener('input', (e) => {
      const cursorPos = e.target.selectionStart;
      e.target.value = e.target.value.toUpperCase();
      e.target.setSelectionRange(cursorPos, cursorPos);
    });
    inputBusqueda.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); window.buscarEquipoAveria(); }
    });
  }
}

// ==========================================
// CARGAR USUARIO
// ==========================================
async function cargarUsuarioAveria() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    const { data, error } = await supabaseClient.from('usuarios').select('*').eq('email', session.user.email).maybeSingle();
    if (data && !error) {
      usuarioActualAveria = data;
    } else {
      usuarioActualAveria = { email: session.user.email, id: session.user.id };
    }
  } catch (err) {
    console.error('Error al cargar usuario:', err);
  }
}

// ==========================================
// ✅ BUSCAR EQUIPO
// ==========================================
window.buscarEquipoAveria = async function() {
  const input = document.getElementById('buscarEquipoAveria');
  if (!input) return;
  let codigo = input.value.trim();
  if (!codigo) {
    mostrarToast('Por favor ingrese un código de barras o serial', 'error');
    return;
  }
  codigo = codigo.replace(/'/g, '-').replace(/"/g, '-').replace(/`/g, '-').trim();
  try {
    const { data, error } = await supabaseClient.from('equipos').select('*').or(`codigo_barras.eq.${codigo},serial.eq.${codigo}`).maybeSingle();
    if (error || !data) {
      mostrarToast(`Equipo no encontrado: "${codigo}"`, 'error');
      input.value = ''; input.focus(); return;
    }
    const { data: yaAveriado } = await supabaseClient.from('equipos_averiados').select('id').eq('codigo_barras', data.codigo_barras).maybeSingle();
    if (yaAveriado) {
      mostrarToast('⚠️ Este equipo ya está registrado como averiado', 'error');
      input.value = ''; input.focus(); return;
    }
    equipoSeleccionadoAveria = data;
    input.value = '';
    fotosEvidencia = [];
    
    const previewEvidencia = document.getElementById('previewFotosEvidencia');
    if (previewEvidencia) {
      previewEvidencia.innerHTML = `<div class="foto-preview-placeholder"><div class="foto-preview-placeholder-icon">📷</div><div>No hay fotos de evidencia</div></div>`;
    }
    
    mostrarFichaEquipoInmediata(data);
    mostrarSeccionesFormulario();
    await cargarFotosDelEquipo(data); // ✅ AHORA SÍ CARGA LAS FOTOS ORIGINALES
    
    setTimeout(() => {
      const nombresInput = document.getElementById('reportanteNombres');
      if (nombresInput) nombresInput.focus();
    }, 300);
  } catch (err) {
    mostrarToast('Error al buscar equipo: ' + err.message, 'error');
  }
}

// ==========================================
// MOSTRAR FICHA DEL EQUIPO
// ==========================================
function mostrarFichaEquipoInmediata(equipo) {
  document.getElementById('fichaCodigo').textContent = equipo.codigo_barras || '-';
  document.getElementById('fichaNombre').textContent = equipo.nombre_equipo || '-';
  document.getElementById('fichaMarca').textContent = equipo.marca || '-';
  document.getElementById('fichaModelo').textContent = equipo.modelo || '-';
  document.getElementById('fichaSerial').textContent = equipo.serial || '-';
  document.getElementById('fieldsetFichaEquipo').style.display = 'block';
}

// ==========================================
// ✅ CARGAR FOTOS ORIGINALES DEL EQUIPO (IMPLEMENTADO)
// ==========================================
async function cargarFotosDelEquipo(equipo) {
  const contenedorFotos = document.getElementById('fichaFotos');
  if (!contenedorFotos) return;
  
  contenedorFotos.innerHTML = '<div style="text-align:center; padding:10px; color:#6b7280;">Cargando fotos...</div>';
  
  const fotos = [equipo.foto_url, equipo.foto2_url, equipo.foto3_url, equipo.foto4_url].filter(url => url && String(url).trim() !== '');
  
  contenedorFotos.innerHTML = '';
  if (fotos.length === 0) {
    contenedorFotos.innerHTML = `<div class="foto-preview-placeholder"><div class="foto-preview-placeholder-icon">📷</div><div>El equipo no tenía fotos registradas</div></div>`;
    return;
  }

  fotos.forEach((fotoUrl, index) => {
    const div = document.createElement('div');
    div.className = 'foto-preview';
    div.style.cursor = 'zoom-in';
    div.onclick = function() { abrirZoomInfalible(fotoUrl); };
    
    const img = document.createElement('img');
    img.src = fotoUrl;
    img.alt = `Original ${index + 1}`;
    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
    
    const badge = document.createElement('div');
    badge.textContent = 'Original';
    badge.style.cssText = 'position: absolute; top: 5px; left: 5px; background: rgba(30, 58, 138, 0.85); color: white; font-size: 10px; padding: 3px 8px; border-radius: 4px; font-weight: 600; z-index: 10;';
    
    div.appendChild(img);
    div.appendChild(badge);
    contenedorFotos.appendChild(div);
  });
}

// ==========================================
// MOSTRAR SECCIONES DEL FORMULARIO
// ==========================================
function mostrarSeccionesFormulario() {
  document.getElementById('fieldsetReportante').style.display = 'block';
  document.getElementById('fieldsetAveria').style.display = 'block';
  document.getElementById('fieldsetFotosEvidencia').style.display = 'block';
  document.getElementById('botonesAccion').style.display = 'flex';
}

// ==========================================
// ABRIR CÁMARA
// ==========================================
window.abrirCamara = async function() {
  if (fotosEvidencia.length >= 4) {
    mostrarToast('Máximo 4 fotos permitidas', 'error');
    return;
  }
  const modal = document.getElementById('modalCamara');
  if (!modal) return;
  try {
    streamCamara = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    const video = document.getElementById('videoCamara');
    if (video) {
      video.srcObject = streamCamara;
      modal.style.display = 'flex';
    }
  } catch (err) {
    mostrarToast('No se pudo acceder a la cámara. Verifique los permisos.', 'error');
  }
}

// ==========================================
// CAPTURAR FOTO
// ==========================================
window.capturarFoto = function() {
  const video = document.getElementById('videoCamara');
  const canvas = document.getElementById('canvasCamara');
  if (!video || !canvas) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);

  canvas.toBlob(async (blob) => {
    if (!blob) { mostrarToast('Error al capturar foto', 'error'); return; }
    const codigoEquipo = equipoSeleccionadoAveria?.codigo_barras || 'sin_codigo';
    const fileName = `${codigoEquipo}/${Date.now()}_camara.png`;
    const { error: uploadError } = await supabaseClient.storage.from('fotos-averias').upload(fileName, blob);
    if (uploadError) { mostrarToast(`Error al subir: ${uploadError.message}`, 'error'); return; }
    const { data: urlData } = supabaseClient.storage.from('fotos-averias').getPublicUrl(fileName);
    fotosEvidencia.push(urlData.publicUrl);
    renderizarPreviewFotosEvidencia();
    window.cerrarCamara();
    mostrarToast('✅ Foto capturada exitosamente', 'exito');
  }, 'image/png');
}

// ==========================================
// CERRAR CÁMARA
// ==========================================
window.cerrarCamara = function() {
  if (streamCamara) {
    streamCamara.getTracks().forEach(track => track.stop());
    streamCamara = null;
  }
  const modal = document.getElementById('modalCamara');
  if (modal) modal.style.display = 'none';
}

// ==========================================
// PROCESAR FOTOS DE EVIDENCIA
// ==========================================
window.procesarFotosEvidencia = async function(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  if (fotosEvidencia.length + files.length > 4) {
    mostrarToast(`Máximo 4 fotos permitidas. Ya tiene ${fotosEvidencia.length}.`, 'error');
    event.target.value = ''; return;
  }
  const codigoEquipo = equipoSeleccionadoAveria?.codigo_barras || 'sin_codigo';
  for (let i = 0; i < files.length; i++) {
    const fileName = `${codigoEquipo}/${Date.now()}_${i}_${files[i].name}`;
    const { error: uploadError } = await supabaseClient.storage.from('fotos-averias').upload(fileName, files[i]);
    if (uploadError) { mostrarToast(`Error al subir foto ${i + 1}`, 'error'); continue; }
    const { data: urlData } = supabaseClient.storage.from('fotos-averias').getPublicUrl(fileName);
    fotosEvidencia.push(urlData.publicUrl);
  }
  renderizarPreviewFotosEvidencia();
  event.target.value = '';
  mostrarToast('✅ Fotos subidas exitosamente', 'exito');
}

// ==========================================
// ✅ RENDERIZAR PREVIEW DE FOTOS (CON BOTÓN DE ELIMINAR INFALIBLE)
// ==========================================
function renderizarPreviewFotosEvidencia() {
  const contenedor = document.getElementById('previewFotosEvidencia');
  if (!contenedor) return;
  
  contenedor.innerHTML = '';
  
  if (fotosEvidencia.length === 0) {
    contenedor.innerHTML = `<div class="foto-preview-placeholder"><div class="foto-preview-placeholder-icon">📷</div><div>No hay fotos de evidencia</div></div>`;
    return;
  }
  
  fotosEvidencia.forEach((fotoUrl, index) => {
    const div = document.createElement('div');
    div.className = 'foto-preview';
    div.style.position = 'relative';
    
    // Imagen con zoom
    const img = document.createElement('img');
    img.src = fotoUrl;
    img.alt = `Evidencia ${index + 1}`;
    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; cursor: zoom-in;';
    img.onclick = function(e) { 
      e.stopPropagation(); 
      abrirZoomInfalible(fotoUrl); 
    };
    
    // Botón de eliminar (Muy visible y funcional con !important)
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'foto-remove';
    removeBtn.innerHTML = '✕';
    removeBtn.title = 'Eliminar esta foto para subir otra';
    removeBtn.style.cssText = `
      position: absolute !important; 
      top: 5px !important; 
      right: 5px !important; 
      background: rgba(220, 38, 38, 0.95) !important; 
      color: white !important;
      border: 2px solid white !important;
      border-radius: 50% !important; 
      width: 28px !important; 
      height: 28px !important; 
      cursor: pointer !important; 
      font-size: 16px !important;
      font-weight: bold !important;
      display: flex !important; 
      align-items: center !important; 
      justify-content: center !important; 
      z-index: 100 !important;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3) !important;
    `;
    removeBtn.onclick = function(e) {
      e.stopPropagation();
      e.preventDefault();
      window.eliminarFotoEvidencia(index);
    };
    
    div.appendChild(img);
    div.appendChild(removeBtn);
    contenedor.appendChild(div);
  });
}

// ==========================================
// ✅ ELIMINAR FOTO DE EVIDENCIA
// ==========================================
window.eliminarFotoEvidencia = function(index) {
  if (confirm('¿Eliminar esta foto de evidencia? Podrás subir otra en su lugar.')) {
    fotosEvidencia.splice(index, 1);
    renderizarPreviewFotosEvidencia();
  }
};

// ==========================================
// ✅ GUARDAR AVERÍA (CON TRASLADO Y ELIMINACIÓN DEL INVENTARIO ACTIVO)
// ==========================================
window.guardarAveria = async function() {
  if (!equipoSeleccionadoAveria) {
    mostrarToast('Primero debe buscar un equipo', 'error');
    return;
  }
  const reportanteNombres = document.getElementById('reportanteNombres')?.value?.trim() || '';
  const reportanteApellidos = document.getElementById('reportanteApellidos')?.value?.trim() || '';
  const reportanteCedula = document.getElementById('reportanteCedula')?.value?.trim() || '';
  const fechaAveria = document.getElementById('fechaAveria')?.value || '';
  const horaAveria = document.getElementById('horaAveria')?.value || '';
  const detallesAveria = document.getElementById('detallesAveria')?.value?.trim() || '';
  const observaciones = document.getElementById('observacionesAveria')?.value?.trim() || ''; // Corregido ID

  if (!reportanteNombres || !reportanteApellidos || !reportanteCedula || !fechaAveria || !horaAveria || !detallesAveria) {
    mostrarToast('Complete todos los campos obligatorios', 'error');
    return;
  }
  if (fotosEvidencia.length === 0) {
    mostrarToast('Debe agregar al menos una foto de evidencia', 'error');
    return;
  }
  const btnGuardar = document.getElementById('btnGuardarAveria');
  if (btnGuardar) {
    btnGuardar.disabled = true;
    btnGuardar.textContent = '⏳ Procesando...';
  }
  try {
    const insertData = {
      codigo_barras: equipoSeleccionadoAveria.codigo_barras,
      nombre_equipo: equipoSeleccionadoAveria.nombre_equipo,
      marca: equipoSeleccionadoAveria.marca,
      modelo: equipoSeleccionadoAveria.modelo,
      serial: equipoSeleccionadoAveria.serial,
      reportante_nombre: reportanteNombres,
      reportante_apellidos: reportanteApellidos,
      reportante_cedula: reportanteCedula,
      fecha_averia: fechaAveria,
      hora_averia: horaAveria,
      detalles_averia: detallesAveria,
      observaciones: observaciones,
      fotos_evidencia: fotosEvidencia,
      // ✅ Guardar fotos originales del equipo para poder restaurarlas al reintegrar
      foto_url: equipoSeleccionadoAveria.foto_url || null,
      foto2_url: equipoSeleccionadoAveria.foto2_url || null,
      foto3_url: equipoSeleccionadoAveria.foto3_url || null,
      foto4_url: equipoSeleccionadoAveria.foto4_url || null,
      usuario_registro: usuarioActualAveria?.email || 'unknown',
      usuario_registro_id: usuarioActualAveria?.id || null
    };
    // 1. Registrar la avería en la tabla de respaldo
    const { data, error } = await supabaseClient.from('equipos_averiados').insert(insertData).select().single();
    if (error) throw error;
    // 2. ✅ SACAR EL EQUIPO DE LA TABLA DE EQUIPOS ACTIVA
    const { error: errorDelete } = await supabaseClient.from('equipos').delete().eq('codigo_barras', equipoSeleccionadoAveria.codigo_barras);
    if (errorDelete) {
      console.warn('⚠️ No se pudo eliminar el equipo de la tabla activa. Se marcará como "averiado".');
      await supabaseClient.from('equipos').update({ estatus: 'averiado' }).eq('codigo_barras', equipoSeleccionadoAveria.codigo_barras);
    }
    // 3. Registrar en logs
    if (typeof registrarLog === 'function') {
      const descripcion = `Avería registrada | Equipo: ${equipoSeleccionadoAveria.codigo_barras} (${equipoSeleccionadoAveria.nombre_equipo}) RETIRADO del inventario activo | Reportante: ${reportanteNombres} ${reportanteApellidos} | Fotos originales respaldadas: ${[equipoSeleccionadoAveria.foto_url, equipoSeleccionadoAveria.foto2_url, equipoSeleccionadoAveria.foto3_url, equipoSeleccionadoAveria.foto4_url].filter(f => f).length}`;
      await registrarLog('averias', 'Equipo averiado y retirado', descripcion, 'error');
    }
    mostrarToast('✅ Avería registrada y equipo retirado del inventario activo', 'exito');
    setTimeout(() => { window.limpiarFormularioAveria(true); }, 1500);
  } catch (err) {
    console.error('Error al registrar avería:', err);
    mostrarToast('Error al registrar: ' + err.message, 'error');
  } finally {
    const btn = document.getElementById('btnGuardarAveria');
    if (btn) {
      btn.disabled = false;
      btn.textContent = '💾 Registrar Avería';
    }
  }
}

// ==========================================
// LIMPIAR FORMULARIO
// ==========================================
window.limpiarFormularioAveria = function(forzar = false) {
  if (!forzar && equipoSeleccionadoAveria) {
    if (!confirm('¿Iniciar nuevo reporte? Se perderán los datos no guardados.')) return;
  }
  equipoSeleccionadoAveria = null;
  fotosEvidencia = [];
  const campos = ['reportanteNombres', 'reportanteApellidos', 'reportanteCedula', 'detallesAveria', 'observacionesAveria'];
  campos.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const ahora = new Date();
  const fechaInput = document.getElementById('fechaAveria');
  const horaInput = document.getElementById('horaAveria');
  if (fechaInput) fechaInput.value = ahora.toISOString().split('T')[0];
  if (horaInput) horaInput.value = ahora.toTimeString().slice(0, 5);
  
  const previewEvidencia = document.getElementById('previewFotosEvidencia');
  if (previewEvidencia) {
    previewEvidencia.innerHTML = `<div class="foto-preview-placeholder"><div class="foto-preview-placeholder-icon">📷</div><div>No hay fotos de evidencia</div></div>`;
  }
  const fieldsets = ['fieldsetFichaEquipo', 'fieldsetReportante', 'fieldsetAveria', 'fieldsetFotosEvidencia'];
  fieldsets.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const botones = document.getElementById('botonesAccion');
  if (botones) botones.style.display = 'none';
  
  const inputBusqueda = document.getElementById('buscarEquipoAveria');
  if (inputBusqueda) {
    inputBusqueda.value = '';
    inputBusqueda.focus();
  }
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  inicializarRegistrarAveria();
});
