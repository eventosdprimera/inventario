// ==========================================
// VARIABLES GLOBALES
// ==========================================
let equipoEnModificacion = null;
let fotosModificacion = [null, null, null, null];
let usuarioActualMod = null;
let formularioModModificado = false;
let modInicializado = false;

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarModificacion() {
  // ✅ Verificar que estamos en la página correcta
  if (!document.getElementById('fieldsetModificacion') || !document.getElementById('buscarEquipoInput')) {
    console.log('ℹ️ No estamos en la página de modificación');
    return;
  }

  console.log('✏️ === INICIANDO MODIFICACIÓN DE EQUIPO ===');

  // Resetear estado cada vez que se visita la página
  equipoEnModificacion = null;
  fotosModificacion = [null, null, null, null];
  formularioModModificado = false;

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

  // ✅ DEFINIR BUSCAR EQUIPO EN EL SCOPE GLOBAL (cada vez que se visita la página)
  window.buscarEquipo = async function() {
    let codigo = document.getElementById('buscarEquipoInput').value.trim();
    
    if (!codigo) {
      mostrarMensajeMod('Por favor ingresa un código de barras o serial.', 'error');
      return;
    }

    codigo = codigo.replace(/'/g, '-').replace(/"/g, '-').replace(/`/g, '-').trim();
    document.getElementById('buscarEquipoInput').value = codigo;

    mostrarMensajeMod('⏳ Buscando equipo...', 'info');

    try {
      // Primero buscar por código de barras (exacto)
      let { data, error } = await supabaseClient
        .from('equipos')
        .select('*')
        .eq('codigo_barras', codigo)
        .maybeSingle();

      // Si no encontró por código, buscar por serial (case-insensitive)
      if (!data && !error) {
        const resultado = await supabaseClient
          .from('equipos')
          .select('*')
          .ilike('serial', codigo)
          .maybeSingle();
        
        data = resultado.data;
        error = resultado.error;
      }

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
      formularioModModificado = false;

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
  };

  modInicializado = true;
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
// CONFIGURAR EVENT LISTENERS
// ==========================================
function configurarEventListeners() {
  const inputBuscar = document.getElementById('buscarEquipoInput');
  if (inputBuscar) {
    // Limpiar listeners previos clonando el elemento
    if (!inputBuscar.dataset.modListenerAttached) {
      inputBuscar.addEventListener('input', (e) => {
        const cursorPos = e.target.selectionStart;
        e.target.value = e.target.value.toUpperCase();
        e.target.setSelectionRange(cursorPos, cursorPos);
      });

      inputBuscar.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (typeof window.buscarEquipo === 'function') {
            window.buscarEquipo();
          }
        }
      });
      
      inputBuscar.dataset.modListenerAttached = 'true';
    }
    inputBuscar.focus();
  }

  const campos = document.querySelectorAll('#fieldsetModificacion input, #fieldsetModificacion select, #fieldsetModificacion textarea');
  campos.forEach(campo => {
    if (!campo.dataset.modChangeListenerAttached) {
      campo.addEventListener('input', () => { formularioModModificado = true; });
      campo.addEventListener('change', () => { formularioModModificado = true; });
      campo.dataset.modChangeListenerAttached = 'true';
    }
  });
}

// ==========================================
// PREVISUALIZAR FOTO
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
// REMOVER FOTO
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
// CANCELAR MODIFICACIÓN
// ==========================================
window.cancelarModificacion = function() {
  if (formularioModModificado) {
    if (!confirm('⚠️ Tienes cambios sin guardar.\n\n¿Seguro que deseas cancelar?')) return;
  }

  equipoEnModificacion = null;
  fotosModificacion = [null, null, null, null];
  formularioModModificado = false;

  const inputBuscar = document.getElementById('buscarEquipoInput');
  if (inputBuscar) inputBuscar.value = '';
  
  const equipoEncontradoDiv = document.getElementById('equipoEncontrado');
  if (equipoEncontradoDiv) equipoEncontradoDiv.classList.remove('activo');
  
  const infoDiv = document.getElementById('equipoEncontradoInfo');
  if (infoDiv) infoDiv.innerHTML = '';

  const fieldsetMod = document.getElementById('fieldsetModificacion');
  if (fieldsetMod) fieldsetMod.style.display = 'none';
  
  const btnGroup = document.getElementById('buttonGroupModificacion');
  if (btnGroup) btnGroup.style.display = 'none';
  
  const msg = document.getElementById('mensaje');
  if (msg) {
    msg.className = 'mensaje';
    msg.textContent = '';
  }

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

  const btnGuardar = document.getElementById('btnGuardarMod');
  if (btnGuardar) {
    btnGuardar.disabled = false;
    btnGuardar.textContent = '💾 Guardar Cambios';
  }

  if (inputBuscar) inputBuscar.focus();
};

// ==========================================
// GUARDAR MODIFICACIÓN
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

  // Validación case-insensitive de serial duplicado
  if (serial.toLowerCase() !== equipoEnModificacion.serial.toLowerCase()) {
    const { data: serialData, error } = await supabaseClient
      .from('equipos')
      .select('id')
      .ilike('serial', serial)
      .neq('codigo_barras', equipoEnModificacion.codigo_barras)
      .maybeSingle();

    if (serialData) {
      mostrarMensajeMod('❌ El serial ingresado ya está registrado en otro equipo', 'error');
      return;
    }
  }

  const btnGuardar = document.getElementById('btnGuardarMod');
  btnGuardar.disabled = true;
  btnGuardar.textContent = '⏳ Guardando...';

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
        console.warn('⚠️ No se pudo guardar el log:', logErr);
      }
    }

    setTimeout(() => {
      cancelarModificacion();
    }, 1500);

  } catch (err) {
    console.error('❌ Error al guardar:', err);
    mostrarMensajeMod('❌ Error al guardar: ' + err.message, 'error');
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
        if (msg && msg.classList.contains('exito')) msg.className = 'mensaje';
      }, 3000);
    }
  }
}

// ==========================================
// CONFIRMACIÓN AL SALIR
// ==========================================
if (!window._modBeforeUnloadAttached) {
  window.addEventListener('beforeunload', function(e) {
    if (formularioModModificado) {
      e.preventDefault();
      e.returnValue = '';
      return e.returnValue;
    }
  });
  window._modBeforeUnloadAttached = true;
}
