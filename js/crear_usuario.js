// ==========================================
// VARIABLES GLOBALES
// ==========================================
let fotoSeleccionada = null;
let usuarioActualCreador = null;
let streamCamara = null;

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarCrearUsuario() {
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }
  if (typeof supabaseClient === 'undefined') {
    mostrarMensajeUsuario('Error: Supabase no está disponible', 'error');
    return;
  }
  
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    const { data } = await supabaseClient.from('usuarios').select('*').eq('email', session.user.email).maybeSingle();
    usuarioActualCreador = data || { email: session.user.email, id: session.user.id };
  }
}

// ==========================================
// PREVISUALIZAR FOTO
// ==========================================
function previsualizarFoto(event) {
  const file = event.target.files[0];
  if (file) {
    fotoSeleccionada = file;
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('fotoPreview').src = e.target.result;
      document.getElementById('fotoPreview').style.display = 'block';
      document.getElementById('fotoPlaceholder').style.display = 'none';
      document.getElementById('btnEliminarFoto').style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
  }
}

// ==========================================
// ELIMINAR FOTO
// ==========================================
function eliminarFoto() {
  fotoSeleccionada = null;
  document.getElementById('fotoPreview').src = '';
  document.getElementById('fotoPreview').style.display = 'none';
  document.getElementById('fotoPlaceholder').style.display = 'block';
  document.getElementById('btnEliminarFoto').style.display = 'none';
  document.getElementById('inputFoto').value = '';
}

// ==========================================
// ABRIR CÁMARA
// ==========================================
async function abrirCamara() {
  const modal = document.getElementById('modalCamara');
  const video = document.getElementById('videoCamara');
  
  try {
    streamCamara = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, 
      audio: false 
    });
    
    video.srcObject = streamCamara;
    modal.style.display = 'flex';
  } catch (err) {
    console.error('Error al acceder a la cámara:', err);
    mostrarMensajeUsuario('No se pudo acceder a la cámara. Verifique los permisos.', 'error');
  }
}

// ==========================================
// CAPTURAR FOTO DE CÁMARA
// ==========================================
function capturarFotoCamara() {
  const video = document.getElementById('videoCamara');
  const canvas = document.getElementById('canvasCamara');
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  
  canvas.toBlob(async (blob) => {
    if (!blob) {
      mostrarMensajeUsuario('Error al capturar la foto', 'error');
      return;
    }
    
    // Crear archivo desde el blob
    const file = new File([blob], `foto_perfil_${Date.now()}.jpg`, { type: 'image/jpeg' });
    fotoSeleccionada = file;
    
    // Mostrar preview
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('fotoPreview').src = e.target.result;
      document.getElementById('fotoPreview').style.display = 'block';
      document.getElementById('fotoPlaceholder').style.display = 'none';
      document.getElementById('btnEliminarFoto').style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
    
    cerrarCamara();
    mostrarMensajeUsuario('✅ Foto capturada exitosamente', 'exito');
  }, 'image/jpeg', 0.9);
}

// ==========================================
// CERRAR CÁMARA
// ==========================================
function cerrarCamara() {
  const modal = document.getElementById('modalCamara');
  modal.style.display = 'none';
  
  if (streamCamara) {
    streamCamara.getTracks().forEach(track => track.stop());
    streamCamara = null;
  }
}

// ==========================================
// TOGGLE PASSWORD (MOSTRAR/OCULTAR)
// ==========================================
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
}

// ==========================================
// VERIFICAR FORTALEZA DE CONTRASEÑA
// ==========================================
function verificarFortalezaPassword() {
  const password = document.getElementById('usuarioPassword').value;
  const bar = document.getElementById('passwordStrengthBar');
  const text = document.getElementById('passwordStrengthText');
  
  if (password.length === 0) {
    bar.className = 'password-strength-bar';
    text.textContent = '';
    return;
  }
  
  let strength = 0;
  
  // Longitud
  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  
  // Complejidad
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  // Determinar nivel
  if (strength <= 2) {
    bar.className = 'password-strength-bar strength-weak';
    text.textContent = '🔴 Contraseña débil';
    text.style.color = '#ef4444';
  } else if (strength <= 4) {
    bar.className = 'password-strength-bar strength-medium';
    text.textContent = ' Contraseña moderada';
    text.style.color = '#f59e0b';
  } else {
    bar.className = 'password-strength-bar strength-strong';
    text.textContent = '🟢 Contraseña fuerte';
    text.style.color = '#10b981';
  }
}

