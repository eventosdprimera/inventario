// ==========================================
// VARIAB GLOBALES
// ==========================================
let usuarioSeleccionadoMod = null;
let fotoSeleccionadaMod = null;
let usuarioActualMod = null;

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarModificarUsuario() {
  console.log('👤 Inicializando módulo de modificar usuario...');
  
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }
  
  if (typeof supabaseClient === 'undefined') {
    mostrarMensajeMod('❌ Error: Supabase no está disponible', 'error');
    return;
  }

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      const { data } = await supabaseClient.from('usuarios').select('*').eq('email', session.user.email).maybeSingle();
      usuarioActualMod = data || { email: session.user.email, id: session.user.id };
    }
  } catch (err) {
    console.error('Error al cargar usuario actual:', err);
  }

  // Cargar todos los usuarios al inicio
  await buscarUsuarios();
}

// ==========================================
// BÚSQUEDA DE USUARIOS
// ==========================================
async function buscarUsuarios() {
  const nombre = document.getElementById('buscarNombre').value.trim();
  const cedula = document.getElementById('buscarCedula').value.trim();
  const rol = document.getElementById('buscarRol').value;

  const tbody = document.getElementById('tbodyUsuariosMod');
  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: #6b7280;">⏳ Buscando...</td></tr>`;

  try {
    let query = supabaseClient.from('usuarios').select('*');

    if (nombre) {
      query = query.ilike('nombre', `%${nombre}%`);
    }
    if (cedula) {
      query = query.ilike('cedula', `%${cedula}%`);
    }
    if (rol) {
      query = query.eq('rol', rol);
    }

    query = query.order('fecha_creacion', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: #6b7280;">📭 No se encontraron usuarios con esos criterios</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(u => {
      const nombreCompleto = u.nombre || 'Sin nombre';
      const cedulaTexto = u.cedula || 'N/A';
      const rolBadge = u.rol === 'administrador' ? '👑 Admin' : (u.rol === 'moderador' ? '⚙️ Moderador' : '👁️ Consultor');
      
      return `
        <tr onclick="seleccionarUsuario('${u.id}')" id="fila-usuario-${u.id}">
          <td><strong>${nombreCompleto}</strong></td>
          <td>${cedulaTexto}</td>
          <td>${u.email}</td>
          <td>${rolBadge}</td>
          <td>
            <button type="button" class="btn-mod btn-primary-mod" style="padding: 6px 12px; font-size: 12px;" onclick="event.stopPropagation(); seleccionarUsuario('${u.id}')">
              ✏️ Editar
            </button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Error al buscar usuarios:', err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: #ef4444;">❌ Error al cargar: ${err.message}</td></tr>`;
  }
}

// ==========================================
// SELECCIONAR USUARIO PARA EDITAR
// ==========================================
async function seleccionarUsuario(id) {
  try {
    const { data, error } = await supabaseClient.from('usuarios').select('*').eq('id', id).single();
    
    if (error || !data) {
      mostrarMensajeMod('❌ No se pudo cargar el usuario', 'error');
      return;
    }

    usuarioSeleccionadoMod = data;
    fotoSeleccionadaMod = null;

    // Resaltar fila
    document.querySelectorAll('#tbodyUsuariosMod tr').forEach(tr => tr.classList.remove('selected'));
    const fila = document.getElementById(`fila-usuario-${id}`);
    if (fila) fila.classList.add('selected');

    // Llenar formulario
    document.getElementById('editNombreUsuario').textContent = data.nombre || 'Usuario';
    document.getElementById('editNombres').value = data.nombre ? data.nombre.split(' ')[0] : '';
    document.getElementById('editApellidos').value = data.nombre ? data.nombre.split(' ').slice(1).join(' ') : '';
    document.getElementById('editCedula').value = data.cedula || '';
    document.getElementById('editEmail').value = data.email || '';
    document.getElementById('editRol').value = data.rol || 'consultor';

    // Manejo de foto
    const imgPreview = document.getElementById('fotoPreviewMod');
    const placeholder = document.getElementById('fotoPlaceholderMod');
    const btnEliminar = document.getElementById('btnEliminarFotoMod');

    if (data.foto_url) {
      imgPreview.src = data.foto_url;
      imgPreview.style.display = 'block';
      placeholder.style.display = 'none';
      btnEliminar.style.display = 'inline-flex';
    } else {
      imgPreview.src = '';
      imgPreview.style.display = 'none';
      placeholder.style.display = 'flex';
      btnEliminar.style.display = 'none';
    }

    // Mostrar sección de edición y hacer scroll
    document.getElementById('fieldsetEdicionUsuario').style.display = 'block';
    document.getElementById('fieldsetEdicionUsuario').scrollIntoView({ behavior: 'smooth', block: 'center' });

  } catch (err) {
    console.error('Error al seleccionar usuario:', err);
    mostrarMensajeMod('❌ Error: ' + err.message, 'error');
  }
}

// ==========================================
// MANEJO DE FOTO
// ==========================================
function previsualizarFotoMod(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    mostrarMensajeMod('⚠️ Seleccione un archivo de imagen válido', 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    mostrarMensajeMod('⚠️ La imagen no debe superar los 5MB', 'error');
    return;
  }

  fotoSeleccionadaMod = file;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('fotoPreviewMod').src = e.target.result;
    document.getElementById('fotoPreviewMod').style.display = 'block';
    document.getElementById('fotoPlaceholderMod').style.display = 'none';
    document.getElementById('btnEliminarFotoMod').style.display = 'inline-flex';
  };
  reader.readAsDataURL(file);
}

