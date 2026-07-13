// js/registro.js - Módulo de Registro de Equipos
// ==========================================
// VARIABLES GLOBALES
// ==========================================
let codigoBarrasActual = null;
let fotosSeleccionadas = [null, null, null, null];
let usuarioActual = null;
let fotoSeleccionadaActual = null;
let formularioModificado = false;
let equipoGuardadoExitosamente = false;

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarRegistroEquipo() {
  console.log('🚀 === INICIANDO REGISTRO DE EQUIPO ===');

  // Resetear estado (importante cuando se recarga el módulo dentro del dashboard)
  formularioModificado = false;
  equipoGuardadoExitosamente = false;

  // Verificar elementos del DOM
  const formRegistro = document.getElementById('formRegistro');
  const btnGuardar = document.getElementById('btnGuardar');
  const modalSelector = document.getElementById('modalSelector');
  const modalCamara = document.getElementById('modalCamara');
  const svgBarcode = document.getElementById('barcode');

  console.log('🔍 Verificando elementos del DOM:');
  console.log('  - formRegistro:', formRegistro ? '✅' : '❌');
  console.log('  - btnGuardar:', btnGuardar ? '✅' : '❌');
  console.log('  - modalSelector:', modalSelector ? '✅' : '❌');
  console.log('  - modalCamara:', modalCamara ? '✅' : '❌');
  console.log('  - svgBarcode:', svgBarcode ? '✅' : '❌');

  if (!formRegistro || !btnGuardar) {
    console.log('ℹ️ No estamos en la página de registro');
    return;
  }

  if (!modalSelector || !modalCamara) {
    console.error('❌ ERROR: Faltan modales en el HTML');
    mostrarMensajeRegistro('Error: Faltan elementos en la página. Recarga la página.', 'error');
    return;
  }

  // Esperar Supabase
  console.log('⏳ Esperando Supabase...');
  let intentosSupabase = 0;
  while (typeof supabaseClient === 'undefined' && intentosSupabase < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentosSupabase++;
  }

  if (typeof supabaseClient === 'undefined') {
    console.warn('⚠️ Supabase no disponible');
    mostrarMensajeRegistro('Error: Supabase no está disponible', 'error');
    return;
  }
  console.log('✅ Supabase disponible');

  // Cargar usuario actual
  await cargarUsuario();

  // Esperar JsBarcode
  console.log('⏳ Esperando JsBarcode...');
  let intentosJsBarcode = 0;
  while (typeof JsBarcode === 'undefined' && intentosJsBarcode < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentosJsBarcode++;
  }

  if (typeof JsBarcode === 'undefined') {
    console.error('❌ JsBarcode no disponible');
    mostrarMensajeRegistro('Error: No se pudo cargar el generador de códigos', 'error');
    return;
  }
  console.log('✅ JsBarcode disponible');

  // Configurar listeners de modificación del formulario
  configurarDeteccionCambios();

  // Generar código de barras
  await generarCodigoBarras();

  // Registrar actividad en logs
  if (typeof registrarLog === 'function') {
    await registrarLog('inventario', 'abrir_formulario_registro', 'Abrió formulario de registro de equipo');
  }

  console.log('✅ === INICIALIZACIÓN COMPLETADA ===');
}

// ==========================================
// DETECTAR CAMBIOS EN EL FORMULARIO
// ==========================================
function configurarDeteccionCambios() {
  const campos = document.querySelectorAll('#formRegistro input, #formRegistro select, #formRegistro textarea');
  campos.forEach(campo => {
    campo.addEventListener('input', () => {
      if (!equipoGuardadoExitosamente) formularioModificado = true;
    });
    campo.addEventListener('change', () => {
      if (!equipoGuardadoExitosamente) formularioModificado = true;
    });
  });
}

