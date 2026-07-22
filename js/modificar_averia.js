// ==========================================
// VARIABLES GLOBALES
// ==========================================
let averiaSeleccionada = null;
let fotosEvidenciaMod = [null, null, null, null];
let usuarioActualMod = null;

// ==========================================
// SISTEMA DE NOTIFICACIONES TOAST
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
// FUNCIÓN PARA ABRIR ZOOM
// ==========================================
function abrirZoomInfalible(url) {
  const modal = document.createElement('div');
  modal.id = 'modalZoomDinamicoMod';
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
  closeBtn.onclick = function(e) { e.stopPropagation(); cerrarZoomInfalibleMod(); };
  const img = document.createElement('img');
  img.src = url;
  img.alt = 'Zoom de foto';
  img.style.cssText = `max-width: 90% !important; max-height: 90vh !important; border-radius: 8px; box-shadow: 0 0 30px rgba(0,0,0,0.8); cursor: default;`;
  modal.appendChild(closeBtn);
  modal.appendChild(img);
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  modal.addEventListener('click', function(e) {
    if (e.target === modal) cerrarZoomInfalibleMod();
  });
}

function cerrarZoomInfalibleMod() {
  const modal = document.getElementById('modalZoomDinamicoMod');
  if (modal) {
    modal.remove();
    document.body.style.overflow = '';
  }
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
// ASEGURAR CONTENEDOR DE FOTOS DEL EQUIPO
// ==========================================
function asegurarContenedorFotosEquipo() {
  let contenedor = document.getElementById('previewFotosEquipoMod');
  if (!contenedor) {
    const fieldset = document.createElement('fieldset');
    fieldset.id = 'fieldsetFotosEquipoOriginalMod';
    fieldset.style.display = 'none';
    fieldset.style.marginBottom = '20px';
    const legend = document.createElement('legend');
    legend.textContent = '🖼️ Fotos del Equipo (Registro Original - Solo Lectura)';
    legend.style.cssText = 'background: #1e3a8a; color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600;';
    fieldset.appendChild(legend);
    const grid = document.createElement('div');
    grid.className = 'fotos-grid';
    grid.id = 'previewFotosEquipoMod';
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 15px;';
    fieldset.appendChild(grid);
    const fieldsetFicha = document.getElementById('fieldsetFichaEquipoMod');
    if (fieldsetFicha && fieldsetFicha.parentNode) {
      fieldsetFicha.parentNode.insertBefore(fieldset, fieldsetFicha.nextSibling);
    } else {
      document.body.appendChild(fieldset);
    }
    contenedor = grid;
  }
  return contenedor;
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
      input.value = '';
      input.focus();
      return;
    }
    averiaSeleccionada = data;
    document.getElementById('modFichaCodigo').textContent = data.codigo_barras || '-';
    document.getElementById('modFichaNombre').textContent = data.nombre_equipo || '-';
    document.getElementById('modFichaMarca').textContent = data.marca || '-';
    document.getElementById('modFichaModelo').textContent = data.modelo || '-';
    document.getElementById('modFichaSerial').textContent = data.serial || '-';
    document.getElementById('fieldsetFichaEquipoMod').style.display = 'block';

    await cargarYMostrarFotosEquipoOriginal();

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

    // Cargar fotos de evidencia
    fotosEvidenciaMod = [null, null, null, null];
    if (data.fotos_evidencia) {
      let evidencias = [];
      if (Array.isArray(data.fotos_evidencia)) {
        evidencias = data.fotos_evidencia;
      } else if (typeof data.fotos_evidencia === 'string') {
        try {
          const parsed = JSON.parse(data.fotos_evidencia);
          evidencias = Array.isArray(parsed) ? parsed : [data.fotos_evidencia];
        } catch (e) {
          evidencias = [data.fotos_evidencia];
        }
      }
      for (let i = 0; i < Math.min(evidencias.length, 4); i++) {
        if (evidencias[i] && String(evidencias[i]).trim() !== '') {
          fotosEvidenciaMod[i] = String(evidencias[i]);
        }
      }
    }
    console.log("📸 FOTOS DE EVIDENCIA CARGADAS:", fotosEvidenciaMod);
    renderizarFotosEvidenciaMod();
  } catch (err) {
    mostrarToastMod('Error al buscar: ' + err.message, 'error');
  }
}

