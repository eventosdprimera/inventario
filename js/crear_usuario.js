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
  
  // Esperar a que Supabase esté disponible
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }
  
  if (typeof supabaseClient === 'undefined') {
    mostrarMensajeUsuario(' Error: Supabase no está disponible', 'error');
    return;
  }

  // Obtener usuario actual (quien está creando el nuevo usuario)
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
// MANEJO DE FOTO DE PERFIL
// ==========================================

// Previsualizar foto seleccionada desde archivo
function previsualizarFoto(event) {
  const file = event.target.files[0];
  
  if (!file) return;
  
  // Validar que sea imagen
  if (!file.type.startsWith('image/')) {
    mostrarMensajeUsuario('️ Por favor seleccione un archivo de imagen válido', 'error');
    return;
  }

  // Validar tamaño (máximo 5MB)
  if (file.size > 5 * 1024 * 1024) {
    mostrarMensajeUsuario('⚠️ La imagen no debe superar los 5MB', 'error');
    return;
  }

  fotoSeleccionada = file;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const imgPreview = document.getElementById('fotoPreview');
    const placeholder = document.getElementById('fotoPlaceholder');
    const btnEliminar = document.getElementById('btnEliminarFoto');
    
    imgPreview.src = e.target.result;
    imgPreview.style.display = 'block';
    placeholder.style.display = 'none';
    btnEliminar.style.display = 'inline-block';
  };
  
  reader.readAsDataURL(file);
}

// Eliminar foto seleccionada
function eliminarFoto() {
  fotoSeleccionada = null;
  
  const imgPreview = document.getElementById('fotoPreview');
  const placeholder = document.getElementById('fotoPlaceholder');
  const btnEliminar = document.getElementById('btnEliminarFoto');
  const inputFoto = document.getElementById('inputFoto');
  
  imgPreview.src = '';
  imgPreview.style.display = 'none';
  placeholder.style.display = 'block';
  btnEliminar.style.display = 'none';
  inputFoto.value = '';
  
  console.log('️ Foto eliminada');
}

// ==========================================
// MANEJO DE CÁMARA
// ==========================================

// Abrir cámara para tomar foto
async function abrirCamara() {
  const modal = document.getElementById('modalCamara');
  const video = document.getElementById('videoCamara');
  
  if (!modal || !video) {
    mostrarMensajeUsuario('⚠️ Error: No se encontró el modal de cámara', 'error');
    return;
  }

  try {
    // Solicitar acceso a la cámara frontal
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
    
    console.log('📷 Cámara activada');
  } catch (err) {
    console.error('Error al acceder a la cámara:', err);
    
    let mensaje = 'No se pudo acceder a la cámara.';
    if (err.name === 'NotAllowedError') {
      mensaje = 'Permiso de cámara denegado. Por favor, habilite el permiso en su navegador.';
    } else if (err.name === 'NotFoundError') {
      mensaje = 'No se encontró ninguna cámara en su dispositivo.';
    }
    
    mostrarMensajeUsuario(`⚠️ ${mensaje}`, 'error');
  }
}

// Capturar foto desde la cámara
function capturarFotoCamara() {
  const video = document.getElementById('videoCamara');
  const canvas = document.getElementById('canvasCamara');
  
  if (!video || !canvas) {
    mostrarMensajeUsuario('⚠️ Error: No se encontró el video o canvas', 'error');
    return;
  }

  // Configurar canvas con las dimensiones del video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  
  // Convertir canvas a blob (imagen)
  canvas.toBlob(async (blob) => {
    if (!blob) {
      mostrarMensajeUsuario('❌ Error al capturar la foto', 'error');
      return;
    }
    
    // Crear archivo desde el blob
    const file = new File([blob], `foto_perfil_${Date.now()}.jpg`, { 
      type: 'image/jpeg' 
    });
    
    fotoSeleccionada = file;
    
    // Mostrar preview
    const reader = new FileReader();
    reader.onload = function(e) {
      const imgPreview = document.getElementById('fotoPreview');
      const placeholder = document.getElementById('fotoPlaceholder');
      const btnEliminar = document.getElementById('btnEliminarFoto');
      
      imgPreview.src = e.target.result;
      imgPreview.style.display = 'block';
      placeholder.style.display = 'none';
      btnEliminar.style.display = 'inline-block';
    };
    
    reader.readAsDataURL(file);
    
    // Cerrar modal de cámara
    cerrarCamara();
    
    mostrarMensajeUsuario('✅ Foto capturada exitosamente', 'exito');
  }, 'image/jpeg', 0.9);
}