// ==========================================
// CARGAR USUARIO
// ==========================================
async function cargarUsuario() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      console.warn('⚠️ No hay sesión activa');
      return;
    }

    const { data, error } = await supabaseClient
      .from('usuarios')
      .select('*')
      .eq('email', session.user.email)
      .maybeSingle();

    if (data && !error) {
      usuarioActual = data;
      console.log('✅ Usuario cargado:', usuarioActual.email);
    } else {
      usuarioActual = { email: session.user.email, id: session.user.id };
      console.log('✅ Usuario básico cargado:', usuarioActual.email);
    }
  } catch (err) {
    console.error('❌ Error al cargar usuario:', err);
  }
}

// ==========================================
// GENERAR CÓDIGO DE BARRAS
// ==========================================
async function generarCodigoBarras() {
  try {
    console.log('🔖 Generando código de barras...');

    let nuevoCodigo;
    let existe = true;
    let intentos = 0;

    while (existe && intentos < 10) {
      const ahora = new Date();
      const fechaParte = ahora.toISOString().slice(0, 10).replace(/-/g, '');
      const horaParte = ahora.toTimeString().slice(0, 8).replace(/:/g, '');
      const randomParte = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
      nuevoCodigo = `EP-${fechaParte}-${horaParte}-${randomParte}`;

      // ✅ CORREGIDO: usar maybeSingle() en lugar de single()
      const { data, error } = await supabaseClient
        .from('equipos')
        .select('codigo_barras')
        .eq('codigo_barras', nuevoCodigo)
        .maybeSingle();

      if (error) {
        console.warn('⚠️ Error al verificar código:', error.message);
        existe = false; // Asumir que no existe si hay error
      } else if (!data) {
        existe = false; // No existe, podemos usarlo
      } else {
        intentos++;
        console.log(`⚠️ Código duplicado, intento ${intentos}`);
      }
    }

    if (existe) {
      throw new Error('No se pudo generar un código único después de 10 intentos');
    }

    codigoBarrasActual = nuevoCodigo;
    const elementoCodigo = document.getElementById('codigoBarrasValor');
    if (elementoCodigo) elementoCodigo.textContent = codigoBarrasActual;

    try {
      JsBarcode("#barcode", codigoBarrasActual, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14,
        margin: 5,
        font: "Courier New",
        fontOptions: "bold"
      });
      console.log('✅ Código generado:', codigoBarrasActual);
    } catch (e) {
      console.error('❌ Error al renderizar código:', e);
    }

    const btnImprimir = document.getElementById('btnImprimir');
    if (btnImprimir) btnImprimir.disabled = false;
  } catch (err) {
    console.error('❌ Error al generar código:', err);
    const elementoCodigo = document.getElementById('codigoBarrasValor');
    if (elementoCodigo) elementoCodigo.textContent = 'Error al generar';
    mostrarMensajeRegistro('Error al generar el código: ' + err.message, 'error');
  }
}

// ==========================================
// SELECTOR DE FOTO
// ==========================================
window.abrirSelectorFoto = function(numero) {
  console.log('📸 Abriendo selector para foto:', numero);
  const modal = document.getElementById('modalSelector');
  if (!modal) {
    console.error('❌ Modal selector NO encontrado');
    mostrarMensajeRegistro('Error: El modal de selección no está disponible', 'error');
    return;
  }
  fotoSeleccionadaActual = numero;
  modal.classList.add('activo');
  modal.style.display = 'flex';
};

window.cerrarSelectorFoto = function() {
  const modal = document.getElementById('modalSelector');
  if (modal) {
    modal.classList.remove('activo');
    modal.style.display = 'none';
  }
  fotoSeleccionadaActual = null;
};

// Funciones del selector: archivo y cámara
window.seleccionarArchivo = function() {
  cerrarSelectorFoto();
  if (fotoSeleccionadaActual) {
    const input = document.getElementById(`foto${fotoSeleccionadaActual}`);
    if (input) input.click();
  }
};

window.seleccionarCamara = function() {
  const numero = fotoSeleccionadaActual;
  cerrarSelectorFoto();
  if (numero) abrirCamara(numero);
};

