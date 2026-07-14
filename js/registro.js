// ==========================================
// VARIABLES GLOBALES
// ==========================================
let codigoBarrasActual = null;
let fotosSeleccionadas = [null, null, null, null];
let usuarioActual = null;
let fotoSeleccionadaActual = null;
let yaInicializado = false;  // ← ESTA VARIABLE FALTABA
let formularioModificado = false;
let equipoGuardadoExitosamente = false;

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarRegistroEquipo() {
  console.log('🚀 === INICIANDO REGISTRO DE EQUIPO ===');

  // Resetear estado
  formularioModificado = false;
  equipoGuardadoExitosamente = false;

  const formRegistro = document.getElementById('formRegistro');
  const btnGuardar = document.getElementById('btnGuardar');

  console.log('🔍 Verificando elementos del DOM:');
  console.log('  - formRegistro:', formRegistro ? '✅' : '❌');
  console.log('  - btnGuardar:', btnGuardar ? '✅' : '❌');

  if (!formRegistro || !btnGuardar) {
    console.log('ℹ️ No estamos en la página de registro');
    return;
  }

  // Crear modales dinámicamente
  crearModalesYEstilos();

  // Esperar Supabase
  console.log('⏳ Esperando Supabase...');
  let intentosSupabase = 0;
  while (typeof supabaseClient === 'undefined' && intentosSupabase < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentosSupabase++;
  }

  if (typeof supabaseClient === 'undefined') {
    mostrarMensajeRegistro('Error: Supabase no está disponible', 'error');
    return;
  }
  console.log('✅ Supabase disponible');

  await cargarUsuario();

  // Esperar JsBarcode
  let intentosJsBarcode = 0;
  while (typeof JsBarcode === 'undefined' && intentosJsBarcode < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentosJsBarcode++;
  }

  if (typeof JsBarcode === 'undefined') {
    mostrarMensajeRegistro('Error: No se pudo cargar JsBarcode', 'error');
    return;
  }
  console.log('✅ JsBarcode disponible');

  configurarDeteccionCambios();
  await generarCodigoBarras();

  if (typeof registrarLog === 'function') {
    await registrarLog('inventario', 'abrir_formulario_registro', 'Abrió formulario de registro de equipo');
  }

  console.log('✅ === INICIALIZACIÓN COMPLETADA ===');
}

