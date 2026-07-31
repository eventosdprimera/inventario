// ==========================================
// VARIABLES GLOBALES
// ==========================================
let usuarioAEliminar = null;
let usuarioActualElim = null;

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarEliminarUsuario() {
  console.log('️ Inicializando módulo de eliminar usuario...');
  
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }
  
  if (typeof supabaseClient === 'undefined') {
    mostrarMensajeElim('❌ Error: Supabase no está disponible', 'error');
    return;
  }

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      const { data } = await supabaseClient.from('usuarios').select('*').eq('email', session.user.email).maybeSingle();
      usuarioActualElim = data || { email: session.user.email, id: session.user.id };
    }
  } catch (err) {
    console.error('Error al cargar usuario actual:', err);
  }

  // Cargar todos los usuarios al inicio
  await buscarUsuariosElim();
}

// ==========================================
// BÚSQUEDA DE USUARIOS
// ==========================================
async function buscarUsuariosElim() {
  const nombre = document.getElementById('buscarNombreElim').value.trim();
  const cedula = document.getElementById('buscarCedulaElim').value.trim();
  const rol = document.getElementById('buscarRolElim').value;

  const tbody = document.getElementById('tbodyUsuariosElim');
  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: #6b7280;">⏳ Buscando...</td></tr>`;

  try {
    let query = supabaseClient.from('usuarios').select('*');

    if (nombre) query = query.ilike('nombre', `%${nombre}%`);
    if (cedula) query = query.ilike('cedula', `%${cedula}%`);
    if (rol) query = query.eq('rol', rol);

    query = query.order('fecha_creacion', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: #6b7280;">📭 No se encontraron usuarios</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(u => {
      const nombreCompleto = u.nombre || 'Sin nombre';
      const cedulaTexto = u.cedula || 'N/A';
      const rolBadge = u.rol === 'administrador' ? '👑 Admin' : (u.rol === 'moderador' ? '⚙️ Moderador' : '👁️ Consultor');
      
      return `
        <tr onclick="seleccionarUsuarioElim('${u.id}')" id="fila-usuario-elim-${u.id}">
          <td><strong>${nombreCompleto}</strong></td>
          <td>${cedulaTexto}</td>
          <td>${u.email}</td>
          <td>${rolBadge}</td>
          <td>
            <button type="button" class="btn-elim btn-primary-elim" style="padding: 6px 12px; font-size: 12px;" onclick="event.stopPropagation(); seleccionarUsuarioElim('${u.id}')">
              🗑️ Eliminar
            </button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Error al buscar usuarios:', err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: #ef4444;">❌ Error: ${err.message}</td></tr>`;
  }
}

// ==========================================
// SELECCIONAR USUARIO PARA ELIMINAR
// ==========================================
function seleccionarUsuarioElim(id) {
  // Obtener datos del DOM ya que están en la tabla
  const fila = document.getElementById(`fila-usuario-elim-${id}`);
  if (!fila) return;

  const celdas = fila.querySelectorAll('td');
  const nombre = celdas[0].textContent.trim();
  const cedula = celdas[1].textContent.trim();
  const email = celdas[2].textContent.trim();
  const rol = celdas[3].textContent.trim();

  usuarioAEliminar = { id, nombre, cedula, email, rol };

  // Resaltar fila
  document.querySelectorAll('#tbodyUsuariosElim tr').forEach(tr => tr.classList.remove('selected'));
  fila.classList.add('selected');

  // Llenar confirmación
  document.getElementById('confirmNombreElim').textContent = nombre;
  document.getElementById('confirmCedulaElim').textContent = cedula;
  document.getElementById('confirmEmailElim').textContent = email;
  document.getElementById('confirmRolElim').textContent = rol;
  document.getElementById('confirmacionTextoElim').value = '';

  // Mostrar sección y hacer scroll
  document.getElementById('fieldsetConfirmacionElim').style.display = 'block';
  document.getElementById('fieldsetConfirmacionElim').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ==========================================
// EJECUTAR ELIMINACIÓN
// ==========================================
async function ejecutarEliminacion() {
  if (!usuarioAEliminar) return;

  const confirmacion = document.getElementById('confirmacionTextoElim').value.trim();

  if (confirmacion !== 'ELIMINAR') {
    mostrarMensajeElim('⚠️ Debes escribir exactamente "ELIMINAR" en mayúsculas para confirmar', 'warning');
    document.getElementById('confirmacionTextoElim').focus();
    return;
  }

  const btnEjecutar = document.getElementById('btnEjecutarElim');
  btnEjecutar.disabled = true;
  btnEjecutar.textContent = '⏳ Eliminando...';

  try {
    // 1. Eliminar de la tabla 'usuarios'
    const { error: dbError } = await supabaseClient
      .from('usuarios')
      .delete()
      .eq('id', usuarioAEliminar.id);

    if (dbError) throw dbError;

    // 2. Registrar en Logs
    if (typeof registrarLog === 'function') {
      const descripcion = `Usuario ELIMINADO PERMANENTEMENTE: ${usuarioAEliminar.nombre} (C.I: ${usuarioAEliminar.cedula}, Email: ${usuarioAEliminar.email}, Rol: ${usuarioAEliminar.rol}). Eliminado por: ${usuarioActualElim?.email || 'Sistema'}`;
      await registrarLog('usuarios', 'Usuario eliminado', descripcion, 'error');
    }

    mostrarMensajeElim(`✅ El usuario "${usuarioAEliminar.nombre}" ha sido eliminado permanentemente del sistema`, 'exito');
    
    // Limpiar y refrescar
    setTimeout(() => {
      cancelarEliminacion();
      buscarUsuariosElim();
    }, 1500);

  } catch (err) {
    console.error('❌ Error al eliminar:', err);
    mostrarMensajeElim(`❌ Error: ${err.message}`, 'error');
  } finally {
    btnEjecutar.disabled = false;
    btnEjecutar.textContent = '🗑️ Eliminar Permanentemente';
  }
}

// ==========================================
// UTILIDADES
// ==========================================
function cancelarEliminacion() {
  usuarioAEliminar = null;
  
  document.getElementById('fieldsetConfirmacionElim').style.display = 'none';
  document.getElementById('confirmacionTextoElim').value = '';
  document.querySelectorAll('#tbodyUsuariosElim tr').forEach(tr => tr.classList.remove('selected'));
  
  document.getElementById('fieldsetConfirmacionElim').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function mostrarMensajeElim(texto, tipo) {
  const msg = document.getElementById('mensajeElimUsuario');
  if (!msg) return;
  
  msg.textContent = texto;
  msg.className = `elim-usuario-mensaje ${tipo}`;
  
  // Scroll automático hacia el mensaje
  msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  setTimeout(() => { 
    msg.className = 'elim-usuario-mensaje'; 
  }, 5000);
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  inicializarEliminarUsuario();
});