// ==========================================
// PREVISUALIZAR FOTO
// ==========================================
window.previsualizarFoto = function(numero, event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    mostrarMensajeRegistro(`La foto ${numero} no debe superar los 5MB`, 'error');
    event.target.value = '';
    return;
  }

  if (!file.type.startsWith('image/')) {
    mostrarMensajeRegistro('Por favor selecciona un archivo de imagen válido', 'error');
    event.target.value = '';
    return;
  }

  fotosSeleccionadas[numero - 1] = file;
  if (!equipoGuardadoExitosamente) formularioModificado = true;

  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById(`preview${numero}`);
    const placeholder = document.getElementById(`preview${numero}-placeholder`);
    const removeBtn = document.getElementById(`remove${numero}`);
    const previewBox = document.getElementById(`previewBox${numero}`);

    if (preview) {
      preview.src = e.target.result;
      preview.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'flex';
    if (previewBox) {
      previewBox.onclick = null;
      previewBox.style.cursor = 'default';
    }
  };
  reader.readAsDataURL(file);
};

// ==========================================
// REMOVER FOTO
// ==========================================
window.removerFoto = function(numero) {
  fotosSeleccionadas[numero - 1] = null;
  if (!equipoGuardadoExitosamente) formularioModificado = true;

  const preview = document.getElementById(`preview${numero}`);
  const placeholder = document.getElementById(`preview${numero}-placeholder`);
  const removeBtn = document.getElementById(`remove${numero}`);
  const input = document.getElementById(`foto${numero}`);
  const previewBox = document.getElementById(`previewBox${numero}`);

  if (preview) { preview.style.display = 'none'; preview.src = ''; }
  if (placeholder) placeholder.style.display = 'block';
  if (removeBtn) removeBtn.style.display = 'none';
  if (input) input.value = '';
  if (previewBox) {
    previewBox.onclick = function() { abrirSelectorFoto(numero); };
    previewBox.style.cursor = 'pointer';
  }
};

// ==========================================
// ABRIR CÁMARA
// ==========================================
window.abrirCamara = async function(numero) {
  fotoSeleccionadaActual = numero;
  const modal = document.getElementById('modalCamara');
  const video = document.getElementById('videoCamara');

  if (!modal || !video) {
    mostrarMensajeRegistro('Error: Modal de cámara no encontrado', 'error');
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    video.srcObject = stream;
    modal.classList.add('activo');
    modal.style.display = 'flex';
  } catch (err) {
    console.error('❌ Error al acceder a la cámara:', err);
    mostrarMensajeRegistro('No se pudo acceder a la cámara. Verifica los permisos.', 'error');
  }
};

// ==========================================
// CERRAR CÁMARA
// ==========================================
window.cerrarCamara = function() {
  const modal = document.getElementById('modalCamara');
  const video = document.getElementById('videoCamara');

  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }
  if (modal) {
    modal.classList.remove('activo');
    modal.style.display = 'none';
  }
  fotoSeleccionadaActual = null;
};

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

  canvas.toBlob(function(blob) {
    const file = new File([blob], `foto_${fotoSeleccionadaActual}_${Date.now()}.jpg`, {
      type: 'image/jpeg'
    });
    fotosSeleccionadas[fotoSeleccionadaActual - 1] = file;
    if (!equipoGuardadoExitosamente) formularioModificado = true;

    const reader = new FileReader();
    reader.onload = function(e) {
      const numero = fotoSeleccionadaActual;
      const preview = document.getElementById(`preview${numero}`);
      const placeholder = document.getElementById(`preview${numero}-placeholder`);
      const removeBtn = document.getElementById(`remove${numero}`);
      const previewBox = document.getElementById(`previewBox${numero}`);

      if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
      if (placeholder) placeholder.style.display = 'none';
      if (removeBtn) removeBtn.style.display = 'flex';
      if (previewBox) { previewBox.onclick = null; previewBox.style.cursor = 'default'; }
    };
    reader.readAsDataURL(file);
    cerrarCamara();
  }, 'image/jpeg', 0.9);
};