// ==========================================
// CREAR MODALES Y ESTILOS DINÁMICAMENTE
// ==========================================
function crearModalesYEstilos() {
  if (yaInicializado) return;

  // Inyectar estilos CSS de los modales
  if (!document.getElementById('estilos-modales-registro')) {
    const style = document.createElement('style');
    style.id = 'estilos-modales-registro';
    style.textContent = `
      .modal-overlay-registro {
        display: none;
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        z-index: 999999;
        justify-content: center;
        align-items: center;
        backdrop-filter: blur(4px);
      }
      .modal-overlay-registro.visible {
        display: flex !important;
      }
      .modal-tarjeta {
        background: white;
        border-radius: 16px;
        padding: 30px;
        max-width: 420px;
        width: 90%;
        box-shadow: 0 25px 60px rgba(0,0,0,0.4);
        animation: modalAparecer 0.3s ease;
        position: relative;
      }
      .modal-tarjeta-camara {
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
      }
      @keyframes modalAparecer {
        from { opacity: 0; transform: translateY(-30px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .modal-header-registro {
        text-align: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid #e5e7eb;
      }
      .modal-header-registro h3 {
        font-family: 'Libre Caslon Text', serif;
        color: #1e3a8a;
        font-size: 20px;
        margin: 0 0 6px 0;
      }
      .modal-header-registro p {
        color: #6b7280;
        font-size: 13px;
        margin: 0;
      }
      .modal-header-flex {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 12px;
        border-bottom: 2px solid #e5e7eb;
      }
      .modal-header-flex h3 {
        font-family: 'Libre Caslon Text', serif;
        color: #1e3a8a;
        font-size: 18px;
        margin: 0;
      }
      .modal-cerrar-x {
        background: #fee2e2;
        color: #dc2626;
        border: none;
        width: 32px; height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
      }
      .modal-cerrar-x:hover {
        background: #dc2626;
        color: white;
        transform: rotate(90deg);
      }
      .modal-opciones {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .modal-opcion-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 16px 20px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        background: white;
        cursor: pointer;
        font-size: 15px;
        font-weight: 600;
        font-family: 'Poppins', sans-serif;
        transition: all 0.3s;
        color: #374151;
      }
      .modal-opcion-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(0,0,0,0.1);
      }
      .modal-opcion-btn.opcion-archivo {
        border-color: #3b82f6;
        color: #1e3a8a;
      }
      .modal-opcion-btn.opcion-archivo:hover {
        background: #eff6ff;
        border-color: #1e3a8a;
      }
      .modal-opcion-btn.opcion-camara {
        border-color: #10b981;
        color: #065f46;
      }
      .modal-opcion-btn.opcion-camara:hover {
        background: #d1fae5;
        border-color: #059669;
      }
      .modal-opcion-btn.opcion-cancelar {
        border-color: #e5e7eb;
        color: #6b7280;
        background: #f9fafb;
        margin-top: 5px;
      }
      .modal-opcion-btn.opcion-cancelar:hover {
        background: #fee2e2;
        color: #dc2626;
        border-color: #dc2626;
      }
      .modal-opcion-icono {
        font-size: 22px;
      }
      .modal-video {
        width: 100%;
        background: #000;
        border-radius: 10px;
        max-height: 400px;
        display: block;
      }
      .modal-canvas-oculto {
        display: none;
      }
      .modal-acciones {
        display: flex;
        gap: 10px;
        margin-top: 15px;
        justify-content: center;
      }
      .modal-accion-btn {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .modal-accion-btn.accion-capturar {
        background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
        color: white;
        box-shadow: 0 4px 10px rgba(220,38,38,0.3);
      }
      .modal-accion-btn.accion-capturar:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 14px rgba(220,38,38,0.4);
      }
      .modal-accion-btn.accion-cancelar {
        background: #e5e7eb;
        color: #374151;
      }
      .modal-accion-btn.accion-cancelar:hover {
        background: #d1d5db;
      }
    `;
    document.head.appendChild(style);
    console.log('✅ Estilos de modales inyectados');
  }

  // Crear Modal Selector
  if (!document.getElementById('modalSelectorRegistro')) {
    const modal = document.createElement('div');
    modal.id = 'modalSelectorRegistro';
    modal.className = 'modal-overlay-registro';
    modal.innerHTML = `
      <div class="modal-tarjeta">
        <div class="modal-header-registro">
          <h3>📸 Seleccionar método</h3>
          <p>¿Cómo deseas agregar la foto?</p>
        </div>
        <div class="modal-opciones">
          <button type="button" class="modal-opcion-btn opcion-archivo" onclick="seleccionarArchivo()">
            <span class="modal-opcion-icono">📁</span>
            <span>Subir archivo</span>
          </button>
          <button type="button" class="modal-opcion-btn opcion-camara" onclick="seleccionarCamara()">
            <span class="modal-opcion-icono">📷</span>
            <span>Tomar foto con cámara</span>
          </button>
          <button type="button" class="modal-opcion-btn opcion-cancelar" onclick="cerrarSelectorFoto()">
            <span>❌ Cancelar</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    console.log('✅ Modal selector creado');
  }

  // Crear Modal Cámara
  if (!document.getElementById('modalCamaraRegistro')) {
    const modal = document.createElement('div');
    modal.id = 'modalCamaraRegistro';
    modal.className = 'modal-overlay-registro';
    modal.innerHTML = `
      <div class="modal-tarjeta modal-tarjeta-camara">
        <div class="modal-header-flex">
          <h3>📷 Capturar Foto</h3>
          <button class="modal-cerrar-x" onclick="cerrarCamara()">×</button>
        </div>
        <video id="videoCamaraRegistro" class="modal-video" autoplay playsinline></video>
        <canvas id="canvasCamaraRegistro" class="modal-canvas-oculto"></canvas>
        <div class="modal-acciones">
          <button type="button" class="modal-accion-btn accion-cancelar" onclick="cerrarCamara()">❌ Cancelar</button>
          <button type="button" class="modal-accion-btn accion-capturar" onclick="capturarFoto()">📸 Capturar Foto</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    console.log('✅ Modal cámara creado');
  }

  yaInicializado = true;
}

