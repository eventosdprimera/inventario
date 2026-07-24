// ==========================================
// INYECTAR ESTILOS INMEDIATAMENTE
// ==========================================
function inyectarEstilosCrearUsuario() {
  if (document.getElementById('estilos-crear-usuario')) return;
  
  const style = document.createElement('style');
  style.id = 'estilos-crear-usuario';
  style.textContent = `
    /* Ocultar contenido hasta que los estilos estén listos */
    .crear-usuario-container { opacity: 0; transition: opacity 0.3s ease; }
    .crear-usuario-container.loaded { opacity: 1; }
    
    .crear-usuario-container { max-width: 1000px; margin: 0 auto; padding: 30px; }
    .crear-usuario-header { text-align: center; margin-bottom: 35px; }
    .crear-usuario-title { font-family: 'Libre Caslon Text', serif; color: #1e3a8a; font-size: 32px; margin: 0; font-weight: 700; }
    .crear-usuario-subtitle { color: #6b7280; font-size: 15px; margin-top: 8px; }
    
    .crear-usuario-fieldset { border: 1px solid #d1d5db; border-radius: 10px; padding: 30px; margin-bottom: 25px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .crear-usuario-fieldset legend { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 10px 24px; border-radius: 20px; font-size: 15px; font-weight: 700; letter-spacing: 0.5px; }
    
    .crear-usuario-mensaje { padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; font-weight: 600; display: none; }
    .crear-usuario-mensaje.exito { background: #d1fae5; color: #065f46; border-left: 4px solid #10b981; display: block; }
    .crear-usuario-mensaje.error { background: #fee2e2; color: #991b1b; border-left: 4px solid #ef4444; display: block; }
    
    /* SECCIÓN DE FOTO - ESTILOS CRÍTICOS */
    .foto-section-usuario {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 35px;
      padding: 30px;
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border-radius: 12px;
      border: 2px dashed #d1d5db;
    }
    
    .foto-recuadro-usuario {
      width: 200px;
      height: 200px;
      border-radius: 12px;
      border: 3px dashed #1e3a8a;
      background: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s;
      overflow: hidden;
      position: relative;
      box-shadow: 0 4px 12px rgba(30, 58, 138, 0.1);
    }
    
    .foto-recuadro-usuario:hover {
      background: #eff6ff;
      border-color: #3b82f6;
      transform: scale(1.03);
      box-shadow: 0 6px 16px rgba(30, 58, 138, 0.2);
    }
    
    .foto-recuadro-usuario img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .foto-placeholder-usuario {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #9ca3af;
    }
    
    .foto-placeholder-icon-usuario {
      font-size: 64px;
      margin-bottom: 10px;
    }
    
    .foto-placeholder-text-usuario {
      font-size: 14px;
      font-weight: 600;
    }
    
    .foto-botones-usuario {
      display: flex;
      gap: 15px;
      margin-top: 20px;
      flex-wrap: wrap;
      justify-content: center;
    }
    
    /* BOTONES - ESTILOS CRÍTICOS INMEDIATOS */
    .foto-btn-usuario,
    .btn-action-usuario {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      font-family: 'Poppins', sans-serif;
      transition: all 0.3s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      /* Evitar flash: aplicar colores inmediatamente */
      background: #6b7280;
      color: white;
    }
    
    .foto-btn-subir-usuario,
    .btn-secondary-usuario {
      background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
      color: white;
    }
    
    .foto-btn-subir-usuario:hover,
    .btn-secondary-usuario:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3); 
    }
    
    .foto-btn-camara-usuario {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
    }
    
    .foto-btn-camara-usuario:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3); 
    }
    
    .foto-btn-eliminar-usuario {
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      color: white;
    }
    
    .foto-btn-eliminar-usuario:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); 
    }
    
    .btn-success-usuario { 
      background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
      color: white; 
    }
    .btn-success-usuario:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 6px 15px rgba(16, 185, 129, 0.3); 
    }
    
    /* FORMULARIO */
    .form-grid-usuario {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    
    .form-group-usuario {
      display: flex;
      flex-direction: column;
    }
    
    .form-group-usuario.full-width {
      grid-column: 1 / -1;
    }
    
    .form-group-usuario label {
      font-size: 13px;
      font-weight: 700;
      color: #374151;
      margin-bottom: 8px;
    }
    
    .form-group-usuario input,
    .form-group-usuario select {
      padding: 12px 14px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      font-family: 'Poppins', sans-serif;
      transition: all 0.3s;
      background: white;
    }
    
    .form-group-usuario input:focus,
    .form-group-usuario select:focus {
      outline: none;
      border-color: #1e3a8a;
      box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
    }
    
    .required { color: #ef4444; }
    
    /* BARRA DE FORTALEZA */
    .password-strength-container {
      margin-top: 10px;
    }
    
    .password-strength-bar-container {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 6px;
    }
    
    .password-strength-bar {
      height: 100%;
      width: 0%;
      transition: all 0.3s;
      border-radius: 4px;
    }
    
    .password-strength-text {
      font-size: 12px;
      font-weight: 600;
    }
    
    .strength-weak { background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%); width: 33%; }
    .strength-medium { background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%); width: 66%; }
    .strength-strong { background: linear-gradient(90deg, #10b981 0%, #059669 100%); width: 100%; }
    
    /* BOTONES DE ACCIÓN */
    .button-group-usuario {
      display: flex;
      gap: 15px;
      margin-top: 30px;
      justify-content: flex-end;
      padding-top: 25px;
      border-top: 2px solid #e5e7eb;
    }
    
    /* MODAL CÁMARA */
    .modal-camara-usuario {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.9);
      z-index: 999999;
      align-items: center;
      justify-content: center;
    }
    
    .modal-camara-content-usuario {
      background: white;
      padding: 30px;
      border-radius: 16px;
      max-width: 90%;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    }
    
    .modal-camara-content-usuario video {
      width: 100%;
      max-width: 500px;
      border-radius: 8px;
      background: #000;
    }
    
    @media (max-width: 768px) {
      .form-grid-usuario { grid-template-columns: 1fr; }
      .foto-recuadro-usuario { width: 180px; height: 180px; }
    }
  `;
  document.head.appendChild(style);
}