// ==========================================
// CREAR USUARIO (AUTH + DB + LOGS)
// ==========================================
async function crearUsuario() {
  const nombre = document.getElementById('usuarioNombre').value.trim();
  const apellido = document.getElementById('usuarioApellido').value.trim();
  const cedula = document.getElementById('usuarioCedula').value.trim();
  const email = document.getElementById('usuarioEmail').value.trim().toLowerCase();
  const password = document.getElementById('usuarioPassword').value;
  const passwordConfirm = document.getElementById('usuarioPasswordConfirm').value;
  const rol = document.getElementById('usuarioRol').value;

  // Validaciones
  if (!nombre || !apellido || !cedula || !email || !password || !rol) {
    mostrarMensajeUsuario('Por favor complete todos los campos obligatorios', 'error');
    return;
  }
  
  // Validar email con @
  if (!email.includes('@')) {
    mostrarMensajeUsuario('El correo electrónico debe contener "@"', 'error');
    return;
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    mostrarMensajeUsuario('Por favor ingrese un correo electrónico válido (ej: usuario@dominio.com)', 'error');
    return;
  }
  
  // Validar contraseña
  if (password.length < 6) {
    mostrarMensajeUsuario('La contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }
  
  if (password !== passwordConfirm) {
    mostrarMensajeUsuario('Las contraseñas no coinciden', 'error');
    return;
  }

  const btnCrear = document.getElementById('btnCrearUsuario');
  btnCrear.disabled = true;
  btnCrear.textContent = '⏳ Creando usuario...';

  try {
    let fotoUrl = null;

    // 1. Subir foto si existe
    if (fotoSeleccionada) {
      const fileName = `avatars/${Date.now()}_${fotoSeleccionada.name}`;
      const { error: uploadError } = await supabaseClient.storage
        .from('avatars')
        .upload(fileName, fotoSeleccionada);
      
      if (uploadError) throw new Error(`Error al subir foto: ${uploadError.message}`);
      
      const { data: urlData } = supabaseClient.storage.from('avatars').getPublicUrl(fileName);
      fotoUrl = urlData.publicUrl;
    }

    // 2. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          nombre: nombre,
          apellido: apellido,
          cedula: cedula,
          rol: rol
        }
      }
    });

    if (authError) {
      if (authError.message.includes('User already registered')) {
        throw new Error('Este correo electrónico ya está registrado en el sistema');
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario de autenticación');
    }

    // 3. Insertar datos en la tabla 'usuarios' usando el ID de Auth
    const { error: dbError } = await supabaseClient.from('usuarios').insert({
      id: authData.user.id,
      email: email,
      nombre: nombre,
      apellido: apellido,
      cedula: cedula,
      rol: rol,
      foto_url: fotoUrl,
      fecha_creacion: new Date().toISOString()
    });

    if (dbError) {
      console.error('Error en DB, intentando limpiar Auth...', dbError);
      throw new Error(`Usuario creado en Auth, pero falló en la base de datos: ${dbError.message}`);
    }

    // 4. Registrar en Logs
    if (typeof registrarLog === 'function') {
      const descripcion = `Nuevo usuario creado: ${nombre} ${apellido} (C.I: ${cedula}, Email: ${email}) con rol: ${rol.toUpperCase()}. Creado por: ${usuarioActualCreador?.email || 'Sistema'}`;
      await registrarLog('usuarios', 'Usuario creado', descripcion, 'success');
    }

    mostrarMensajeUsuario(`✅ Usuario "${nombre} ${apellido}" creado exitosamente.`, 'exito');
    
    setTimeout(() => {
      limpiarFormularioUsuario();
    }, 2000);

  } catch (err) {
    console.error('Error al crear usuario:', err);
    mostrarMensajeUsuario('Error: ' + err.message, 'error');
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
  const msg = document.getElementById('mensaje');
  msg.textContent = texto;
  msg.className = `mensaje ${tipo}`;
  setTimeout(() => { msg.className = 'mensaje'; }, 5000);
}

function limpiarFormularioUsuario() {
  document.getElementById('usuarioNombre').value = '';
  document.getElementById('usuarioApellido').value = '';
  document.getElementById('usuarioCedula').value = '';
  document.getElementById('usuarioEmail').value = '';
  document.getElementById('usuarioPassword').value = '';
  document.getElementById('usuarioPasswordConfirm').value = '';
  document.getElementById('usuarioRol').value = 'consultor';
  
  // Resetear foto
  eliminarFoto();
  
  // Resetear password strength
  document.getElementById('passwordStrengthBar').className = 'password-strength-bar';
  document.getElementById('passwordStrengthText').textContent = '';
  
  document.getElementById('usuarioNombre').focus();
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  inicializarCrearUsuario();
});