// ==========================================
// CARGAR Y MOSTRAR FOTOS ORIGINALES
// ==========================================
async function cargarYMostrarFotosEquipoOriginal() {
  const contenedor = asegurarContenedorFotosEquipo();
  const fieldset = document.getElementById('fieldsetFotosEquipoOriginalMod');
  if (fieldset) fieldset.style.display = 'block';
  contenedor.innerHTML = '<div style="text-align:center; padding:20px; color:#6b7280;">Cargando fotos...</div>';

  let fotos = [];
  if (averiaSeleccionada.foto_url) {
    fotos = [averiaSeleccionada.foto_url, averiaSeleccionada.foto2_url, averiaSeleccionada.foto3_url, averiaSeleccionada.foto4_url].filter(url => url && String(url).trim() !== '');
  }
  if (fotos.length === 0) {
    const { data: equipoOrig } = await supabaseClient
      .from('equipos')
      .select('foto_url, foto2_url, foto3_url, foto4_url')
      .eq('codigo_barras', averiaSeleccionada.codigo_barras)
      .maybeSingle();
    if (equipoOrig) {
      fotos = [equipoOrig.foto_url, equipoOrig.foto2_url, equipoOrig.foto3_url, equipoOrig.foto4_url].filter(url => url && String(url).trim() !== '');
    }
  }

  contenedor.innerHTML = '';
  if (fotos.length === 0) {
    contenedor.innerHTML = `<div class="foto-preview-placeholder"><div class="foto-preview-placeholder-icon">📷</div><div>El equipo no tenía fotos registradas</div></div>`;
    return;
  }

  fotos.forEach((fotoUrl, index) => {
    const div = document.createElement('div');
    div.className = 'foto-preview';
    div.style.cursor = 'zoom-in';
    div.style.position = 'relative';
    div.onclick = function() { abrirZoomInfalible(fotoUrl); };

    const img = document.createElement('img');
    img.src = fotoUrl;
    img.alt = `Foto original ${index + 1}`;
    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';

    const badge = document.createElement('div');
    badge.textContent = 'Original';
    badge.style.cssText = 'position: absolute; top: 5px; left: 5px; background: rgba(30, 58, 138, 0.85); color: white; font-size: 10px; padding: 3px 8px; border-radius: 4px; font-weight: 600; z-index: 100;';

    div.appendChild(img);
    div.appendChild(badge);
    contenedor.appendChild(div);
  });
}