// ==========================================
// VARIABLES GLOBALES
// ==========================================
let fotoSeleccionada = null;
let usuarioActualCreador = null;
let streamCamara = null;

// ==========================================
// INICIALIZACIÓN (OPTIMIZADA - SIN FLASH)
// ==========================================
async function inicializarCrearUsuario() {
  console.log('👤 Inicializando módulo de crear usuario...');
  
  // ✅ 1. Inyectar estilos PRIMERO (antes de cualquier otra cosa)
  inyectarEstilosCrearUsuario();
  
  // ✅ 2. Esperar un frame para asegurar que los estilos se apliquen
  await new Promise(resolve => requestAnimationFrame(resolve));
  
  // ✅ 3. Ahora sí, esperar a que Supabase esté disponible
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }
  
  if (typeof supabaseClient === 'undefined') {
    mostrarMensajeUsuario('❌ Error: Supabase no está disponible', 'error');
    return;
  }

  // ✅ 4. Obtener usuario actual
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      const { data } = await supabaseClient
        .from('usuarios')
        .select('*')
        .eq('email', session.user.email)
        .maybeSingle();
      
      usuarioActualCreador = data || { 
        email: session.user.email, 
        id: session.user.id 
      };
    }
  } catch (err) {
    console.error('Error al cargar usuario actual:', err);
  }

  // ✅ 5. Mostrar el contenido con fade-in
  const container = document.querySelector('.crear-usuario-container');
  if (container) {
    container.classList.add('loaded');
  }

  console.log('✅ Módulo de crear usuario inicializado');
}

// ==========================================
// MANEJO DE FOTO
// ==========================================
function previsualizarFotoUsuario(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    mostrarMensajeUsuario('️ Por favor seleccione un archivo de imagen válido', 'error');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    mostrarMensajeUsuario('⚠️ La imagen no debe superar los 5MB', 'error');
    return;
  }

  fotoSeleccionada = file;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const imgPreview = document.getElementById('fotoPreviewUsuario');
    const placeholder = document.getElementById('fotoPlaceholderUsuario');
    const btnEliminar = document.getElementById('btnEliminarFotoUsuario');
    
    imgPreview.src = e.target.result;
    imgPreview.style.display = 'block';
    placeholder.style.display = 'none';
    btnEliminar.style.display = 'inline-flex';
  };
  
  reader.readAsDataURL(file);
}

