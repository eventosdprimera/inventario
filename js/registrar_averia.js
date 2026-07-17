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
    toastContainer.style.cssText = `
      position: fixed; top: 80px; right: 20px; z-index: 999999;
      display: flex; flex-direction: column; gap: 10px; max-width: 350px;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgColor = tipo === 'exito' ? '#d1fae5' : (tipo === 'error' ? '#fee2e2' : '#fef3c7');
  const borderColor = tipo === 'exito' ? '#10b981' : (tipo === 'error' ? '#dc2626' : '#f59e0b');
  const textColor = tipo === 'exito' ? '#065f46' : (tipo === 'error' ? '#991b1b' : '#92400e');
  
  toast.style.cssText = `
    background: ${bgColor}; border-left: 4px solid ${borderColor}; color: ${textColor};
    padding: 14px 18px; border-radius: 8px; font-size: 14px; font-family: 'Poppins', sans-serif;
    font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: toastSlideIn 0.3s ease;
    display: flex; align-items: center; gap: 10px;
  `;
  
  toast.innerHTML = `
    <span style="font-size: 18px;">${tipo === 'exito' ? '✅' : (tipo === 'error' ? '⚠️' : 'ℹ️')}</span>
    <span style="flex: 1;">${texto}</span>
    <span onclick="this.parentElement.remove()" style="cursor: pointer; font-size: 18px; opacity: 0.6;">✕</span>
  `;

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
  style.textContent = `
    @keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes toastSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
  `;
  document.head.appendChild(style);
}

// ==========================================
// 🚀 FUNCIÓN INFALIBLE PARA ABRIR ZOOM
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
    inputBusqueda.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); buscarEquipoAveria(); }
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
// BUSCAR EQUIPO
// ==========================================
async function buscarEquipoAveria() {
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
    cargarFotosDelEquipo(data);
    
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
  // ✅ CORREGIDO: Se eliminó la línea de fichaCategoria que causaba el error

  document.getElementById('fichaFotos').innerHTML = '<div class="foto-preview-placeholder">Cargando fotos...</div>';
  document.getElementById('fieldsetFichaEquipo').style.display = 'block';
}

// ==========================================
// CARGAR FOTOS DEL EQUIPO
// ==========================================
async function cargarFotosDelEquipo(equipo) {
  const contenedorFotos = document.getElementById('fichaFotos');
  try {
    const { data: archivos } = await supabaseClient.storage.from('equipos-fotos').list(equipo.codigo_barras);
    let fotosEncontradas = [];

    if (archivos && archivos.length > 0) {
      fotosEncontradas = archivos.slice(0, 4).map(archivo => ({
        url: supabaseClient.storage.from('equipos-fotos').getPublicUrl(`${equipo.codigo_barras}/${archivo.name}`).data.publicUrl
      }));
    } else {
      const { data: archivosRaiz } = await supabaseClient.storage.from('equipos-fotos').list('', { search: equipo.codigo_barras, limit: 4 });
      if (archivosRaiz && archivosRaiz.length > 0) {
        fotosEncontradas = archivosRaiz.map(archivo => ({
          url: supabaseClient.storage.from('equipos-fotos').getPublicUrl(archivo.name).data.publicUrl
        }));
      }
    }

    if (fotosEncontradas.length > 0) {
      contenedorFotos.innerHTML = '';
      fotosEncontradas.forEach((foto, index) => {
        const div = document.createElement('div');
        div.className = 'foto-preview';
        div.onclick = function() { abrirZoomInfalible(foto.url); };
        div.innerHTML = `<img src="${foto.url}" alt="Foto ${index + 1}" style="cursor: pointer;" onerror="this.parentElement.style.display='none'">`;
        contenedorFotos.appendChild(div);
      });
    } else {
      contenedorFotos.innerHTML = `<div class="foto-preview-placeholder"><div class="foto-preview-placeholder-icon">📷</div><div>Sin fotos registradas</div></div>`;
    }
  } catch (err) {
    contenedorFotos.innerHTML = `<div class="foto-preview-placeholder"><div class="foto-preview-placeholder-icon">⚠️</div><div>Error al cargar fotos</div></div>`;
  }
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
async function abrirCamara() {
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
function capturarFoto() {
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
    cerrarCamara();
    mostrarToast('✅ Foto capturada exitosamente', 'exito');
  }, 'image/png');
}

// ==========================================
// CERRAR CÁMARA
// ==========================================
function cerrarCamara() {
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
async function procesarFotosEvidencia(event) {
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
// RENDERIZAR PREVIEW DE FOTOS
// ==========================================
function renderizarPreviewFotosEvidencia() {
  const contenedor = document.getElementById('previewFotosEvidencia');
  contenedor.innerHTML = '';

  if (fotosEvidencia.length === 0) {
    contenedor.innerHTML = `<div class="foto-preview-placeholder"><div class="foto-preview-placeholder-icon">📷</div><div>No hay fotos de evidencia</div></div>`;
    return;
  }

  fotosEvidencia.forEach((fotoUrl, index) => {
    const div = document.createElement('div');
    div.className = 'foto-preview';
    div.onclick = function() { abrirZoomInfalible(fotoUrl); };
    div.innerHTML = `
      <img src="${fotoUrl}" alt="Evidencia ${index + 1}" style="cursor: pointer;">
      <button type="button" class="foto-remove" onclick="event.stopPropagation(); eliminarFotoEvidencia(${index})">✕</button>
    `;
    contenedor.appendChild(div);
  });
}

function eliminarFotoEvidencia(index) {
  fotosEvidencia.splice(index, 1);
  renderizarPreviewFotosEvidencia();
}

// ==========================================
// GUARDAR AVERÍA
// ==========================================
async function guardarAveria() {
  if (!equipoSeleccionadoAveria) {
    mostrarToast('No hay equipo seleccionado', 'error');
    return;
  }

  const reportanteNombres = document.getElementById('reportanteNombres')?.value.trim() || '';
  const reportanteApellidos = document.getElementById('reportanteApellidos')?.value.trim() || '';
  const reportanteCedula = document.getElementById('reportanteCedula')?.value.trim() || '';
  const fechaAveria = document.getElementById('fechaAveria')?.value || '';
  const horaAveria = document.getElementById('horaAveria')?.value || '';
  const detallesAveria = document.getElementById('detallesAveria')?.value.trim() || '';
  const observacionesAveria = document.getElementById('observacionesAveria')?.value.trim() || '';

  if (!reportanteNombres || !reportanteApellidos || !reportanteCedula) {
    mostrarToast('Complete los datos del reportante', 'error'); return;
  }
  if (!fechaAveria || !horaAveria || !detallesAveria) {
    mostrarToast('Complete la fecha, hora y detalles de la avería', 'error'); return;
  }

  const btnGuardar = document.getElementById('btnGuardarAveria');
  if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.textContent = '⏳ Registrando...'; }

  try {
    const { data: averiaData, error: errorAveria } = await supabaseClient.from('equipos_averiados').insert({
      equipo_id_original: equipoSeleccionadoAveria.id,
      codigo_barras: equipoSeleccionadoAveria.codigo_barras,
      nombre_equipo: equipoSeleccionadoAveria.nombre_equipo,
      marca: equipoSeleccionadoAveria.marca,
      modelo: equipoSeleccionadoAveria.modelo,
      serial: equipoSeleccionadoAveria.serial,
      categoria: equipoSeleccionadoAveria.categoria,
      costo: equipoSeleccionadoAveria.costo || 0,
      estado: 'averiado',
      reportante_nombre: reportanteNombres,
      reportante_apellidos: reportanteApellidos,
      reportante_cedula: reportanteCedula,
      fecha_averia: fechaAveria,
      hora_averia: horaAveria,
      detalles_averia: detallesAveria,
      observaciones: observacionesAveria,
      fotos_evidencia: fotosEvidencia.length > 0 ? fotosEvidencia : null,
      usuario_registro: usuarioActualAveria?.email || 'unknown',
      usuario_registro_id: usuarioActualAveria?.id || null
    }).select().single();

    if (errorAveria) throw errorAveria;

    await supabaseClient.from('equipos').delete().eq('id', equipoSeleccionadoAveria.id);

    if (typeof registrarLog === 'function') {
      await registrarLog('averias', 'Avería registrada', `Equipo: ${equipoSeleccionadoAveria.codigo_barras} | Reportante: ${reportanteNombres} ${reportanteApellidos}`, 'warning');
    }

    mostrarToast('✅ Avería registrada exitosamente', 'exito');

    // ✅ AQUÍ ESTÁ LA CLAVE: forzar = true para que NO pregunte nada
    limpiarFormularioAveria(true);

    setTimeout(() => {
      imprimirReciboAveria(averiaData);
    }, 500);

  } catch (err) {
    console.error('Error al guardar avería:', err);
    mostrarToast('Error al registrar: ' + err.message, 'error');
    if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = '💾 Registrar Avería'; }
  }
}

// ==========================================
// LIMPIAR FORMULARIO (ÚNICA VERSIÓN, SIN DUPLICADOS)
// ==========================================
function limpiarFormularioAveria(forzar = false) {
  if (!forzar && equipoSeleccionadoAveria) {
    if (!confirm('¿Iniciar nuevo reporte? Se perderán los datos no guardados.')) {
      return;
    }
  }

  equipoSeleccionadoAveria = null;
  fotosEvidencia = [];

  document.getElementById('buscarEquipoAveria').value = '';
  document.getElementById('reportanteNombres').value = '';
  document.getElementById('reportanteApellidos').value = '';
  document.getElementById('reportanteCedula').value = '';
  document.getElementById('detallesAveria').value = '';
  document.getElementById('observacionesAveria').value = '';
  
  const previewEvidencia = document.getElementById('previewFotosEvidencia');
  if (previewEvidencia) {
    previewEvidencia.innerHTML = `<div class="foto-preview-placeholder"><div class="foto-preview-placeholder-icon">📷</div><div>No hay fotos de evidencia</div></div>`;
  }

  const ahora = new Date();
  document.getElementById('fechaAveria').value = ahora.toISOString().split('T')[0];
  document.getElementById('horaAveria').value = ahora.toTimeString().slice(0, 5);

  document.getElementById('fieldsetFichaEquipo').style.display = 'none';
  document.getElementById('fieldsetReportante').style.display = 'none';
  document.getElementById('fieldsetAveria').style.display = 'none';
  document.getElementById('fieldsetFotosEvidencia').style.display = 'none';
  document.getElementById('botonesAccion').style.display = 'none';

  const btnGuardar = document.getElementById('btnGuardarAveria');
  if (btnGuardar) { 
    btnGuardar.disabled = false; 
    btnGuardar.textContent = '💾 Registrar Avería'; 
  }

  if (!forzar) {
    mostrarToast('Formulario listo para nuevo reporte', 'exito');
  }
}

// ==========================================
// IMPRIMIR RECIBO DE AVERÍA
// ==========================================
function imprimirReciboAveria(averia) {
  const logoUrl = new URL('img/logo.png', window.location.href).href;
  
  const fotosHTML = (averia.fotos_evidencia || []).map((fotoUrl, i) => `
    <div class="foto-recibo-item">
      <img src="${fotoUrl}" alt="Evidencia ${i + 1}">
      <div class="foto-label">Foto ${i + 1}</div>
    </div>
  `).join('');

  const ventana = window.open('', '_blank', 'width=900,height=1100');
  ventana.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Recibo de Avería - ${averia.codigo_barras}</title>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:wght@400;700&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: letter; margin: 15mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #333; max-width: 216mm; margin: 0 auto; padding: 10mm; }
    .header { text-align: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; }
    .logo-img { max-width: 120px; max-height: 120px; object-fit: contain; }
    .brand h1 { color: #1e3a8a; margin: 10px 0 5px 0; font-size: 28px; font-family: 'Libre Caslon Text', serif; font-weight: 700; }
    .brand p { margin: 3px 0 0 0; color: #666; font-size: 12px; }
    .aviso-averia { background: #fee2e2; border-left: 4px solid #dc2626; padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
    .aviso-averia h2 { color: #dc2626; margin: 0; font-size: 18px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .info-box { background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; }
    .info-box h3 { margin: 0 0 10px 0; color: #1e3a8a; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
    .info-box p { margin: 5px 0; font-size: 12px; }
    .info-box p strong { color: #374151; }
    .detalles-box { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 20px; }
    .detalles-box h3 { margin: 0 0 10px 0; color: #92400e; font-size: 13px; }
    .detalles-box p { margin: 5px 0; font-size: 12px; }
    .fotos-section { margin-top: 20px; }
    .fotos-section h3 { color: #1e3a8a; font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
    .fotos-grid-recibo { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .foto-recibo-item { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: white; }
    .foto-recibo-item img { width: 100%; height: 200px; object-fit: cover; display: block; }
    .foto-recibo-item .foto-label { padding: 8px; text-align: center; font-size: 11px; color: #6b7280; background: #f9fafb; font-weight: 600; }
    .firmas { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; text-align: center; }
    .firma-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; }
    .firma-line p { margin: 3px 0; font-size: 12px; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    @media print { .no-print { display: none !important; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoUrl}" class="logo-img" onerror="this.style.display='none'">
    <div class="brand">
      <h1>Eventos D' Primera</h1>
      <p>Sistema de Inventario y Rentas</p>
    </div>
  </div>

  <div class="aviso-averia">
    <h2>⚠️ RECIBO DE AVERÍA</h2>
    <p style="margin: 10px 0 0 0; font-size: 14px;">Código: <strong>${averia.codigo_barras}</strong></p>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>📦 Equipo Averiados</h3>
      <p><strong>Nombre:</strong> ${averia.nombre_equipo}</p>
      <p><strong>Marca/Modelo:</strong> ${averia.marca || ''} ${averia.modelo || ''}</p>
      <p><strong>Serial:</strong> ${averia.serial || 'N/A'}</p>
      <p><strong>Categoría:</strong> ${averia.categoria || 'N/A'}</p>
    </div>
    <div class="info-box">
      <h3>👤 Reportante</h3>
      <p><strong>Nombre:</strong> ${averia.reportante_nombre} ${averia.reportante_apellidos}</p>
      <p><strong>Cédula:</strong> ${averia.reportante_cedula}</p>
      <p><strong>Fecha:</strong> ${new Date(averia.fecha_averia + 'T12:00:00').toLocaleDateString('es-ES')}</p>
      <p><strong>Hora:</strong> ${averia.hora_averia}</p>
    </div>
  </div>

  <div class="detalles-box">
    <h3>📝 Detalles de la Avería</h3>
    <p>${averia.detalles_averia}</p>
    ${averia.observaciones ? `<p style="margin-top: 10px;"><strong>Observaciones:</strong> ${averia.observaciones}</p>` : ''}
  </div>

  ${fotosHTML ? `
  <div class="fotos-section">
    <h3>📸 Fotos de Evidencia</h3>
    <div class="fotos-grid-recibo">
      ${fotosHTML}
    </div>
  </div>
  ` : ''}

  <div class="firmas">
    <div class="firma-line">
      <p><strong>${averia.reportante_nombre} ${averia.reportante_apellidos}</strong></p>
      <p>Reportante</p>
      <p style="font-size: 10px; color: #666;">Cédula: ${averia.reportante_cedula}</p>
    </div>
    <div class="firma-line">
      <p><strong>${usuarioActualAveria?.email || 'Administrador'}</strong></p>
      <p>Recibido por</p>
      <p style="font-size: 10px; color: #666;">Firma del responsable</p>
    </div>
  </div>

  <div class="footer">
    <p>©copyright Eventos de Primera | 2026-2027 | Documento generado el ${new Date().toLocaleString('es-ES')}</p>
  </div>

  <div class="no-print" style="margin-top: 30px; text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
    <button onclick="window.print()" style="padding: 12px 30px; background: #1e3a8a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-right: 10px;">🖨️ Imprimir Recibo</button>
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
  inicializarRegistrarAveria();
});
