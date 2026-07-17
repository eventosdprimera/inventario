// ==========================================
// VARIABLES GLOBALES
// ==========================================
let averiaSeleccionada = null;
let fotosEvidenciaMod = [];
let usuarioActualMod = null;

// ==========================================
// SISTEMA DE NOTIFICACIONES TOAST (Reutilizado)
// ==========================================
function mostrarToastMod(texto, tipo) {
  let toastContainer = document.getElementById('toastContainerMod');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainerMod';
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

if (!document.getElementById('toastStylesMod')) {
  const style = document.createElement('style');
  style.id = 'toastStylesMod';
  style.textContent = `@keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes toastSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }`;
  document.head.appendChild(style);
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarModificarAveria() {
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }

  if (typeof supabaseClient === 'undefined') {
    mostrarToastMod('Error: Supabase no está disponible', 'error');
    return;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    const { data } = await supabaseClient.from('usuarios').select('*').eq('email', session.user.email).maybeSingle();
    usuarioActualMod = data || { email: session.user.email, id: session.user.id };
  }

  const inputBusqueda = document.getElementById('buscarAveriaMod');
  if (inputBusqueda) {
    inputBusqueda.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); buscarAveriaParaModificar(); }
    });
  }
}

// ==========================================
// BUSCAR AVERÍA
// ==========================================
async function buscarAveriaParaModificar() {
  const input = document.getElementById('buscarAveriaMod');
  if (!input) return;

  let codigo = input.value.trim();
  if (!codigo) {
    mostrarToastMod('Por favor ingrese un código de barras o serial', 'error');
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
      mostrarToastMod('Avería no encontrada para este equipo', 'error');
      return;
    }

    averiaSeleccionada = data;
    
    // Mostrar ficha (solo lectura)
    document.getElementById('modFichaCodigo').textContent = data.codigo_barras || '-';
    document.getElementById('modFichaNombre').textContent = data.nombre_equipo || '-';
    document.getElementById('modFichaMarca').textContent = data.marca || '-';
    document.getElementById('modFichaModelo').textContent = data.modelo || '-';
    document.getElementById('modFichaSerial').textContent = data.serial || '-';
    document.getElementById('modFichaCategoria').textContent = data.categoria || '-';
    document.getElementById('fieldsetFichaEquipoMod').style.display = 'block';

    // Cargar datos editables
    document.getElementById('modReportanteNombres').value = data.reportante_nombre || '';
    document.getElementById('modReportanteApellidos').value = data.reportante_apellidos || '';
    document.getElementById('modReportanteCedula').value = data.reportante_cedula || '';
    document.getElementById('modFechaAveria').value = data.fecha_averia || '';
    document.getElementById('modHoraAveria').value = data.hora_averia || '';
    document.getElementById('modDetallesAveria').value = data.detalles_averia || '';
    document.getElementById('modObservacionesAveria').value = data.observaciones || '';
    
    document.getElementById('fieldsetDatosAveriaMod').style.display = 'block';
    document.getElementById('fieldsetFotosMod').style.display = 'block';
    document.getElementById('botonesAccionMod').style.display = 'flex';

    // Cargar fotos existentes
    fotosEvidenciaMod = data.fotos_evidencia || [];
    renderizarPreviewFotosMod();

  } catch (err) {
    mostrarToastMod('Error al buscar: ' + err.message, 'error');
  }
}

// ==========================================
// RENDERIZAR FOTOS
// ==========================================
function renderizarPreviewFotosMod() {
  const contenedor = document.getElementById('previewFotosMod');
  contenedor.innerHTML = '';

  if (fotosEvidenciaMod.length === 0) {
    contenedor.innerHTML = `<div class="foto-preview-placeholder"><div class="foto-preview-placeholder-icon">📷</div><div>No hay fotos de evidencia</div></div>`;
    return;
  }

  fotosEvidenciaMod.forEach((fotoUrl, index) => {
    const div = document.createElement('div');
    div.className = 'foto-preview';
    div.innerHTML = `
      <img src="${fotoUrl}" alt="Evidencia ${index + 1}" style="cursor: pointer;" onclick="abrirZoomInfalible('${fotoUrl}')">
      <button type="button" class="foto-remove" onclick="event.stopPropagation(); eliminarFotoMod(${index})" title="Eliminar foto">✕</button>
    `;
    contenedor.appendChild(div);
  });
}

function eliminarFotoMod(index) {
  fotosEvidenciaMod.splice(index, 1);
  renderizarPreviewFotosMod();
}