// ==========================================
// DETECTAR CAMBIOS
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
    if (!session) return;

    const { data, error } = await supabaseClient
      .from('usuarios')
      .select('*')
      .eq('email', session.user.email)
      .maybeSingle();

    if (data && !error) {
      usuarioActual = data;
    } else {
      usuarioActual = { email: session.user.email, id: session.user.id };
    }
    console.log('✅ Usuario cargado:', usuarioActual.email);
  } catch (err) {
    console.error('❌ Error al cargar usuario:', err);
  }
}

// ==========================================
// GENERAR CÓDIGO DE BARRAS (USA localStorage)
// ==========================================
async function generarCodigoBarras() {
  try {
    console.log('🔖 Generando código de barras...');

    // VERIFICAR SI HAY UN CÓDIGO GUARDADO EN localStorage
    const codigoGuardado = localStorage.getItem('codigoBarrasPendiente');
    
    if (codigoGuardado) {
      console.log('📋 Usando código guardado:', codigoGuardado);
      codigoBarrasActual = codigoGuardado;
      
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
        console.log('✅ Código de barras renderizado');
      } catch (e) {
        console.error('❌ Error al renderizar código:', e);
      }

      const btnImprimir = document.getElementById('btnImprimir');
      if (btnImprimir) btnImprimir.disabled = false;
      return;
    }

    // NO HAY CÓDIGO GUARDADO - GENERAR NUEVO
    let nuevoCodigo;
    let existe = true;
    let intentos = 0;

    while (existe && intentos < 10) {
      const ahora = new Date();
      const fechaParte = ahora.toISOString().slice(0, 10).replace(/-/g, '');
      const horaParte = ahora.toTimeString().slice(0, 8).replace(/:/g, '');
      const randomParte = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
      nuevoCodigo = `EP-${fechaParte}-${horaParte}-${randomParte}`;

      if (typeof supabaseClient !== 'undefined') {
        try {
          const { data, error } = await supabaseClient
            .from('equipos')
            .select('codigo_barras')
            .eq('codigo_barras', nuevoCodigo)
            .maybeSingle();

          if (error || !data) {
            existe = false;
          } else {
            intentos++;
          }
        } catch (err) {
          existe = false;
        }
      } else {
        existe = false;
      }
    }

    if (existe) {
      throw new Error('No se pudo generar un código único después de 10 intentos');
    }

    codigoBarrasActual = nuevoCodigo;
    
    // GUARDAR EN localStorage
    localStorage.setItem('codigoBarrasPendiente', codigoBarrasActual);
    
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
      console.log('✅ Código generado y guardado:', codigoBarrasActual);
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
  fotoSeleccionadaActual = numero;
  const modal = document.getElementById('modalSelectorRegistro');
  if (modal) {
    modal.classList.add('visible');
  } else {
    console.error('❌ Modal selector no encontrado');
    crearModalesYEstilos();
    const m = document.getElementById('modalSelectorRegistro');
    if (m) m.classList.add('visible');
  }
};

window.cerrarSelectorFoto = function() {
  const modal = document.getElementById('modalSelectorRegistro');
  if (modal) modal.classList.remove('visible');
  fotoSeleccionadaActual = null;
};

window.seleccionarArchivo = function() {
  const numero = fotoSeleccionadaActual;
  cerrarSelectorFoto();
  if (numero) {
    const input = document.getElementById(`foto${numero}`);
    if (input) {
      console.log('📁 Abriendo selector de archivos para foto:', numero);
      input.click();
    }
  }
};

