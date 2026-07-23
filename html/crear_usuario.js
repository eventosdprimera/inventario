// ==========================================
// VARIABLES GLOBALES
// ==========================================
let fotoSeleccionada = null;
let usuarioActualCreador = null;

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
    };
    reader.readAsDataURL(file);
  }
}

// ==========================================
// CREAR USUARIO (AUTH + DB + LOGS)
// ==========================================
async function crearUsuario() {
  const nombre = document.getElementById('usuarioNombre').value.trim();
  const email = document.getElementById('usuarioEmail').value.trim().toLowerCase();
  const password = document.getElementById('usuarioPassword').value;
  const rol = document.getElementById('usuarioRol').value;

  // Validaciones
  if (!nombre || !email || !password || !rol) {
    mostrarMensajeUsuario('Por favor complete todos los campos obligatorios', 'error');
    return;
  }
  if (password.length < 6) {
    mostrarMensajeUsuario('La contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    mostrarMensajeUsuario('Por favor ingrese un correo electrónico válido', 'error');
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
      id: authData.user.id, // Vinculamos con el ID de Auth
      email: email,
      nombre: nombre,
      rol: rol,
      foto_url: fotoUrl,
      fecha_creacion: new Date().toISOString()
    });

    if (dbError) {
      // Si falla la inserción en la tabla, intentamos limpiar el usuario de Auth para no dejar huérfanos
      console.error('Error en DB, intentando limpiar Auth...', dbError);
      throw new Error(`Usuario creado en Auth, pero falló en la base de datos: ${dbError.message}`);
    }

    // 4. Registrar en Logs
    if (typeof registrarLog === 'function') {
      const descripcion = `Nuevo usuario creado: ${nombre} (${email}) con rol: ${rol.toUpperCase()}. Creado por: ${usuarioActualCreador?.email || 'Sistema'}`;
      await registrarLog('usuarios', 'Usuario creado', descripcion, 'success');
    }

    mostrarMensajeUsuario(`✅ Usuario "${nombre}" creado exitosamente. ${authData.user.identities?.length === 0 ? '(Nota: El usuario deberá verificar su correo si está habilitado)' : ''}`, 'exito');
    
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
  document.getElementById('usuarioEmail').value = '';
  document.getElementById('usuarioPassword').value = '';
  document.getElementById('usuarioRol').value = 'consultor';
  document.getElementById('inputFoto').value = '';
  
  document.getElementById('fotoPreview').src = '';
  document.getElementById('fotoPreview').style.display = 'none';
  document.getElementById('fotoPlaceholder').style.display = 'block';
  fotoSeleccionada = null;
  
  document.getElementById('usuarioNombre').focus();
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  inicializarCrearUsuario();
});