// ==========================================
// ✅ RENDERIZAR FOTOS DE EVIDENCIA (ESTILO ORIGINAL, EDITABLES)
// ==========================================
function renderizarFotosEvidenciaMod() {
  console.log("🎨 Renderizando slots de evidencia...");
  
  for (let i = 1; i <= 4; i++) {
    const url = fotosEvidenciaMod[i - 1];
    const slot = document.getElementById(`slot_evidencia_${i}`);
    const preview = document.getElementById(`mod_preview_evidencia_${i}`);
    const placeholder = document.getElementById(`mod_placeholder_evidencia_${i}`);
    const input = document.getElementById(`mod_foto_evidencia_${i}`);
    const htmlRemoveBtn = document.getElementById(`mod_remove_evidencia_${i}`);
    
    if (!slot || !preview || !placeholder || !input) continue;

    // Ocultar el botón X del HTML (usaremos uno propio)
    if (htmlRemoveBtn) htmlRemoveBtn.style.display = 'none';

    // Limpiar elementos dinámicos anteriores
    const elementosDinamicos = slot.querySelectorAll('.badge-evidencia-dinamico, .boton-x-dinamico');
    elementosDinamicos.forEach(el => el.remove());

    const tieneFoto = url && typeof url === 'string' && url.trim() !== '' && url !== 'null';

    if (tieneFoto) {
      // MOSTRAR FOTO (igual que las originales)
      preview.src = url;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
      
      // BADGE "Evidencia" en AZUL (igual que "Original")
      const badge = document.createElement('div');
      badge.className = 'badge-evidencia-dinamico';
      badge.textContent = 'Evidencia';
      badge.style.cssText = `
        position: absolute !important; top: 5px !important; left: 5px !important;
        background: rgba(30, 58, 138, 0.85) !important; color: white !important; 
        font-size: 10px !important; padding: 3px 8px !important; border-radius: 4px !important; 
        font-weight: 600 !important; z-index: 9999 !important; pointer-events: none !important;
      `;
      slot.appendChild(badge);
      
      // BOTÓN "X" ROJO pequeño (para eliminar)
      const btnX = document.createElement('button');
      btnX.className = 'boton-x-dinamico';
      btnX.innerHTML = '✕';
      btnX.title = 'Eliminar foto';
      btnX.style.cssText = `
        position: absolute !important; top: 5px !important; right: 5px !important;
        background: rgba(220, 38, 38, 0.9) !important; color: white !important; 
        border: none !important; border-radius: 50% !important; 
        width: 24px !important; height: 24px !important;
        cursor: pointer !important; font-size: 14px !important;
        display: flex !important; align-items: center !important; 
        justify-content: center !important; z-index: 10000 !important;
        transition: all 0.3s !important;
      `;
      btnX.onmouseover = function() { this.style.background = 'rgba(185, 28, 28, 1) !important'; this.style.transform = 'scale(1.1)'; };
      btnX.onmouseout = function() { this.style.background = 'rgba(220, 38, 38, 0.9) !important'; this.style.transform = 'scale(1)'; };
      btnX.onclick = function(e) {
        e.stopPropagation();
        e.preventDefault();
        eliminarFotoEvidenciaMod(i);
      };
      slot.appendChild(btnX);
      
      // CLIC EN LA FOTO: ABRIR SELECTOR DE ARCHIVOS PARA REEMPLAZAR
      slot.style.cursor = 'pointer';
      slot.onclick = function(e) {
        if (e.target === btnX || btnX.contains(e.target)) return;
        e.preventDefault();
        input.click();
      };
      
      console.log(`✅ Slot ${i}: Foto mostrada estilo original, editable`);
      
    } else {
      // SIN FOTO: MOSTRAR PLACEHOLDER
      preview.style.display = 'none';
      preview.src = '';
      placeholder.style.display = 'flex';
      placeholder.innerHTML = `<div class="foto-preview-placeholder-icon">📷</div><div>Clic para agregar foto ${i}</div>`;
      
      slot.style.cursor = 'pointer';
      slot.onclick = function(e) {
        e.preventDefault();
        input.click();
      };
      
      console.log(` Slot ${i}: Vacío`);
    }
  }
}
// ==========================================
// ✅ ELIMINAR FOTO
// ==========================================
function eliminarFotoEvidenciaMod(numero) {
  if (!confirm(`¿Eliminar la foto de evidencia ${numero}?\n\nPodrás agregar una nueva haciendo clic en el recuadro o en el botón 🔄.`)) return;
  fotosEvidenciaMod[numero - 1] = null;
  const input = document.getElementById(`mod_foto_evidencia_${numero}`);
  if (input) input.value = '';
  renderizarFotosEvidenciaMod();
  mostrarToastMod(`🗑️ Foto ${numero} eliminada.`, 'aviso');
}