function eliminarFotoUsuario() {
  fotoSeleccionada = null;
  
  const imgPreview = document.getElementById('fotoPreviewUsuario');
  const placeholder = document.getElementById('fotoPlaceholderUsuario');
  const btnEliminar = document.getElementById('btnEliminarFotoUsuario');
  const inputFoto = document.getElementById('inputFotoUsuario');
  
  imgPreview.src = '';
  imgPreview.style.display = 'none';
  placeholder.style.display = 'flex';
  btnEliminar.style.display = 'none';
  inputFoto.value = '';
}

// ==========================================
// CÁMARA
// ==========================================
async function abrirCamaraUsuario() {
  const modal = document.getElementById('modalCamaraUsuario');
  const video = document.getElementById('videoCamaraUsuario');
  
  if (!modal || !video) {
    mostrarMensajeUsuario('️ Error: No se encontró el modal de cámara', 'error');
    return;
  }

  try {
    streamCamara = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      }, 
      audio: false 
    });
    
    video.srcObject = streamCamara;
    modal.style.display = 'flex';
  } catch (err) {
    console.error('Error al acceder a la cámara:', err);
    mostrarMensajeUsuario('️ No se pudo acceder a la cámara. Verifique los permisos.', 'error');
  }
}

function capturarFotoCamaraUsuario() {
  const video = document.getElementById('videoCamaraUsuario');
  const canvas = document.getElementById('canvasCamaraUsuario');
  
  if (!video || !canvas) {
    mostrarMensajeUsuario('️ Error: No se encontró el video o canvas', 'error');
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  
  canvas.toBlob(async (blob) => {
    if (!blob) {
      mostrarMensajeUsuario(' Error al capturar la foto', 'error');
      return;
    }
    
    const file = new File([blob], `foto_perfil_${Date.now()}.jpg`, { 
      type: 'image/jpeg' 
    });
    
    fotoSeleccionada = file;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const imgPreview = document.getElementById('fotoPreviewUsuario');
      const placeholder = document.getElementById('fotoPlaceholderUsuario');
      const btnEliminar = document.getElementById('btnEliminarFotoUsuario');
      
      imgPreview.src = e.target.result;
      imgPreview.style.display = 'block';
      placeholder.style.display = 'none';
      btnEliminar.style.display = 'inline-flex';
    };
    
    reader.readAsDataURL(file);
    
    cerrarCamaraUsuario();
    mostrarMensajeUsuario('✅ Foto capturada exitosamente', 'exito');
  }, 'image/jpeg', 0.9);
}

function cerrarCamaraUsuario() {
  const modal = document.getElementById('modalCamaraUsuario');
  if (modal) modal.style.display = 'none';
  
  if (streamCamara) {
    streamCamara.getTracks().forEach(track => track.stop());
    streamCamara = null;
  }
}

// ==========================================
// VERIFICAR FORTALEZA DE CONTRASEÑA
// ==========================================
function verificarFortalezaPasswordUsuario() {
  const password = document.getElementById('usuarioPassword').value;
  const bar = document.getElementById('passwordStrengthBarUsuario');
  const text = document.getElementById('passwordStrengthTextUsuario');
  
  if (!bar || !text) return;
  
  if (password.length === 0) {
    bar.className = 'password-strength-bar';
    text.textContent = '';
    return;
  }
  
  let strength = 0;
  
  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  if (strength <= 2) {
    bar.className = 'password-strength-bar strength-weak';
    text.textContent = ' Contraseña débil';
    text.style.color = '#ef4444';
  } else if (strength <= 4) {
    bar.className = 'password-strength-bar strength-medium';
    text.textContent = '🟡 Contraseña moderada';
    text.style.color = '#f59e0b';
  } else {
    bar.className = 'password-strength-bar strength-strong';
    text.textContent = '🟢 Contraseña fuerte';
    text.style.color = '#10b981';
  }
}