window.seleccionarCamara = function() {
  const numero = fotoSeleccionadaActual;
  cerrarSelectorFoto();
  if (numero) {
    console.log('📷 Abriendo cámara para foto:', numero);
    abrirCamara(numero);
  }
};

// ==========================================
// PREVISUALIZAR FOTO
// ==========================================
window.previsualizarFoto = function(numero, event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    mostrarMensajeRegistro(`La foto ${numero} no debe superar 5MB`, 'error');
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

    if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
    if (placeholder) placeholder.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'flex';
    if (previewBox) { previewBox.onclick = null; previewBox.style.cursor = 'default'; }
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
  console.log('📷 Abriendo cámara para foto:', numero);
  fotoSeleccionadaActual = numero;

  const modal = document.getElementById('modalCamaraRegistro');
  const video = document.getElementById('videoCamaraRegistro');

  if (!modal || !video) {
    mostrarMensajeRegistro('Error: Modal de cámara no encontrado', 'error');
    return;
  }

  try {
    console.log('⏳ Solicitando acceso a la cámara...');
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
    
    console.log('✅ Cámara accesible, configurando video...');
    video.srcObject = stream;
    
    video.onloadedmetadata = () => {
      console.log('✅ Video cargado, dimensiones:', video.videoWidth, 'x', video.videoHeight);
      video.play().then(() => {
        console.log('✅ Video reproduciéndose');
        modal.classList.add('visible');
      }).catch(err => {
        console.error('❌ Error al reproducir video:', err);
        mostrarMensajeRegistro('Error al iniciar la cámara', 'error');
      });
    };
    
  } catch (err) {
    console.error('❌ Error al acceder a la cámara:', err);
    if (err.name === 'NotAllowedError') {
      mostrarMensajeRegistro('⚠️ Permiso de cámara denegado', 'error');
    } else if (err.name === 'NotFoundError') {
      mostrarMensajeRegistro('⚠️ No se encontró cámara', 'error');
    } else {
      mostrarMensajeRegistro('Error al acceder a la cámara: ' + err.message, 'error');
    }
  }
};

// ==========================================
// CERRAR CÁMARA
// ==========================================
window.cerrarCamara = function() {
  const modal = document.getElementById('modalCamaraRegistro');
  const video = document.getElementById('videoCamaraRegistro');

  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  }
  if (modal) modal.classList.remove('visible');
  fotoSeleccionadaActual = null;
};