// ==========================================
// PROCESAR NUEVAS FOTOS
// ==========================================
async function procesarFotosMod(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  if (fotosEvidenciaMod.length + files.length > 4) {
    mostrarToastMod(`Máximo 4 fotos permitidas. Ya tiene ${fotosEvidenciaMod.length}.`, 'error');
    event.target.value = '';
    return;
  }

  const codigoEquipo = averiaSeleccionada?.codigo_barras || 'sin_codigo';

  for (let i = 0; i < files.length; i++) {
    const fileName = `${codigoEquipo}/mod_${Date.now()}_${i}_${files[i].name}`;
    const { error: uploadError } = await supabaseClient.storage.from('fotos-averias').upload(fileName, files[i]);

    if (uploadError) {
      mostrarToastMod(`Error al subir foto ${i + 1}`, 'error');
      continue;
    }

    const { data: urlData } = supabaseClient.storage.from('fotos-averias').getPublicUrl(fileName);
    fotosEvidenciaMod.push(urlData.publicUrl);
  }

  renderizarPreviewFotosMod();
  event.target.value = '';
  mostrarToastMod('✅ Fotos agregadas exitosamente', 'exito');
}

// ==========================================
// GUARDAR CAMBIOS
// ==========================================
async function guardarCambiosAveria() {
  if (!averiaSeleccionada) return;

  const reportanteNombres = document.getElementById('modReportanteNombres').value.trim();
  const reportanteApellidos = document.getElementById('modReportanteApellidos').value.trim();
  const reportanteCedula = document.getElementById('modReportanteCedula').value.trim();
  const fechaAveria = document.getElementById('modFechaAveria').value;
  const horaAveria = document.getElementById('modHoraAveria').value;
  const detallesAveria = document.getElementById('modDetallesAveria').value.trim();

  if (!reportanteNombres || !reportanteApellidos || !reportanteCedula || !fechaAveria || !horaAveria || !detallesAveria) {
    mostrarToastMod('Complete todos los campos obligatorios', 'error');
    return;
  }

  const btnGuardar = document.getElementById('btnGuardarCambios');
  btnGuardar.disabled = true;
  btnGuardar.textContent = '⏳ Guardando...';

  try {
    const updateData = {
      reportante_nombre: reportanteNombres,
      reportante_apellidos: reportanteApellidos,
      reportante_cedula: reportanteCedula,
      fecha_averia: fechaAveria,
      hora_averia: horaAveria,
      detalles_averia: detallesAveria,
      observaciones: document.getElementById('modObservacionesAveria').value.trim(),
      fotos_evidencia: fotosEvidenciaMod.length > 0 ? fotosEvidenciaMod : null
    };

    const { error } = await supabaseClient
      .from('equipos_averiados')
      .update(updateData)
      .eq('id', averiaSeleccionada.id);

    if (error) throw error;

    // ✅ REGISTRAR EN LOGS
    if (typeof registrarLog === 'function') {
      const descripcion = `Avería modificada | Equipo: ${averiaSeleccionada.codigo_barras} (${averiaSeleccionada.nombre_equipo}) | Nuevos datos: Reportante: ${reportanteNombres} ${reportanteApellidos}, Detalles: ${detallesAveria.substring(0, 60)}... | Modificado por: ${usuarioActualMod?.email || 'Desconocido'}`;
      await registrarLog('averias', 'Avería modificada', descripcion, 'warning');
    }

    mostrarToastMod('✅ Cambios guardados exitosamente', 'exito');
    limpiarFormularioModAveria();

  } catch (err) {
    console.error('Error al guardar cambios:', err);
    mostrarToastMod('Error al guardar: ' + err.message, 'error');
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = '💾 Guardar Cambios';
  }
}

// ==========================================
// LIMPIAR FORMULARIO
// ==========================================
function limpiarFormularioModAveria() {
  averiaSeleccionada = null;
  fotosEvidenciaMod = [];

  document.getElementById('buscarAveriaMod').value = '';
  document.getElementById('modReportanteNombres').value = '';
  document.getElementById('modReportanteApellidos').value = '';
  document.getElementById('modReportanteCedula').value = '';
  document.getElementById('modFechaAveria').value = '';
  document.getElementById('modHoraAveria').value = '';
  document.getElementById('modDetallesAveria').value = '';
  document.getElementById('modObservacionesAveria').value = '';
  document.getElementById('previewFotosMod').innerHTML = `<div class="foto-preview-placeholder"><div class="foto-preview-placeholder-icon">📷</div><div>No hay fotos de evidencia</div></div>`;

  document.getElementById('fieldsetFichaEquipoMod').style.display = 'none';
  document.getElementById('fieldsetDatosAveriaMod').style.display = 'none';
  document.getElementById('fieldsetFotosMod').style.display = 'none';
  document.getElementById('botonesAccionMod').style.display = 'none';

  const btnGuardar = document.getElementById('btnGuardarCambios');
  if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = '💾 Guardar Cambios'; }
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  inicializarModificarAveria();
});