// ==========================================
// CREAR USUARIO
// ==========================================
async function crearUsuario() {
  console.log('💾 Iniciando creación de usuario...');
  
  const nombre = document.getElementById('usuarioNombre').value.trim();
  const apellido = document.getElementById('usuarioApellido').value.trim();
  const cedula = document.getElementById('usuarioCedula').value.trim();
  const email = document.getElementById('usuarioEmail').value.trim().toLowerCase();
  const password = document.getElementById('usuarioPassword').value;
  const passwordConfirm = document.getElementById('usuarioPasswordConfirm').value;
  const rol = document.getElementById('usuarioRol').value;

  // Validaciones
  if (!nombre || !apellido || !cedula || !email || !password || !rol) {
    mostrarMensajeUsuario('⚠️ Por favor complete todos los campos obligatorios', 'error');
    return;
  }
  
  if (!email.includes('@')) {
    mostrarMensajeUsuario('️ El correo electrónico debe contener "@"', 'error');
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    mostrarMensajeUsuario('⚠️ Por favor ingrese un correo electrónico válido', 'error');
    return;
  }
  
  if (password.length < 6) {
    mostrarMensajeUsuario('️ La contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }
  
  if (password !== passwordConfirm) {
    mostrarMensajeUsuario('⚠️ Las contraseñas no coinciden', 'error');
    return;
  }

  const btnCrear = document.getElementById('btnCrearUsuario');
  btnCrear.disabled = true;
  btnCrear.textContent = '⏳ Creando usuario...';

  try {
    let fotoUrl = null;

    if (fotoSeleccionada) {
      const fileName = `avatars/${Date.now()}_${fotoSeleccionada.name}`;
      const { error: uploadError } = await supabaseClient.storage
        .from('avatars')
        .upload(fileName, fotoSeleccionada);
      
      if (uploadError) throw new Error(`Error al subir foto: ${uploadError.message}`);
      
      const { data: urlData } = supabaseClient.storage.from('avatars').getPublicUrl(fileName);
      fotoUrl = urlData.publicUrl;
    }

    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          nombre: `${nombre} ${apellido}`,
          apellido: apellido,
          cedula: cedula,
          rol: rol
        }
      }
    });

    if (authError) {
      if (authError.message.includes('User already registered')) {
        throw new Error('Este correo electrónico ya está registrado');
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario de autenticación');
    }

    const { error: dbError } = await supabaseClient
      .from('usuarios')
      .insert({
        id: authData.user.id,
        email: email,
        nombre: `${nombre} ${apellido}`,
        apellido: apellido,
        cedula: cedula,
        rol: rol,
        foto_url: fotoUrl,
        fecha_creacion: new Date().toISOString()
      });

    if (dbError) {
      throw new Error(`Usuario creado en Auth, pero falló en la base de datos: ${dbError.message}`);
    }

    if (typeof registrarLog === 'function') {
      const descripcion = `Nuevo usuario creado: ${nombre} ${apellido} (C.I: ${cedula}, Email: ${email}) con rol: ${rol.toUpperCase()}. Creado por: ${usuarioActualCreador?.email || 'Sistema'}`;
      await registrarLog('usuarios', 'Usuario creado', descripcion, 'success');
    }

    mostrarMensajeUsuario(`✅ Usuario "${nombre} ${apellido}" creado exitosamente`, 'exito');
    
    setTimeout(() => {
      limpiarFormularioUsuario();
    }, 2000);

  } catch (err) {
    console.error('❌ Error al crear usuario:', err);
    mostrarMensajeUsuario(`❌ Error: ${err.message}`, 'error');
  } finally {
    const btn = document.getElementById('btnCrearUsuario');
    btn.disabled = false;
    btn.textContent = '💾 Crear Usuario';
  }
}

// ==========================================
// UTILIDADES
// ==========================================
function mostrarMensajeUsuario(texto, tipo) {
  const msg = document.getElementById('mensajeUsuario');
  if (!msg) return;
  
  msg.textContent = texto;
  msg.className = `crear-usuario-mensaje ${tipo}`;
  
  setTimeout(() => { 
    msg.className = 'crear-usuario-mensaje'; 
  }, 5000);
}

function limpiarFormularioUsuario() {
  document.getElementById('usuarioNombre').value = '';
  document.getElementById('usuarioApellido').value = '';
  document.getElementById('usuarioCedula').value = '';
  document.getElementById('usuarioEmail').value = '';
  document.getElementById('usuarioPassword').value = '';
  document.getElementById('usuarioPasswordConfirm').value = '';
  document.getElementById('usuarioRol').value = 'consultor';
  
  eliminarFotoUsuario();
  
  const bar = document.getElementById('passwordStrengthBarUsuario');
  const text = document.getElementById('passwordStrengthTextUsuario');
  if (bar) bar.className = 'password-strength-bar';
  if (text) text.textContent = '';
  
  document.getElementById('usuarioNombre').focus();
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log(' DOM cargado - Iniciando módulo de crear usuario');
  inicializarCrearUsuario();
});
