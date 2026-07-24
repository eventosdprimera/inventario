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
  console.log('👤 Inicializando módulo de crear usuario...');
  
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }
  
  if (typeof supabaseClient === 'undefined') {
    mostrarMensajeUsuario('❌ Error: Supabase no está disponible', 'error');
    return;
  }

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

  console.log('✅ Módulo de crear usuario inicializado');
}

// ==========================================
// MANEJO DE FOTO
// ==========================================
function previsualizarFotoUsuario(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    mostrarMensajeUsuario('⚠️ Por favor seleccione un archivo de imagen válido', 'error');
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
    mostrarMensajeUsuario('⚠️ Error: No se encontró el modal de cámara', 'error');
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
    mostrarMensajeUsuario('⚠️ No se pudo acceder a la cámara. Verifique los permisos.', 'error');
  }
}

function capturarFotoCamaraUsuario() {
  const video = document.getElementById('videoCamaraUsuario');
  const canvas = document.getElementById('canvasCamaraUsuario');
  
  if (!video || !canvas) {
    mostrarMensajeUsuario('⚠️ Error: No se encontró el video o canvas', 'error');
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  
  canvas.toBlob(async (blob) => {
    if (!blob) {
      mostrarMensajeUsuario('❌ Error al capturar la foto', 'error');
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
    text.textContent = '🔴 Contraseña débil';
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

  if (!nombre || !apellido || !cedula || !email || !password || !rol) {
    mostrarMensajeUsuario('⚠️ Por favor complete todos los campos obligatorios', 'error');
    return;
  }
  
  if (!email.includes('@')) {
    mostrarMensajeUsuario('⚠️ El correo electrónico debe contener "@"', 'error');
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    mostrarMensajeUsuario('⚠️ Por favor ingrese un correo electrónico válido', 'error');
    return;
  }
  
  if (password.length < 6) {
    mostrarMensajeUsuario('⚠️ La contraseña debe tener al menos 6 caracteres', 'error');
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
  console.log('📄 DOM cargado - Iniciando módulo de crear usuario');
  inicializarCrearUsuario();
});
