// ==========================================
// VARIABLES GLOBALES
// ==========================================
let equipoEnModificacion = null;
let fotosModificacion = [null, null, null, null];
let usuarioActualMod = null;
let formularioModModificado = false;

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarModificacion() {
  console.log('✏️ === INICIANDO MODIFICACIÓN DE EQUIPO ===');

  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }

  if (typeof supabaseClient === 'undefined') {
    mostrarMensajeMod('Error: Supabase no está disponible', 'error');
    return;
  }

  await cargarUsuarioMod();
  configurarEventListeners();

  const inputBuscar = document.getElementById('buscarEquipoInput');
  if (inputBuscar) inputBuscar.focus();

  console.log('✅ === MODIFICACIÓN INICIALIZADA ===');
}

// ==========================================
// CARGAR USUARIO
// ==========================================
async function cargarUsuarioMod() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data, error } = await supabaseClient
      .from('usuarios')
      .select('*')
      .eq('email', session.user.email)
      .maybeSingle();

    if (data && !error) {
      usuarioActualMod = data;
    } else {
      usuarioActualMod = { email: session.user.email, id: session.user.id };
    }
  } catch (err) {
    console.error('❌ Error al cargar usuario:', err);
  }
}

// ==========================================
// ✅ CONFIGURAR EVENT LISTENERS (CON MAYÚSCULAS AUTOMÁTICAS)
// ==========================================
function configurarEventListeners() {
  const inputBuscar = document.getElementById('buscarEquipoInput');
  if (inputBuscar) {
    // ✅ CORRECCIÓN 1: Forzar mayúsculas en tiempo real manteniendo la posición del cursor
    inputBuscar.addEventListener('input', (e) => {
      const cursorPos = e.target.selectionStart;
      e.target.value = e.target.value.toUpperCase();
      e.target.setSelectionRange(cursorPos, cursorPos);
    });

    // Detectar Enter en el campo de búsqueda
    inputBuscar.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        buscarEquipo();
      }
    });
  }

  // Detectar cambios en el formulario
  const campos = document.querySelectorAll('#fieldsetModificacion input, #fieldsetModificacion select, #fieldsetModificacion textarea');
  campos.forEach(campo => {
    campo.addEventListener('input', () => { formularioModModificado = true; });
    campo.addEventListener('change', () => { formularioModModificado = true; });
  });
}

// ==========================================
// BUSCAR EQUIPO
// ==========================================
async function buscarEquipo() {
  let codigo = document.getElementById('buscarEquipoInput').value.trim();
  
  if (!codigo) {
    mostrarMensajeMod('Por favor ingresa un código de barras o serial.', 'error');
    return;
  }

  // Sanitizar el código
  codigo = codigo.replace(/'/g, '-').replace(/"/g, '-').replace(/`/g, '-').trim();
  document.getElementById('buscarEquipoInput').value = codigo;

  mostrarMensajeMod('⏳ Buscando equipo...', 'info');

  try {
    const { data, error } = await supabaseClient
      .from('equipos')
      .select('*')
      .or(`codigo_barras.eq.${codigo},serial.eq.${codigo}`)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      mostrarMensajeMod(`❌ No se encontró ningún equipo con el código/serial: "${codigo}"`, 'error');
      document.getElementById('fieldsetModificacion').style.display = 'none';
      document.getElementById('buttonGroupModificacion').style.display = 'none';
      document.getElementById('equipoEncontrado').classList.remove('activo');
      return;
    }

    equipoEnModificacion = data;
    fotosModificacion = [null, null, null, null];

    const infoDiv = document.getElementById('equipoEncontradoInfo');
    infoDiv.innerHTML = `
      <strong>${data.nombre_equipo}</strong> | 
      Marca: ${data.marca} | 
      Serial: ${data.serial} | 
      Código: ${data.codigo_barras}
    `;
    document.getElementById('equipoEncontrado').classList.add('activo');

    document.getElementById('mod_codigo_barras').value = data.codigo_barras;
    document.getElementById('mod_nombre').value = data.nombre_equipo || '';
    document.getElementById('mod_marca').value = data.marca || '';
    document.getElementById('mod_modelo').value = data.modelo || '';
    document.getElementById('mod_serial').value = data.serial || '';
    document.getElementById('mod_medida_valor').value = data.medida_valor || '';
    document.getElementById('mod_medida_unidad').value = data.medida_unidad || 'm';
    document.getElementById('mod_costo').value = data.costo || '';
    document.getElementById('mod_estatus').value = data.estatus || 'operativo';
    document.getElementById('mod_observacion').value = data.observacion || '';

    for (let i = 1; i <= 4; i++) {
      const urlKey = i === 1 ? 'foto_url' : `foto${i}_url`;
      const url = data[urlKey];
      const preview = document.getElementById(`mod_preview${i}`);
      const placeholder = document.getElementById(`mod_preview${i}-placeholder`);
      const removeBtn = document.getElementById(`mod_remove${i}`);

      if (url) {
        preview.src = url;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        removeBtn.style.display = 'flex';
      } else {
        preview.style.display = 'none';
        preview.src = '';
        placeholder.style.display = 'block';
        removeBtn.style.display = 'none';
      }
    }

    document.getElementById('fieldsetModificacion').style.display = 'block';
    document.getElementById('buttonGroupModificacion').style.display = 'flex';
    formularioModModificado = false;

    // ✅ CORRECCIÓN 2: Asegurar que el botón de guardar esté habilitado al buscar un nuevo equipo
    const btnGuardar = document.getElementById('btnGuardarMod');
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.textContent = '💾 Guardar Cambios';
    }

    mostrarMensajeMod(`✅ Equipo encontrado: ${data.nombre_equipo}`, 'exito');

    setTimeout(() => {
      document.getElementById('fieldsetModificacion').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);

  } catch (err) {
    console.error('Error al buscar equipo:', err);
    mostrarMensajeMod('❌ Error al buscar: ' + err.message, 'error');
  }
}