// Cerrar modal de cámara
function cerrarCamara() {
  const modal = document.getElementById('modalCamara');
  
  if (modal) {
    modal.style.display = 'none';
  }
  
  // Detener todos los tracks de la cámara
  if (streamCamara) {
    streamCamara.getTracks().forEach(track => track.stop());
    streamCamara = null;
    console.log('📷 Cámara cerrada');
  }
}

// ==========================================
// MANEJO DE CONTRASEÑA
// ==========================================

// Mostrar/Ocultar contraseña
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  
  if (!input) return;
  
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
}

// Verificar fortaleza de contraseña en tiempo real
function verificarFortalezaPassword() {
  const password = document.getElementById('usuarioPassword').value;
  const bar = document.getElementById('passwordStrengthBar');
  const text = document.getElementById('passwordStrengthText');
  
  if (!bar || !text) return;
  
  // Si está vacía, resetear
  if (password.length === 0) {
    bar.className = 'password-strength-bar';
    text.textContent = '';
    return;
  }
  
  // Calcular puntuación de fortaleza
  let strength = 0;
  
  // Longitud
  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  
  // Complejidad
  if (/[a-z]/.test(password)) strength++;  // Minúsculas
  if (/[A-Z]/.test(password)) strength++;  // Mayúsculas
  if (/[0-9]/.test(password)) strength++;  // Números
  if (/[^a-zA-Z0-9]/.test(password)) strength++;  // Caracteres especiales
  
  // Determinar nivel y mostrar
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
// CREAR USUARIO (FUNCIÓN PRINCIPAL)
// ==========================================
async function crearUsuario() {
  console.log('💾 Iniciando creación de usuario...');
  
  // Obtener valores de los campos
  const nombre = document.getElementById('usuarioNombre').value.trim();
  const apellido = document.getElementById('usuarioApellido').value.trim();
  const cedula = document.getElementById('usuarioCedula').value.trim();
  const email = document.getElementById('usuarioEmail').value.trim().toLowerCase();
  const password = document.getElementById('usuarioPassword').value;
  const passwordConfirm = document.getElementById('usuarioPasswordConfirm').value;
  const rol = document.getElementById('usuarioRol').value;

  // ==========================================
  // VALIDACIONES
  // ==========================================
  
  // Campos obligatorios
  if (!nombre || !apellido || !cedula || !email || !password || !rol) {
    mostrarMensajeUsuario('⚠️ Por favor complete todos los campos obligatorios', 'error');
    return;
  }
  
  // Validar formato de email
  if (!email.includes('@')) {
    mostrarMensajeUsuario('️ El correo electrónico debe contener "@"', 'error');
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    mostrarMensajeUsuario('⚠️ Por favor ingrese un correo electrónico válido (ej: usuario@dominio.com)', 'error');
    return;
  }
  
  // Validar longitud de contraseña
  if (password.length < 6) {
    mostrarMensajeUsuario('⚠️ La contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }
  
  // Validar que las contraseñas coincidan
  if (password !== passwordConfirm) {
    mostrarMensajeUsuario('️ Las contraseñas no coinciden', 'error');
    return;
  }

  // ==========================================
  // PROCESO DE CREACIÓN
  // ==========================================
  
  const btnCrear = document.getElementById('btnCrearUsuario');
  btnCrear.disabled = true;
  btnCrear.textContent = '⏳ Creando usuario...';

  try {
    let fotoUrl = null;

    // 1. Subir foto de perfil si existe
    if (fotoSeleccionada) {
      console.log('📤 Subiendo foto de perfil...');
      
      const fileName = `avatars/${Date.now()}_${fotoSeleccionada.name}`;
      
      const { error: uploadError } = await supabaseClient.storage
        .from('avatars')
        .upload(fileName, fotoSeleccionada);
      
      if (uploadError) {
        throw new Error(`Error al subir foto: ${uploadError.message}`);
      }
      
      const { data: urlData } = supabaseClient.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      fotoUrl = urlData.publicUrl;
      console.log('✅ Foto subida:', fotoUrl);
    }

    // 2. Crear usuario en Supabase Auth
    console.log(' Creando usuario en Auth...');
    
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

    console.log('✅ Usuario creado en Auth:', authData.user.id);

    // 3. Insertar datos en la tabla 'usuarios'
    console.log('💾 Insertando datos en tabla usuarios...');
    
    const { error: dbError } = await supabaseClient
      .from('usuarios')
      .insert({
        id: authData.user.id,  // Vincular con el ID de Auth
        email: email,
        nombre: `${nombre} ${apellido}`,
        apellido: apellido,
        cedula: cedula,
        rol: rol,
        foto_url: fotoUrl,
        fecha_creacion: new Date().toISOString()
      });

    if (dbError) {
      console.error('❌ Error en DB:', dbError);
      throw new Error(`Usuario creado en Auth, pero falló en la base de datos: ${dbError.message}`);
    }

    console.log('✅ Usuario insertado en tabla usuarios');

    // 4. Registrar en Logs
    if (typeof registrarLog === 'function') {
      const descripcion = `Nuevo usuario creado: ${nombre} ${apellido} (C.I: ${cedula}, Email: ${email}) con rol: ${rol.toUpperCase()}. Creado por: ${usuarioActualCreador?.email || 'Sistema'}`;
      await registrarLog('usuarios', 'Usuario creado', descripcion, 'success');
      console.log('📝 Log registrado');
    }

    // 5. Mostrar mensaje de éxito
    mostrarMensajeUsuario(`✅ Usuario "${nombre} ${apellido}" creado exitosamente con rol: ${rol.toUpperCase()}`, 'exito');
    
    // 6. Limpiar formulario después de 2 segundos
    setTimeout(() => {
      limpiarFormularioUsuario();
    }, 2000);

  } catch (err) {
    console.error('❌ Error al crear usuario:', err);
    mostrarMensajeUsuario(`❌ Error: ${err.message}`, 'error');
  } finally {
    // Restaurar botón
    const btn = document.getElementById('btnCrearUsuario');
    btn.disabled = false;
    btn.textContent = '💾 Crear Usuario';
  }
}

// ==========================================
// FUNCIONES DE UTILIDAD
// ==========================================

// Mostrar mensaje al usuario
function mostrarMensajeUsuario(texto, tipo) {
  const msg = document.getElementById('mensaje');
  
  if (!msg) {
    console.error('No se encontró el elemento de mensaje');
    return;
  }
  
  msg.textContent = texto;
  msg.className = `mensaje ${tipo}`;
  
  // Auto-ocultar después de 5 segundos
  setTimeout(() => { 
    msg.className = 'mensaje'; 
  }, 5000);
}

// Limpiar formulario completo
function limpiarFormularioUsuario() {
  console.log('🔄 Limpiando formulario...');
  
  // Limpiar campos de texto
  document.getElementById('usuarioNombre').value = '';
  document.getElementById('usuarioApellido').value = '';
  document.getElementById('usuarioCedula').value = '';
  document.getElementById('usuarioEmail').value = '';
  document.getElementById('usuarioPassword').value = '';
  document.getElementById('usuarioPasswordConfirm').value = '';
  document.getElementById('usuarioRol').value = 'consultor';
  
  // Resetear foto
  eliminarFoto();
  
  // Resetear indicador de fortaleza de contraseña
  const bar = document.getElementById('passwordStrengthBar');
  const text = document.getElementById('passwordStrengthText');
  
  if (bar) bar.className = 'password-strength-bar';
  if (text) text.textContent = '';
  
  // Enfocar el primer campo
  document.getElementById('usuarioNombre').focus();
  
  console.log('✅ Formulario limpiado');
}

// ==========================================
// INICIALIZAR AL CARGAR EL DOM
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 DOM cargado - Iniciando módulo de crear usuario');
  inicializarCrearUsuario();
});
