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
let modalesCreados = false;

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarRegistroEquipo() {
  console.log('🚀 === INICIANDO REGISTRO DE EQUIPO ===');

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

  // ✅ CREAR MODALES DINÁMICAMENTE
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
// ✅ CREAR MODALES Y ESTILOS DINÁMICAMENTE
// ==========================================
function crearModalesYEstilos() {
  if (modalesCreados) return;

  // 1. Inyectar estilos CSS de los modales en el <head>
  if (!document.getElementById('estilos-modales-registro')) {
    const style = document.createElement('style');
    style.id = 'estilos-modales-registro';
    style.textContent = `
      /* ====== OVERLAY MODAL ====== */
      .modal-overlay-registro {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        z-index: 999999;
        justify-content: center;
        align-items: center;
        backdrop-filter: blur(4px);
      }
      .modal-overlay-registro.visible {
        display: flex !important;
      }

      /* ====== TARJETA MODAL ====== */
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

      /* ====== HEADER MODAL ====== */
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

      /* ====== BOTÓN CERRAR X ====== */
      .modal-cerrar-x {
        background: #fee2e2;
        color: #dc2626;
        border: none;
        width: 32px;
        height: 32px;
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

      /* ====== BOTONES DEL SELECTOR ====== */
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

      /* ====== VIDEO CÁMARA ====== */
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

      /* ====== BOTONES ACCIÓN CÁMARA ====== */
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

  // 2. Crear Modal Selector de Foto
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

  // 3. Crear Modal Cámara
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

  modalesCreados = true;
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
// GENERAR CÓDIGO DE BARRAS
// ==========================================
async function generarCodigoBarras() {
  try {
    console.log('🔖 Generando código de barras...');
    let nuevoCodigo, existe = true, intentos = 0;

    while (existe && intentos < 10) {
      const ahora = new Date();
      const fecha = ahora.toISOString().slice(0, 10).replace(/-/g, '');
      const hora = ahora.toTimeString().slice(0, 8).replace(/:/g, '');
      const rand = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
      nuevoCodigo = `EP-${fecha}-${hora}-${rand}`;

      const { data, error } = await supabaseClient
        .from('equipos')
        .select('codigo_barras')
        .eq('codigo_barras', nuevoCodigo)
        .maybeSingle();

      if (error || !data) existe = false;
      else intentos++;
    }

    if (existe) throw new Error('No se pudo generar código único');

    codigoBarrasActual = nuevoCodigo;
    const el = document.getElementById('codigoBarrasValor');
    if (el) el.textContent = codigoBarrasActual;

    try {
      JsBarcode("#barcode", codigoBarrasActual, {
        format: "CODE128", width: 2, height: 60,
        displayValue: true, fontSize: 14, margin: 5,
        font: "Courier New", fontOptions: "bold"
      });
    } catch (e) { console.error('❌ Error renderizando código:', e); }

    const btn = document.getElementById('btnImprimir');
    if (btn) btn.disabled = false;
    console.log('✅ Código generado:', codigoBarrasActual);
  } catch (err) {
    console.error('❌ Error:', err);
    const el = document.getElementById('codigoBarrasValor');
    if (el) el.textContent = 'Error';
    mostrarMensajeRegistro('Error al generar código: ' + err.message, 'error');
  }
}

// ==========================================
// SELECTOR DE FOTO (usando nuevos IDs)
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

// ==========================================
// SELECCIONAR ARCHIVO (AGREGAR DESPUÉS DE cerrarSelectorFoto)
// ==========================================
window.seleccionarArchivo = function() {
  const numero = fotoSeleccionadaActual; // Guardar ANTES de cerrar
  cerrarSelectorFoto();
  if (numero) {
    const input = document.getElementById(`foto${numero}`);
    if (input) {
      console.log('📁 Abriendo selector de archivos para foto:', numero);
      input.click();
    } else {
      console.error('❌ Input de foto no encontrado:', `foto${numero}`);
    }
  }
};

// ==========================================
// SELECCIONAR CÁMARA (AGREGAR DESPUÉS DE seleccionarArchivo)
// ==========================================
window.seleccionarCamara = function() {
  const numero = fotoSeleccionadaActual; // Guardar ANTES de cerrar
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
// ABRIR CÁMARA (usando nuevos IDs)
// ==========================================
window.abrirCamara = async function(numero) {
  console.log('📷 Abriendo cámara para foto:', numero);
  fotoSeleccionadaActual = numero;

  const modal = document.getElementById('modalCamaraRegistro');
  const video = document.getElementById('videoCamaraRegistro');

  if (!modal) {
    console.error('❌ Modal de cámara no encontrado');
    mostrarMensajeRegistro('Error: Modal de cámara no encontrado', 'error');
    return;
  }

  if (!video) {
    console.error('❌ Elemento video no encontrado');
    mostrarMensajeRegistro('Error: Elemento de video no encontrado', 'error');
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
    
    // Esperar a que el video esté listo
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
      mostrarMensajeRegistro('⚠️ Permiso de cámara denegado. Permite el acceso en la configuración del navegador.', 'error');
    } else if (err.name === 'NotFoundError') {
      mostrarMensajeRegistro('⚠️ No se encontró ninguna cámara en el dispositivo.', 'error');
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
// CAPTURAR FOTO (usando nuevos IDs)
// ==========================================
// ==========================================
// CAPTURAR FOTO (CORREGIDA)
// ==========================================
window.capturarFoto = function() {
  const video = document.getElementById('videoCamara');
  const canvas = document.getElementById('canvasCamara');
  
  if (!video || !canvas) {
    console.error('❌ Video o canvas no encontrado');
    return;
  }
  
  if (!video.videoWidth || !video.videoHeight) {
    console.error('❌ Video no está listo');
    alert('La cámara aún no está lista. Espera un momento.');
    return;
  }
  
  console.log('📸 Capturando foto...');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // ✅ GUARDAR el número ANTES de cualquier operación asíncrona
  const numeroFoto = fotoSeleccionadaActual;
  
  canvas.toBlob(function(blob) {
    if (!blob) {
      console.error('❌ No se pudo crear el blob');
      alert('Error al capturar la foto');
      return;
    }
    
    const file = new File([blob], `foto_${numeroFoto}_${Date.now()}.jpg`, {
      type: 'image/jpeg'
    });
    
    console.log('✅ Foto capturada, tamaño:', file.size, 'bytes');
    console.log('📝 Guardando en posición:', numeroFoto - 1);
    
    // Guardar en el array
    fotosSeleccionadas[numeroFoto - 1] = file;
    
    // Previsualizar la foto
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
      } else {
        console.error('❌ Elemento preview no encontrado:', `preview${numeroFoto}`);
      }
      
      if (placeholder) placeholder.style.display = 'none';
      if (removeBtn) removeBtn.style.display = 'flex';
      if (previewBox) {
        previewBox.onclick = null;
        previewBox.style.cursor = 'default';
      }
    };
    
    reader.onerror = function() {
      console.error('❌ Error al leer el archivo');
      alert('Error al procesar la foto capturada');
    };
    
    reader.readAsDataURL(file);
    
    // Cerrar la cámara DESPUÉS de iniciar la lectura
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
  const nombre = document.getElementById('nombreEquipo').value.trim();
  const marca = document.getElementById('marcaEquipo').value.trim();
  const modelo = document.getElementById('modeloEquipo').value.trim();
  const serial = document.getElementById('serialEquipo').value.trim();
  const medidaValor = document.getElementById('medidaValor').value;
  const medidaUnidad = document.getElementById('medidaUnidad').value;
  const costo = document.getElementById('costoEquipo').value;
  const observacion = document.getElementById('observacionEquipo').value.trim();
  const estatus = document.getElementById('estatusEquipo').value;

  if (!nombre || !marca || !serial || !estatus) {
    mostrarMensajeRegistro('Completa todos los campos obligatorios (*)', 'error');
    return;
  }
  if (!validarCosto(costo)) {
    mostrarMensajeRegistro('El costo debe ser un número válido', 'error');
    return;
  }
  if (!codigoBarrasActual) {
    mostrarMensajeRegistro('No hay código de barras generado', 'error');
    return;
  }
  if (!fotosSeleccionadas[0]) {
    mostrarMensajeRegistro('La Foto Principal es obligatoria', 'error');
    return;
  }

  const serialExiste = await verificarSerial(serial);
  if (serialExiste) {
    mostrarMensajeRegistro('⚠️ El serial ya está registrado', 'error');
    return;
  }

  const btnGuardar = document.getElementById('btnGuardar');
  btnGuardar.disabled = true;
  btnGuardar.textContent = '💾 Guardando...';

  try {
    let fotoUrls = [null, null, null, null];
    for (let i = 0; i < 4; i++) {
      if (fotosSeleccionadas[i]) {
        const ext = fotosSeleccionadas[i].name.split('.').pop().toLowerCase();
        const fn = `${codigoBarrasActual}_foto${i+1}_${Date.now()}.${ext}`;

        const { error: upErr } = await supabaseClient.storage
          .from('equipos-fotos').upload(fn, fotosSeleccionadas[i], { cacheControl: '3600', upsert: false });
        if (upErr) throw new Error(`Error subiendo foto ${i+1}: ${upErr.message}`);

        const { data: urlData } = supabaseClient.storage.from('equipos-fotos').getPublicUrl(fn);
        fotoUrls[i] = urlData.publicUrl;
      }
    }

    const { data, error } = await supabaseClient.from('equipos').insert({
      codigo_barras: codigoBarrasActual, nombre_equipo: nombre, marca: marca,
      modelo: modelo || null, serial: serial,
      medida_valor: parseFloat(medidaValor) || 0, medida_unidad: medidaUnidad,
      costo: parseFloat(costo), observacion: observacion || null, estatus: estatus,
      foto_url: fotoUrls[0], foto2_url: fotoUrls[1], foto3_url: fotoUrls[2], foto4_url: fotoUrls[3],
      usuario_registro: usuarioActual?.email || 'unknown',
      usuario_registro_id: usuarioActual?.id || null
    }).select().single();

    if (error) {
      if (error.code === '23505') throw new Error('El serial ya existe');
      throw error;
    }

    equipoGuardadoExitosamente = true;
    formularioModificado = false;
    mostrarMensajeRegistro(`✅ Equipo registrado: ${codigoBarrasActual}`, 'exito');

    if (typeof registrarLog === 'function') {
      await registrarLog('inventario', 'registrar_equipo', `Registró "${nombre}" - ${codigoBarrasActual}`, 'success');
    }

    btnGuardar.textContent = '✅ Guardado';
    const btnImp = document.getElementById('btnImprimir');
    if (btnImp) btnImp.disabled = false;

    setTimeout(() => {
      if (confirm('✅ Equipo guardado.\n\n¿Imprimir sticker?')) imprimirSticker();
    }, 500);

  } catch (err) {
    console.error('❌ Error:', err);
    mostrarMensajeRegistro('❌ Error: ' + err.message, 'error');
    btnGuardar.disabled = false;
    btnGuardar.textContent = '💾 Guardar Equipo';
    if (typeof registrarLog === 'function') {
      await registrarLog('inventario', 'registrar_equipo_error', err.message, 'error');
    }
  }
};

// ==========================================
// IMPRIMIR STICKER
// ==========================================
window.imprimirSticker = function() {
  if (!codigoBarrasActual) return;

  const nombre = document.getElementById('nombreEquipo')?.value.trim() || '';
  const marca = document.getElementById('marcaEquipo')?.value.trim() || '';
  const modelo = document.getElementById('modeloEquipo')?.value.trim() || '';
  const serial = document.getElementById('serialEquipo')?.value.trim() || '';

  const temp = document.createElement('div');
  temp.innerHTML = '<svg id="stickerBC"></svg>';
  document.body.appendChild(temp);

  try {
    JsBarcode("#stickerBC", codigoBarrasActual, {
      format: "CODE128", width: 1.5, height: 40,
      displayValue: true, fontSize: 12, margin: 2, font: "Courier New"
    });
    const svg = temp.querySelector('svg').outerHTML;
    document.body.removeChild(temp);

    const v = window.open('', '_blank', 'width=600,height=500');
    if (!v) { mostrarMensajeRegistro('Permite ventanas emergentes', 'error'); return; }

    v.document.write(`<!DOCTYPE html><html><head><style>
@page{size:4in 2.5in;margin:.1in}*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;padding:5px}
.s{border:2px solid #000;padding:8px;text-align:center}
.e{font-size:10px;font-weight:bold;color:#1e3a8a;margin-bottom:4px}
.n{font-size:11px;font-weight:bold;margin:4px 0}
.b{margin:6px 0}.b svg{max-width:100%;height:auto}
.i{font-size:8px;color:#333;margin-top:4px}
.c{font-size:10px;font-weight:bold;margin-top:4px;font-family:monospace}
</style></head><body><div class="s">
<div class="e">Eventos D' Primera</div>
${nombre?`<div class="n">${nombre}</div>`:''}
<div class="b">${svg}</div><div class="c">${codigoBarrasActual}</div>
<div class="i">${marca}${modelo?' - '+modelo:''}<br>${serial?'S/N: '+serial:''}</div>
</div><script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>`);
    v.document.close();
  } catch (err) {
    console.error('❌ Error sticker:', err);
    if (document.body.contains(temp)) document.body.removeChild(temp);
  }
};

// ==========================================
// LIMPIAR FORMULARIO
// ==========================================
window.limpiarFormulario = function() {
  if (formularioModificado && !equipoGuardadoExitosamente) {
    if (!confirm('⚠️ Hay datos sin guardar. ¿Limpiar?')) return;
  }

  document.getElementById('formRegistro').reset();
  for (let i = 1; i <= 4; i++) {
    fotosSeleccionadas[i-1] = null;
    const p = document.getElementById(`preview${i}`);
    const ph = document.getElementById(`preview${i}-placeholder`);
    const r = document.getElementById(`remove${i}`);
    const inp = document.getElementById(`foto${i}`);
    const box = document.getElementById(`previewBox${i}`);
    if (p) { p.style.display = 'none'; p.src = ''; }
    if (ph) ph.style.display = 'block';
    if (r) r.style.display = 'none';
    if (inp) inp.value = '';
    if (box) { box.onclick = function(){ abrirSelectorFoto(i); }; box.style.cursor = 'pointer'; }
  }

  formularioModificado = false;
  equipoGuardadoExitosamente = false;
  const msg = document.getElementById('mensaje');
  if (msg) msg.className = 'mensaje';
  const btn = document.getElementById('btnGuardar');
  if (btn) { btn.disabled = false; btn.textContent = '💾 Guardar Equipo'; }
  generarCodigoBarras();
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