// ==========================================
// PREVISUALIZAR FOTO EN MODIFICACIÓN
// ==========================================
window.previsualizarFotoModificacion = function(numero, event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    mostrarMensajeMod(`La foto ${numero} no debe superar los 5MB`, 'error');
    event.target.value = '';
    return;
  }

  if (!file.type.startsWith('image/')) {
    mostrarMensajeMod('Por favor selecciona un archivo de imagen válido', 'error');
    event.target.value = '';
    return;
  }

  fotosModificacion[numero - 1] = file;
  formularioModModificado = true;

  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById(`mod_preview${numero}`);
    const placeholder = document.getElementById(`mod_preview${numero}-placeholder`);
    const removeBtn = document.getElementById(`mod_remove${numero}`);

    if (preview) {
      preview.src = e.target.result;
      preview.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'flex';
  };
  reader.readAsDataURL(file);
};

// ==========================================
// REMOVER FOTO EN MODIFICACIÓN
// ==========================================
window.removerFotoModificacion = function(numero) {
  fotosModificacion[numero - 1] = null;
  formularioModModificado = true;

  const preview = document.getElementById(`mod_preview${numero}`);
  const placeholder = document.getElementById(`mod_preview${numero}-placeholder`);
  const removeBtn = document.getElementById(`mod_remove${numero}`);
  const input = document.getElementById(`mod_foto${numero}`);

  if (preview) { preview.style.display = 'none'; preview.src = ''; }
  if (placeholder) placeholder.style.display = 'block';
  if (removeBtn) removeBtn.style.display = 'none';
  if (input) input.value = '';
};

// ==========================================
// ✅ CANCELAR MODIFICACIÓN (CON RESET DE BOTÓN)
// ==========================================
window.cancelarModificacion = function() {
  if (formularioModModificado) {
    if (!confirm('⚠️ Tienes cambios sin guardar.\n\n¿Seguro que deseas cancelar?')) return;
  }

  equipoEnModificacion = null;
  fotosModificacion = [null, null, null, null];
  formularioModModificado = false;

  document.getElementById('buscarEquipoInput').value = '';
  
  const equipoEncontradoDiv = document.getElementById('equipoEncontrado');
  equipoEncontradoDiv.classList.remove('activo');
  document.getElementById('equipoEncontradoInfo').innerHTML = '';

  document.getElementById('fieldsetModificacion').style.display = 'none';
  document.getElementById('buttonGroupModificacion').style.display = 'none';
  
  document.getElementById('mensaje').className = 'mensaje';
  document.getElementById('mensaje').textContent = '';

  for (let i = 1; i <= 4; i++) {
    const preview = document.getElementById(`mod_preview${i}`);
    const placeholder = document.getElementById(`mod_preview${i}-placeholder`);
    const removeBtn = document.getElementById(`mod_remove${i}`);
    const input = document.getElementById(`mod_foto${i}`);

    if (preview) { preview.style.display = 'none'; preview.src = ''; }
    if (placeholder) placeholder.style.display = 'block';
    if (removeBtn) removeBtn.style.display = 'none';
    if (input) input.value = '';
  }

  // ✅ CORRECCIÓN 2: Asegurar que el botón de guardar se reinicie completamente
  const btnGuardar = document.getElementById('btnGuardarMod');
  if (btnGuardar) {
    btnGuardar.disabled = false;
    btnGuardar.textContent = '💾 Guardar Cambios';
  }

  document.getElementById('buscarEquipoInput').focus();
};