// ==========================================
// ✅ CAMBIAR FOTO
// ==========================================
async function cambiarFotoEvidenciaMod(numero, event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    mostrarToastMod(`La foto ${numero} no debe superar los 5MB`, 'error');
    event.target.value = '';
    return;
  }
  if (!file.type.startsWith('image/')) {
    mostrarToastMod('Por favor selecciona un archivo de imagen válido', 'error');
    event.target.value = '';
    return;
  }

  const btnGuardar = document.getElementById('btnGuardarCambios');
  if (btnGuardar) {
    btnGuardar.disabled = true;
    btnGuardar.textContent = '⏳ Subiendo foto...';
  }

  try {
    const codigoEquipo = averiaSeleccionada?.codigo_barras || 'sin_codigo';
    const fileName = `${codigoEquipo}/mod_evidencia_${numero}_${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabaseClient.storage
      .from('fotos-averias')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw new Error(`Error subiendo foto: ${uploadError.message}`);

    const { data: urlData } = supabaseClient.storage.from('fotos-averias').getPublicUrl(fileName);
    fotosEvidenciaMod[numero - 1] = urlData.publicUrl;

    renderizarFotosEvidenciaMod();
    mostrarToastMod(`✅ Foto ${numero} actualizada exitosamente`, 'exito');
  } catch (err) {
    console.error('Error al subir foto:', err);
    mostrarToastMod('Error al subir foto: ' + err.message, 'error');
  } finally {
    event.target.value = '';
    const btn = document.getElementById('btnGuardarCambios');
    if (btn) {
      btn.disabled = false;
      btn.textContent = '💾 Guardar Cambios';
    }
  }
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
    const fotosParaGuardar = fotosEvidenciaMod.filter(url => url !== null);
    const updateData = {
      reportante_nombre: reportanteNombres,
      reportante_apellidos: reportanteApellidos,
      reportante_cedula: reportanteCedula,
      fecha_averia: fechaAveria,
      hora_averia: horaAveria,
      detalles_averia: detallesAveria,
      observaciones: document.getElementById('modObservacionesAveria').value.trim(),
      fotos_evidencia: fotosParaGuardar.length > 0 ? fotosParaGuardar : null
    };

    const { error } = await supabaseClient
      .from('equipos_averiados')
      .update(updateData)
      .eq('id', averiaSeleccionada.id);

    if (error) throw error;

    if (typeof registrarLog === 'function') {
      const descripcion = `Avería modificada | Equipo: ${averiaSeleccionada.codigo_barras} | Fotos evidencia actualizadas: ${fotosParaGuardar.length} | Modificado por: ${usuarioActualMod?.email || 'Desconocido'}`;
      await registrarLog('averias', 'Avería modificada', descripcion, 'warning');
    }

    mostrarToastMod('✅ Cambios guardados exitosamente', 'exito');
    setTimeout(() => { limpiarFormularioModAveria(); }, 1500);
  } catch (err) {
    console.error('Error al guardar cambios:', err);
    mostrarToastMod('Error al guardar: ' + err.message, 'error');
  } finally {
    const btn = document.getElementById('btnGuardarCambios');
    if (btn) {
      btn.disabled = false;
      btn.textContent = '💾 Guardar Cambios';
    }
  }
}

// ==========================================
// LIMPIAR FORMULARIO
// ==========================================
function limpiarFormularioModAveria() {
  averiaSeleccionada = null;
  fotosEvidenciaMod = [null, null, null, null];
  document.getElementById('buscarAveriaMod').value = '';
  document.getElementById('modReportanteNombres').value = '';
  document.getElementById('modReportanteApellidos').value = '';
  document.getElementById('modReportanteCedula').value = '';
  document.getElementById('modFechaAveria').value = '';
  document.getElementById('modHoraAveria').value = '';
  document.getElementById('modDetallesAveria').value = '';
  document.getElementById('modObservacionesAveria').value = '';
  renderizarFotosEvidenciaMod();

  for (let i = 1; i <= 4; i++) {
    const input = document.getElementById(`mod_foto_evidencia_${i}`);
    if (input) input.value = '';
  }

  const contenedorEquipo = document.getElementById('previewFotosEquipoMod');
  if (contenedorEquipo) contenedorEquipo.innerHTML = '';

  document.getElementById('fieldsetFichaEquipoMod').style.display = 'none';
  const fieldsetFotosEq = document.getElementById('fieldsetFotosEquipoOriginalMod');
  if (fieldsetFotosEq) fieldsetFotosEq.style.display = 'none';
  document.getElementById('fieldsetDatosAveriaMod').style.display = 'none';
  document.getElementById('fieldsetFotosMod').style.display = 'none';
  document.getElementById('botonesAccionMod').style.display = 'none';

  const btnGuardar = document.getElementById('btnGuardarCambios');
  if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = '💾 Guardar Cambios'; }

  document.getElementById('buscarAveriaMod').focus();
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  inicializarModificarAveria();
});