// ==========================================
// VERIFICAR SERIAL (CORREGIDO)
// ==========================================
async function verificarSerial(serial) {
  try {
    // ✅ CORREGIDO: usar maybeSingle() para evitar error 406
    const { data, error } = await supabaseClient
      .from('equipos')
      .select('serial')
      .eq('serial', serial)
      .maybeSingle();

    if (error) {
      console.warn('⚠️ Error al verificar serial:', error.message);
      return false;
    }
    return data !== null;
  } catch (err) {
    console.error('❌ Error en verificarSerial:', err);
    return false;
  }
}

// ==========================================
// VALIDAR COSTO
// ==========================================
function validarCosto(valor) {
  if (valor === '' || valor === null) return false;
  const num = parseFloat(valor);
  return !isNaN(num) && num >= 0;
}

// ==========================================
// GUARDAR EQUIPO
// ==========================================
window.guardarEquipo = async function() {
  console.log('💾 Guardando equipo...');

  // Obtener valores
  const nombre = document.getElementById('nombreEquipo').value.trim();
  const marca = document.getElementById('marcaEquipo').value.trim();
  const modelo = document.getElementById('modeloEquipo').value.trim();
  const serial = document.getElementById('serialEquipo').value.trim();
  const medidaValor = document.getElementById('medidaValor').value;
  const medidaUnidad = document.getElementById('medidaUnidad').value;
  const costo = document.getElementById('costoEquipo').value;
  const observacion = document.getElementById('observacionEquipo').value.trim();
  const estatus = document.getElementById('estatusEquipo').value;

  // Validaciones
  if (!nombre || !marca || !serial || !estatus) {
    mostrarMensajeRegistro('Por favor completa todos los campos obligatorios (*)', 'error');
    return;
  }

  if (!validarCosto(costo)) {
    mostrarMensajeRegistro('El costo debe ser un número válido mayor o igual a 0', 'error');
    return;
  }

  if (!codigoBarrasActual) {
    mostrarMensajeRegistro('Error: No hay código de barras generado', 'error');
    return;
  }

  if (!fotosSeleccionadas[0]) {
    mostrarMensajeRegistro('La Foto Principal es obligatoria', 'error');
    return;
  }

  // Validar longitud del serial
  if (serial.length > 100) {
    mostrarMensajeRegistro('El serial es demasiado largo (máximo 100 caracteres)', 'error');
    return;
  }

  // Verificar serial duplicado
  const serialExiste = await verificarSerial(serial);
  if (serialExiste) {
    mostrarMensajeRegistro('⚠️ El serial "' + serial + '" ya está registrado en otro equipo', 'error');
    return;
  }

  const btnGuardar = document.getElementById('btnGuardar');
  btnGuardar.disabled = true;
  btnGuardar.textContent = '💾 Guardando...';

  try {
    // Subir fotos al storage
    let fotoUrls = [null, null, null, null];
    for (let i = 0; i < 4; i++) {
      if (fotosSeleccionadas[i]) {
        const fileExt = fotosSeleccionadas[i].name.split('.').pop().toLowerCase();
        const fileName = `${codigoBarrasActual}_foto${i + 1}_${Date.now()}.${fileExt}`;
        console.log(`📤 Subiendo foto ${i + 1}...`);

        const { error: uploadError } = await supabaseClient.storage
          .from('equipos-fotos')
          .upload(fileName, fotosSeleccionadas[i], {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error(`❌ Error al subir foto ${i + 1}:`, uploadError);
          throw new Error(`No se pudo subir la foto ${i + 1}: ${uploadError.message}`);
        }

        const { data: urlData } = supabaseClient.storage
          .from('equipos-fotos')
          .getPublicUrl(fileName);
        fotoUrls[i] = urlData.publicUrl;
        console.log(`✅ Foto ${i + 1} subida`);
      }
    }

    // Guardar en base de datos
    console.log('📝 Guardando en base de datos...');
    const { data, error } = await supabaseClient
      .from('equipos')
      .insert({
        codigo_barras: codigoBarrasActual,
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
        foto4_url: fotoUrls[3],
        usuario_registro: usuarioActual?.email || 'unknown',
        usuario_registro_id: usuarioActual?.id || null
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('El serial ya está registrado en otro equipo');
      }
      throw error;
    }

    console.log('✅ Equipo guardado exitosamente');
    equipoGuardadoExitosamente = true;
    formularioModificado = false;

    mostrarMensajeRegistro(`✅ Equipo registrado exitosamente con código: ${codigoBarrasActual}`, 'exito');

    // Registrar en logs
    if (typeof registrarLog === 'function') {
      await registrarLog(
        'inventario',
        'registrar_equipo',
        `Registró equipo "${nombre}" (${marca} ${modelo}) - Código: ${codigoBarrasActual}`,
        'success'
      );
    }

    // Guardar datos para posible impresión
    window.equipoRegistrado = {
      codigo_barras: codigoBarrasActual,
      nombre_equipo: nombre,
      marca: marca,
      modelo: modelo,
      serial: serial,
      estatus: estatus,
      fecha_registro: data.fecha_registro
    };

    btnGuardar.textContent = '✅ Guardado';

    // Habilitar botón de imprimir
    const btnImprimir = document.getElementById('btnImprimir');
    if (btnImprimir) btnImprimir.disabled = false;

    // Preguntar si desea imprimir sticker
    setTimeout(() => {
      if (confirm('✅ Equipo guardado.\n\n¿Deseas imprimir el sticker del código de barras ahora?')) {
        imprimirSticker();
      }
    }, 500);

  } catch (err) {
    console.error('❌ Error al guardar:', err);
    mostrarMensajeRegistro('❌ Error al guardar: ' + err.message, 'error');
    btnGuardar.disabled = false;
    btnGuardar.textContent = '💾 Guardar Equipo';

    // Registrar error en logs
    if (typeof registrarLog === 'function') {
      await registrarLog(
        'inventario',
        'registrar_equipo_error',
        `Error al registrar equipo: ${err.message}`,
        'error'
      );
    }
  }
};

// ==========================================
// IMPRIMIR STICKER
// ==========================================
window.imprimirSticker = function() {
  if (!codigoBarrasActual) {
    mostrarMensajeRegistro('No hay código de barras para imprimir', 'error');
    return;
  }

  const nombre = document.getElementById('nombreEquipo').value.trim();
  const marca = document.getElementById('marcaEquipo').value.trim() || '';
  const modelo = document.getElementById('modeloEquipo').value.trim() || '';
  const serial = document.getElementById('serialEquipo').value.trim() || '';

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = '<svg id="stickerBarcode"></svg>';
  document.body.appendChild(tempDiv);

  try {
    JsBarcode("#stickerBarcode", codigoBarrasActual, {
      format: "CODE128",
      width: 1.5,
      height: 40,
      displayValue: true,
      fontSize: 12,
      margin: 2,
      font: "Courier New"
    });

    const barcodeSVG = tempDiv.querySelector('svg').outerHTML;
    document.body.removeChild(tempDiv);

    const ventana = window.open('', '_blank', 'width=600,height=500');
    if (!ventana) {
      mostrarMensajeRegistro('⚠️ El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes.', 'error');
      return;
    }

    ventana.document.write(`
<!DOCTYPE html>
<html>
<head>
<title>Sticker - ${codigoBarrasActual}</title>
<style>
@page { size: 4in 2.5in; margin: 0.1in; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; padding: 5px; }
.sticker { border: 2px solid #000; padding: 8px; text-align: center; width: 100%; }
.empresa { font-size: 10px; font-weight: bold; color: #1e3a8a; margin-bottom: 4px; }
.nombre { font-size: 11px; font-weight: bold; margin: 4px 0; }
.barcode { margin: 6px 0; }
.barcode svg { max-width: 100%; height: auto; }
.info { font-size: 8px; color: #333; margin-top: 4px; }
.codigo { font-size: 10px; font-weight: bold; margin-top: 4px; font-family: monospace; }
</style>
</head>
<body>
<div class="sticker">
<div class="empresa">Eventos D' Primera</div>
${nombre ? `<div class="nombre">${nombre}</div>` : ''}
<div class="barcode">${barcodeSVG}</div>
<div class="codigo">${codigoBarrasActual}</div>
<div class="info">
${marca}${modelo ? ' - ' + modelo : ''}<br>
${serial ? 'S/N: ' + serial : ''}
</div>
</div>
<script>
window.onload = function() { setTimeout(function() { window.print(); }, 300); };
<\/script>
</body>
</html>
    `);
    ventana.document.close();

    // Registrar en logs
    if (typeof registrarLog === 'function') {
      registrarLog('inventario', 'imprimir_sticker', `Imprimió sticker para código ${codigoBarrasActual}`);
    }
  } catch (err) {
    console.error('❌ Error al generar sticker:', err);
    mostrarMensajeRegistro('Error al generar el sticker', 'error');
    if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
  }
};

// ==========================================
// LIMPIAR FORMULARIO
// ==========================================
window.limpiarFormulario = function() {
  if (formularioModificado && !equipoGuardadoExitosamente) {
    if (!confirm('⚠️ Hay datos sin guardar.\n\n¿Estás seguro de limpiar el formulario?')) {
      return;
    }
  }

  document.getElementById('formRegistro').reset();

  for (let i = 1; i <= 4; i++) {
    fotosSeleccionadas[i - 1] = null;
    const preview = document.getElementById(`preview${i}`);
    const placeholder = document.getElementById(`preview${i}-placeholder`);
    const removeBtn = document.getElementById(`remove${i}`);
    const input = document.getElementById(`foto${i}`);
    const previewBox = document.getElementById(`previewBox${i}`);

    if (preview) { preview.style.display = 'none'; preview.src = ''; }
    if (placeholder) placeholder.style.display = 'block';
    if (removeBtn) removeBtn.style.display = 'none';
    if (input) input.value = '';
    if (previewBox) {
      previewBox.onclick = function() { abrirSelectorFoto(i); };
      previewBox.style.cursor = 'pointer';
    }
  }

  window.equipoRegistrado = null;
  formularioModificado = false;
  equipoGuardadoExitosamente = false;

  const mensajeDiv = document.getElementById('mensaje');
  if (mensajeDiv) mensajeDiv.className = 'mensaje';

  const btnGuardar = document.getElementById('btnGuardar');
  if (btnGuardar) {
    btnGuardar.disabled = false;
    btnGuardar.textContent = '💾 Guardar Equipo';
  }

  // Generar nuevo código de barras
  generarCodigoBarras();
}

// ==========================================
// MOSTRAR MENSAJE
// ==========================================
function mostrarMensajeRegistro(texto, tipo) {
  const mensajeDiv = document.getElementById('mensaje');
  if (mensajeDiv) {
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Auto-ocultar mensajes de éxito después de 8 segundos
    if (tipo === 'exito') {
      setTimeout(() => {
        if (mensajeDiv.classList.contains('exito')) {
          mensajeDiv.className = 'mensaje';
        }
      }, 8000);
    }
  }
}

// ==========================================
// CONFIRMACIÓN AL SALIR CON DATOS SIN GUARDAR
// ==========================================
window.addEventListener('beforeunload', function(e) {
  if (formularioModificado && !equipoGuardadoExitosamente) {
    e.preventDefault();
    e.returnValue = 'Tienes cambios sin guardar. ¿Seguro que deseas salir?';
    return e.returnValue;
  }
});