// ==========================================
// ✅ GUARDAR MODIFICACIÓN (CON RESET DE BOTÓN GARANTIZADO)
// ==========================================
window.guardarModificacion = async function() {
  if (!equipoEnModificacion) {
    mostrarMensajeMod('No hay equipo seleccionado para modificar', 'error');
    return;
  }

  const nombre = document.getElementById('mod_nombre').value.trim();
  const marca = document.getElementById('mod_marca').value.trim();
  const modelo = document.getElementById('mod_modelo').value.trim();
  const serial = document.getElementById('mod_serial').value.trim();
  const medidaValor = document.getElementById('mod_medida_valor').value;
  const medidaUnidad = document.getElementById('mod_medida_unidad').value;
  const costo = document.getElementById('mod_costo').value;
  const observacion = document.getElementById('mod_observacion').value.trim();
  const estatus = document.getElementById('mod_estatus').value;

  if (!nombre || !marca || !serial || !costo || !estatus) {
    mostrarMensajeMod('Por favor completa todos los campos obligatorios (*)', 'error');
    return;
  }

  if (serial !== equipoEnModificacion.serial) {
    const { data: serialData, error } = await supabaseClient
      .from('equipos')
      .select('id')
      .eq('serial', serial)
      .neq('codigo_barras', equipoEnModificacion.codigo_barras)
      .maybeSingle();

    if (serialData) {
      mostrarMensajeMod('❌ El serial ingresado ya está registrado en otro equipo', 'error');
      return;
    }
  }

  const btnGuardar = document.getElementById('btnGuardarMod');
  btnGuardar.disabled = true;
  btnGuardar.textContent = '💾 Guardando...';

  try {
    let fotoUrls = [
      equipoEnModificacion.foto_url,
      equipoEnModificacion.foto2_url,
      equipoEnModificacion.foto3_url,
      equipoEnModificacion.foto4_url
    ];

    for (let i = 0; i < 4; i++) {
      if (fotosModificacion[i]) {
        const fileExt = fotosModificacion[i].name.split('.').pop().toLowerCase();
        const fileName = `${equipoEnModificacion.codigo_barras}_foto${i + 1}_mod_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabaseClient.storage
          .from('equipos-fotos')
          .upload(fileName, fotosModificacion[i], { cacheControl: '3600', upsert: false });

        if (uploadError) throw new Error(`Error subiendo foto ${i + 1}: ${uploadError.message}`);

        const { data: urlData } = supabaseClient.storage.from('equipos-fotos').getPublicUrl(fileName);
        fotoUrls[i] = urlData.publicUrl;
      }
    }

    const { error } = await supabaseClient
      .from('equipos')
      .update({
        nombre_equipo: nombre,
        marca: marca,
        modelo: modelo || null,
        serial: serial,
        medida_valor: parseFloat(medidaValor) || 0,
        medida_unidad: medidaUnidad,
        costo: parseFloat(costo),
        observacion: observacion || null,
        estatus: estatus,
        foto_url: fotoUrls[0],
        foto2_url: fotoUrls[1],
        foto3_url: fotoUrls[2],
        foto4_url: fotoUrls[3]
      })
      .eq('codigo_barras', equipoEnModificacion.codigo_barras);

    if (error) throw error;

    mostrarMensajeMod('✅ Cambios guardados exitosamente', 'exito');
    formularioModModificado = false;

    if (typeof registrarLog === 'function') {
      try {
        const fechaHora = new Date().toLocaleString('es-ES', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        const usuario = usuarioActualMod?.email || 'Desconocido';
        const descripcion = `Modificó equipo: "${nombre}" | Serial: ${serial} | Código: ${equipoEnModificacion.codigo_barras} | Fecha/Hora: ${fechaHora} | Modificado por: ${usuario}`;

        await registrarLog('inventario', 'Equipo modificado', descripcion, 'success');
        console.log('📝 Log de modificación guardado');
      } catch (logErr) {
        console.warn('⚠️ No se pudo guardar el log, pero los cambios sí:', logErr);
      }
    }

    // ✅ CORRECCIÓN 2: Reactivar el botón INMEDIATAMENTE después del éxito
    btnGuardar.disabled = false;
    btnGuardar.textContent = '💾 Guardar Cambios';

    setTimeout(() => {
      if (confirm('✅ Cambios guardados exitosamente.\n\n¿Deseas buscar otro equipo para modificar?')) {
        cancelarModificacion();
      }
    }, 500);

  } catch (err) {
    console.error('❌ Error al guardar:', err);
    mostrarMensajeMod('❌ Error al guardar: ' + err.message, 'error');
    // Asegurar que el botón se reactive también en caso de error
    btnGuardar.disabled = false;
    btnGuardar.textContent = '💾 Guardar Cambios';
  }
};

// ==========================================
// MOSTRAR MENSAJE
// ==========================================
function mostrarMensajeMod(texto, tipo) {
  const msg = document.getElementById('mensaje');
  if (msg) {
    msg.textContent = texto;
    msg.className = `mensaje ${tipo}`;
    msg.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (tipo === 'exito') {
      setTimeout(() => {
        if (msg.classList.contains('exito')) msg.className = 'mensaje';
      }, 8000);
    }
  }
}

// ==========================================
// CONFIRMACIÓN AL SALIR
// ==========================================
window.addEventListener('beforeunload', function(e) {
  if (formularioModModificado) {
    e.preventDefault();
    e.returnValue = '';
    return e.returnValue;
  }
});

// ==========================================
// INICIAR CUANDO EL DOM ESTÉ LISTO
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 Modificar DOM cargado');
  inicializarModificacion();
});