// ==========================================
// CAPTURAR FOTO (CORREGIDA)
// ==========================================
window.capturarFoto = function() {
  const video = document.getElementById('videoCamaraRegistro');
  const canvas = document.getElementById('canvasCamaraRegistro');

  console.log('📸 Capturando foto...');
  console.log('  - video:', video ? '✅' : '❌');
  console.log('  - canvas:', canvas ? '✅' : '❌');

  if (!video || !canvas) {
    console.error('❌ Video o canvas no encontrado');
    mostrarMensajeRegistro('Error: Elementos de cámara no disponibles', 'error');
    return;
  }

  if (!video.videoWidth || !video.videoHeight) {
    console.error('❌ Video no está listo');
    mostrarMensajeRegistro('La cámara aún no está lista', 'error');
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

  const numeroFoto = fotoSeleccionadaActual;

  canvas.toBlob(function(blob) {
    if (!blob) {
      console.error('❌ No se pudo crear el blob');
      mostrarMensajeRegistro('Error al capturar la foto', 'error');
      return;
    }

    const file = new File([blob], `foto_${numeroFoto}_${Date.now()}.jpg`, {
      type: 'image/jpeg'
    });

    console.log('✅ Foto capturada, tamaño:', file.size, 'bytes');
    fotosSeleccionadas[numeroFoto - 1] = file;

    const reader = new FileReader();
    reader.onload = function(e) {
      console.log('🖼️ Actualizando preview de foto:', numeroFoto);

      const preview = document.getElementById(`preview${numeroFoto}`);
      const placeholder = document.getElementById(`preview${numeroFoto}-placeholder`);
      const removeBtn = document.getElementById(`remove${numeroFoto}`);
      const previewBox = document.getElementById(`previewBox${numeroFoto}`);

      if (preview) {
        preview.src = e.target.result;
        preview.style.display = 'block';
        console.log('✅ Preview actualizado para foto:', numeroFoto);
      }

      if (placeholder) placeholder.style.display = 'none';
      if (removeBtn) removeBtn.style.display = 'flex';
      if (previewBox) {
        previewBox.onclick = null;
        previewBox.style.cursor = 'default';
      }
    };

    reader.readAsDataURL(file);
    cerrarCamara();

  }, 'image/jpeg', 0.9);
};

// ==========================================
// VERIFICAR SERIAL
// ==========================================
async function verificarSerial(serial) {
  try {
    const { data, error } = await supabaseClient
      .from('equipos').select('serial').eq('serial', serial).maybeSingle();
    if (error) return false;
    return data !== null;
  } catch (err) { return false; }
}

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
  if (typeof supabaseClient === 'undefined') {
    mostrarMensajeRegistro('Error: Supabase no está configurado.', 'error');
    return;
  }

  const nombre = document.getElementById('nombreEquipo').value.trim();
  const marca = document.getElementById('marcaEquipo').value.trim();
  const modelo = document.getElementById('modeloEquipo').value.trim();
  const serial = document.getElementById('serialEquipo').value.trim();
  const medidaValor = document.getElementById('medidaValor').value;
  const medidaUnidad = document.getElementById('medidaUnidad').value;
  const costo = document.getElementById('costoEquipo').value;
  const observacion = document.getElementById('observacionEquipo').value.trim();
  const estatus = document.getElementById('estatusEquipo').value;

  if (!nombre || !marca || !serial || !costo || !estatus) {
    mostrarMensajeRegistro('Por favor completa todos los campos obligatorios (*)', 'error');
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

  const serialExiste = await verificarSerial(serial);
  if (serialExiste) {
    mostrarMensajeRegistro('⚠️ El serial ya está registrado en otro equipo', 'error');
    return;
  }

  const btnGuardar = document.getElementById('btnGuardar');
  btnGuardar.disabled = true;
  btnGuardar.textContent = '💾 Guardando...';

  try {
    let fotoUrls = [null, null, null, null];
    for (let i = 0; i < 4; i++) {
      if (fotosSeleccionadas[i]) {
        const fileExt = fotosSeleccionadas[i].name.split('.').pop();
        const fileName = `${codigoBarrasActual}_foto${i + 1}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabaseClient.storage
          .from('equipos-fotos')
          .upload(fileName, fotosSeleccionadas[i], { cacheControl: '3600', upsert: false });
        
        if (uploadError) throw new Error(`Error subiendo foto ${i + 1}: ${uploadError.message}`);

        const { data: urlData } = supabaseClient.storage.from('equipos-fotos').getPublicUrl(fileName);
        fotoUrls[i] = urlData.publicUrl;
      }
    }

    const { data, error } = await supabaseClient.from('equipos').insert({
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
    }).select().single();

    if (error) {
      if (error.code === '23505') throw new Error('El serial o código de barras ya existe');
      throw error;
    }

    console.log('✅ Equipo guardado exitosamente');
    mostrarMensajeRegistro('✅ Equipo registrado con código: ' + codigoBarrasActual, 'exito');
    
    // ✅ GUARDAR LOS DATOS EN MEMORIA PARA LA IMPRESIÓN (aunque el formulario se limpie)
    window.equipoRegistrado = {
      codigo_barras: codigoBarrasActual,
      nombre_equipo: nombre,
      marca: marca,
      modelo: modelo,
      serial: serial,
      estatus: estatus,
      fecha_registro: data.fecha_registro
    };

    // ✅ LIMPIAR EL FORMULARIO Y GENERAR NUEVO CÓDIGO AUTOMÁTICAMENTE
    prepararNuevoRegistro();

    // ✅ PREGUNTAR SI DESEA IMPRIMIR (usando los datos guardados en memoria)
    setTimeout(() => {
      if (confirm('✅ Equipo guardado exitosamente.\n\n¿Deseas imprimir el sticker del código de barras ahora?')) {
        imprimirSticker();
      }
    }, 500);

  } catch (err) {
    console.error('❌ Error al guardar:', err);
    mostrarMensajeRegistro('❌ Error al guardar: ' + err.message, 'error');
    btnGuardar.disabled = false;
    btnGuardar.textContent = '💾 Guardar Equipo';
  }
};

// ==========================================
// IMPRIMIR STICKER (TAMAÑO ETIQUETA PEQUEÑA)
// ==========================================
window.imprimirSticker = function() {
  // ✅ USAR EL CÓDIGO DEL EQUIPO RECIENTEMENTE GUARDADO, O EL ACTUAL
  const codigoParaImprimir = (window.equipoRegistrado && window.equipoRegistrado.codigo_barras) 
    ? window.equipoRegistrado.codigo_barras 
    : codigoBarrasActual;

  if (!codigoParaImprimir) {
    mostrarMensajeRegistro('No hay código de barras para imprimir', 'error');
    return;
  }

  // ✅ USAR LOS DATOS GUARDADOS EN MEMORIA (aunque el formulario ya esté limpio)
  const nombre = window.equipoRegistrado ? window.equipoRegistrado.nombre_equipo : (document.getElementById('nombreEquipo')?.value.trim() || '');
  const marca = window.equipoRegistrado ? window.equipoRegistrado.marca : (document.getElementById('marcaEquipo')?.value.trim() || '');
  const modelo = window.equipoRegistrado ? window.equipoRegistrado.modelo : (document.getElementById('modeloEquipo')?.value.trim() || '');
  const serial = window.equipoRegistrado ? window.equipoRegistrado.serial : (document.getElementById('serialEquipo')?.value.trim() || '');

  console.log('🖨️ Iniciando impresión de sticker para:', codigoParaImprimir);

  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.innerHTML = '<svg id="stickerBarcode"></svg>';
  document.body.appendChild(tempDiv);

  try {
    JsBarcode("#stickerBarcode", codigoParaImprimir, {
      format: "CODE128",
      width: 1.2,
      height: 35,
      displayValue: true,
      fontSize: 9,
      margin: 1,
      font: "Courier New",
      fontOptions: "bold"
    });

    const barcodeSVG = tempDiv.querySelector('svg').outerHTML;
    document.body.removeChild(tempDiv);

    const htmlSticker = `
<!DOCTYPE html>
<html>
<head>
  <title>Sticker - ${codigoParaImprimir}</title>
  <style>
    @page { size: 70mm 35mm; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 70mm; height: 35mm; font-family: Arial, sans-serif; overflow: hidden; }
    body { display: flex; justify-content: center; align-items: center; padding: 1mm; }
    .sticker { width: 100%; height: 100%; border: 0.5mm solid #000; padding: 1.5mm 2mm; text-align: center; display: flex; flex-direction: column; justify-content: space-between; }
    .empresa { font-size: 6pt; font-weight: bold; color: #1e3a8a; line-height: 1; margin-bottom: 0.5mm; }
    .nombre { font-size: 6pt; font-weight: bold; line-height: 1.1; margin-bottom: 0.5mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .barcode { margin: 0.5mm 0; display: flex; justify-content: center; align-items: center; }
    .barcode svg { max-width: 100%; height: auto; max-height: 12mm; }
    .codigo { font-size: 7pt; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 0.3mm; line-height: 1; }
    .info { font-size: 5pt; color: #333; line-height: 1.1; margin-top: 0.3mm; }
    @media print { body { padding: 0; } .sticker { border: 0.3mm solid #000; } }
  </style>
</head>
<body>
  <div class="sticker">
    <div class="empresa">EVENTOS D' PRIMERA</div>
    ${nombre ? `<div class="nombre">${nombre.substring(0, 40)}</div>` : ''}
    <div class="barcode">${barcodeSVG}</div>
    <div class="codigo">${codigoParaImprimir}</div>
    ${marca || serial ? `<div class="info">${marca}${modelo ? ' ' + modelo : ''}${serial ? ' | S/N:' + serial : ''}</div>` : ''}
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 400);
    });
  <\/script>
</body>
</html>
    `;

    const ventana = window.open('', '_blank', 'width=400,height=300');
    if (ventana && !ventana.closed) {
      ventana.document.open();
      ventana.document.write(htmlSticker);
      ventana.document.close();
    } else {
      mostrarMensajeRegistro('⚠️ El navegador bloqueó la ventana emergente.', 'error');
    }
  } catch (err) {
    console.error('❌ Error al generar sticker:', err);
    mostrarMensajeRegistro('Error al generar el sticker: ' + err.message, 'error');
    if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
  }
};

// ==========================================
// LIMPIAR FORMULARIO (MANTIENE EL CÓDIGO)
// ==========================================
// ==========================================
// LIMPIAR FORMULARIO
// ==========================================
// ==========================================
// LIMPIAR FORMULARIO (Manual con confirmación)
// ==========================================
window.limpiarFormulario = function() {
  if (!confirm('⚠️ ¿Limpiar el formulario?\n\nSe generará un nuevo código de barras.')) return;
  prepararNuevoRegistro();
};

  // ✅ LIMPIAR EL OBJETO DE EQUIPO REGISTRADO PARA LA PRÓXIMA VEZ
  window.equipoRegistrado = null;
  
  const mensajeDiv = document.getElementById('mensaje');
  if (mensajeDiv) mensajeDiv.className = 'mensaje';
  
  const btnGuardar = document.getElementById('btnGuardar');
  if (btnGuardar) {
    btnGuardar.disabled = false;
    btnGuardar.textContent = '💾 Guardar Equipo';
  }

  console.log('✅ Formulario limpiado, código de barras mantenido:', codigoBarrasActual);
};
// ==========================================
// MOSTRAR MENSAJE
// ==========================================
function mostrarMensajeRegistro(texto, tipo) {
  const msg = document.getElementById('mensaje');
  if (msg) {
    msg.textContent = texto;
    msg.className = `mensaje ${tipo}`;
    msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (tipo === 'exito') {
      setTimeout(() => { if (msg.classList.contains('exito')) msg.className = 'mensaje'; }, 8000);
    }
  }
}

// ==========================================
// CONFIRMACIÓN AL SALIR
// ==========================================
window.addEventListener('beforeunload', function(e) {
  if (formularioModificado && !equipoGuardadoExitosamente) {
    e.preventDefault();
    e.returnValue = '';
    return e.returnValue;
  }
});

// ==========================================
// PREPARAR NUEVO REGISTRO (Limpia y genera nuevo código)
// ==========================================
function prepararNuevoRegistro() {
  console.log('🧹 Preparando formulario para nuevo registro...');
  
  // 1. Eliminar el código guardado para que se genere uno nuevo
  localStorage.removeItem('codigoBarrasPendiente');
  sessionStorage.removeItem('codigoBarrasPendiente');
  
  // 2. Limpiar campos de texto
  document.getElementById('formRegistro').reset();
  
  // 3. Limpiar fotos
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

  // 4. Resetear estados
  formularioModificado = false;
  equipoGuardadoExitosamente = false;
  
  const mensajeDiv = document.getElementById('mensaje');
  if (mensajeDiv) mensajeDiv.className = 'mensaje';
  
  const btnGuardar = document.getElementById('btnGuardar');
  if (btnGuardar) {
    btnGuardar.disabled = false;
    btnGuardar.textContent = '💾 Guardar Equipo';
  }

  // 5. Generar nuevo código de barras
  generarCodigoBarras();
}