function eliminarFotoMod() {
  fotoSeleccionadaMod = null;
  document.getElementById('fotoPreviewMod').src = '';
  document.getElementById('fotoPreviewMod').style.display = 'none';
  document.getElementById('fotoPlaceholderMod').style.display = 'flex';
  document.getElementById('btnEliminarFotoMod').style.display = 'none';
  document.getElementById('inputFotoMod').value = '';
}

// ==========================================
// GUARDAR CAMBIOS
// ==========================================
async function guardarCambiosUsuario() {
  if (!usuarioSeleccionadoMod) return;

  const nombres = document.getElementById('editNombres').value.trim();
  const apellidos = document.getElementById('editApellidos').value.trim();
  const cedula = document.getElementById('editCedula').value.trim();
  const rol = document.getElementById('editRol').value;

  if (!nombres || !apellidos || !cedula || !rol) {
    mostrarMensajeMod('⚠️ Complete todos los campos obligatorios', 'error');
    return;
  }

  const btnGuardar = document.getElementById('btnGuardarMod');
  btnGuardar.disabled = true;
  btnGuardar.textContent = '⏳ Guardando...';

  try {
    let fotoUrl = usuarioSeleccionadoMod.foto_url;

    // 1. Subir nueva foto si se seleccionó una
    if (fotoSeleccionadaMod) {
      // Si había una foto anterior, podríamos eliminarla del storage aquí (opcional)
      const fileName = `avatars/${usuarioSeleccionadoMod.id}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabaseClient.storage
        .from('avatars')
        .upload(fileName, fotoSeleccionadaMod, { upsert: true });
      
      if (uploadError) throw new Error(`Error al subir foto: ${uploadError.message}`);
      
      const { data: urlData } = supabaseClient.storage.from('avatars').getPublicUrl(fileName);
      fotoUrl = urlData.publicUrl;
    } else if (document.getElementById('btnEliminarFotoMod').style.display === 'none' && usuarioSeleccionadoMod.foto_url) {
      // El usuario eliminó la foto explícitamente
      fotoUrl = null;
    }

    const nombreCompleto = `${nombres} ${apellidos}`.trim();

    // 2. Actualizar en la tabla 'usuarios'
    const { error: dbError } = await supabaseClient
      .from('usuarios')
      .update({
        nombre: nombreCompleto,
        cedula: cedula,
        rol: rol,
        foto_url: fotoUrl
      })
      .eq('id', usuarioSeleccionadoMod.id);

    if (dbError) throw dbError;

    // 3. Registrar en Logs
    if (typeof registrarLog === 'function') {
      const descripcion = `Usuario modificado: ${nombreCompleto} (C.I: ${cedula}, Rol: ${rol.toUpperCase()}). Modificado por: ${usuarioActualMod?.email || 'Sistema'}`;
      await registrarLog('usuarios', 'Usuario modificado', descripcion, 'warning');
    }

    mostrarMensajeMod(`✅ Usuario "${nombreCompleto}" actualizado exitosamente`, 'exito');
    
    // Refrescar la lista y limpiar
    setTimeout(() => {
      cancelarEdicion();
      buscarUsuarios();
    }, 1500);

  } catch (err) {
    console.error('❌ Error al guardar:', err);
    mostrarMensajeMod(`❌ Error: ${err.message}`, 'error');
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = '💾 Guardar Cambios';
  }
}

// ==========================================
// CAMBIAR CONTRASEÑA (VÍA EDGE FUNCTION)
// ==========================================
async function cambiarPasswordUsuario() {
  if (!usuarioSeleccionadoMod) {
    mostrarMensajeMod('️ No hay un usuario seleccionado', 'error');
    return;
  }

  const nuevaPassword = document.getElementById('editNuevaPassword').value;
  const confirmarPassword = document.getElementById('editConfirmarPassword').value;

  // Validaciones
  if (!nuevaPassword || !confirmarPassword) {
    mostrarMensajeMod('⚠️ Complete ambos campos de contraseña', 'error');
    return;
  }

  if (nuevaPassword.length < 6) {
    mostrarMensajeMod('️ La contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }

  if (nuevaPassword !== confirmarPassword) {
    mostrarMensajeMod('⚠️ Las contraseñas no coinciden', 'error');
    return;
  }

  if (!confirm(`¿Está seguro de cambiar la contraseña del usuario "${usuarioSeleccionadoMod.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
    return;
  }

  try {
    // Obtener la sesión actual del administrador
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session || !session.access_token) {
      throw new Error('No hay sesión activa');
    }

    // Llamar a la Edge Function
    const { data: supabaseUrl } = supabaseClient;
    const functionUrl = `${supabaseUrl.supabaseUrl}/functions/v1/update-user-password`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'apikey': supabaseUrl.supabaseKey
      },
      body: JSON.stringify({
        user_id: usuarioSeleccionadoMod.id,
        new_password: nuevaPassword
      })
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      throw new Error(result.error || 'Error al cambiar la contraseña');
    }

    // Registrar en logs
    if (typeof registrarLog === 'function') {
      const descripcion = `Contraseña modificada del usuario: ${usuarioSeleccionadoMod.nombre} (${usuarioSeleccionadoMod.email}). Modificado por: ${usuarioActualMod?.email || 'Sistema'}`;
      await registrarLog('usuarios', 'Contraseña cambiada', descripcion, 'warning');
    }

    mostrarMensajeMod(`✅ La contraseña de "${usuarioSeleccionadoMod.nombre}" ha sido actualizada exitosamente`, 'exito');
    
    // Limpiar campos de contraseña
    document.getElementById('editNuevaPassword').value = '';
    document.getElementById('editConfirmarPassword').value = '';

  } catch (err) {
    console.error('Error al cambiar contraseña:', err);
    mostrarMensajeMod(`❌ Error: ${err.message}`, 'error');
  }
}
// ==========================================
// UTILIDADES
// ==========================================
function cancelarEdicion() {
  usuarioSeleccionadoMod = null;
  fotoSeleccionadaMod = null;
  
  document.getElementById('fieldsetEdicionUsuario').style.display = 'none';
  document.querySelectorAll('#tbodyUsuariosMod tr').forEach(tr => tr.classList.remove('selected'));
  
  document.getElementById('fieldsetEdicionUsuario').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function mostrarMensajeMod(texto, tipo) {
  const msg = document.getElementById('mensajeModUsuario');
  if (!msg) return;
  
  msg.textContent = texto;
  msg.className = `mod-usuario-mensaje ${tipo}`;
  
  // ✅ Hace que la página suba automáticamente para mostrar el mensaje
  msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  setTimeout(() => { 
    msg.className = 'mod-usuario-mensaje'; 
  }, 5000);
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  inicializarModificarUsuario();
});
