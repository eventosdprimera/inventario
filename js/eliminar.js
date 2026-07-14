// ==========================================
// VARIABLES GLOBALES
// ==========================================
let equipoEncontrado = null;
let usuarioActualEliminar = null;

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarEliminacion() {
  console.log('🗑️ === INICIANDO MÓDULO DE ELIMINACIÓN ===');

  // Esperar Supabase
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }

  if (typeof supabaseClient === 'undefined') {
    mostrarMensaje('Error: Supabase no está disponible', 'error');
    return;
  }

  await cargarUsuario();
  await cargarHistorialEliminados();

  // Enfocar campo de búsqueda
  const input = document.getElementById('buscarEquipoInput');
  if (input) {
    input.focus();
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') buscarEquipo();
    });
  }

  console.log('✅ === MÓDULO DE ELIMINACIÓN INICIALIZADO ===');
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
      usuarioActualEliminar = data;
    } else {
      usuarioActualEliminar = { email: session.user.email, id: session.user.id };
    }
  } catch (err) {
    console.error('❌ Error al cargar usuario:', err);
  }
}

// ==========================================
// BUSCAR EQUIPO
// ==========================================
async function buscarEquipo() {
  const codigo = document.getElementById('buscarEquipoInput').value.trim();
  
  if (!codigo) {
    mostrarMensaje('Por favor ingresa un código de barras o serial', 'error');
    return;
  }

  mostrarMensaje('⏳ Buscando equipo...', 'warning');

  try {
    // Buscar por código de barras O serial
    const { data, error } = await supabaseClient
      .from('equipos')
      .select('*')
      .or(`codigo_barras.eq.${codigo},serial.eq.${codigo}`)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      mostrarMensaje(`❌ No se encontró ningún equipo con: "${codigo}"`, 'error');
      document.getElementById('equipoEncontrado').style.display = 'none';
      return;
    }

    equipoEncontrado = data;
    mostrarEquipoEncontrado(data);
    mostrarMensaje(`✅ Equipo encontrado: ${data.nombre_equipo}`, 'exito');

  } catch (err) {
    console.error('Error al buscar:', err);
    mostrarMensaje(' Error al buscar: ' + err.message, 'error');
  }
}

// ==========================================
// MOSTRAR EQUIPO ENCONTRADO
// ==========================================
function mostrarEquipoEncontrado(equipo) {
  const grid = document.getElementById('equipoInfoGrid');
  grid.innerHTML = `
    <div class="equipo-info-item">
      <span class="equipo-info-label">Código de Barras</span>
      <span class="equipo-info-value">${equipo.codigo_barras}</span>
    </div>
    <div class="equipo-info-item">
      <span class="equipo-info-label">Nombre</span>
      <span class="equipo-info-value">${equipo.nombre_equipo}</span>
    </div>
    <div class="equipo-info-item">
      <span class="equipo-info-label">Marca</span>
      <span class="equipo-info-value">${equipo.marca || '-'}</span>
    </div>
    <div class="equipo-info-item">
      <span class="equipo-info-label">Modelo</span>
      <span class="equipo-info-value">${equipo.modelo || '-'}</span>
    </div>
    <div class="equipo-info-item">
      <span class="equipo-info-label">Serial</span>
      <span class="equipo-info-value">${equipo.serial || '-'}</span>
    </div>
    <div class="equipo-info-item">
      <span class="equipo-info-label">Estatus</span>
      <span class="equipo-info-value">${equipo.estatus || '-'}</span>
    </div>
    <div class="equipo-info-item">
      <span class="equipo-info-label">Costo</span>
      <span class="equipo-info-value">$${equipo.costo || '0.00'}</span>
    </div>
    <div class="equipo-info-item">
      <span class="equipo-info-label">Fecha Registro</span>
      <span class="equipo-info-value">${new Date(equipo.fecha_registro || Date.now()).toLocaleDateString()}</span>
    </div>
  `;

  document.getElementById('equipoEncontrado').style.display = 'block';
  document.getElementById('equipoEncontrado').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// CONFIRMAR ELIMINACIÓN
// ==========================================
async function confirmarEliminacion() {
  if (!equipoEncontrado) return;

  const motivo = document.getElementById('motivoEliminacion').value.trim();

  if (!confirm(`⚠️ ¿Estás seguro de eliminar este equipo?\n\nEquipo: ${equipoEncontrado.nombre_equipo}\nCódigo: ${equipoEncontrado.codigo_barras}\n\nEsta acción no se puede deshacer.`)) {
    return;
  }

  mostrarMensaje('🗑️ Procesando eliminación...', 'warning');

  try {
    // 1. Insertar en tabla de respaldo
    const { error: errorRespaldo } = await supabaseClient
      .from('equipos_eliminados')
      .insert({
        codigo_barras: equipoEncontrado.codigo_barras,
        nombre_equipo: equipoEncontrado.nombre_equipo,
        marca: equipoEncontrado.marca,
        modelo: equipoEncontrado.modelo,
        serial: equipoEncontrado.serial,
        medida_valor: equipoEncontrado.medida_valor,
        medida_unidad: equipoEncontrado.medida_unidad,
        costo: equipoEncontrado.costo,
        observacion: equipoEncontrado.observacion,
        estatus: equipoEncontrado.estatus,
        foto_url: equipoEncontrado.foto_url,
        foto2_url: equipoEncontrado.foto2_url,
        foto3_url: equipoEncontrado.foto3_url,
        foto4_url: equipoEncontrado.foto4_url,
        usuario_registro: equipoEncontrado.usuario_registro,
        usuario_registro_id: equipoEncontrado.usuario_registro_id,
        fecha_registro: equipoEncontrado.fecha_registro,
        
        eliminado_por_email: usuarioActualEliminar?.email || 'unknown',
        eliminado_por_id: usuarioActualEliminar?.id || null,
        motivo_eliminacion: motivo || null
      });

    if (errorRespaldo) throw new Error('Error al crear respaldo: ' + errorRespaldo.message);

    // 2. Eliminar de la tabla principal
    const { error: errorEliminacion } = await supabaseClient
      .from('equipos')
      .delete()
      .eq('codigo_barras', equipoEncontrado.codigo_barras);

    if (errorEliminacion) throw new Error('Error al eliminar: ' + errorEliminacion.message);

    // 3. Registrar en logs
    if (typeof registrarLog === 'function') {
      const descripcion = `Eliminó equipo: "${equipoEncontrado.nombre_equipo}" | Serial: ${equipoEncontrado.serial} | Código: ${equipoEncontrado.codigo_barras} | Eliminado por: ${usuarioActualEliminar?.email || 'unknown'}`;
      await registrarLog('inventario', 'Equipo eliminado', descripcion, 'warning');
    }

    mostrarMensaje('✅ Equipo eliminado exitosamente y respaldado', 'exito');
    
    // Limpiar y recargar
    setTimeout(() => {
      cancelarBusqueda();
      cargarHistorialEliminados();
    }, 2000);

  } catch (err) {
    console.error('❌ Error al eliminar:', err);
    mostrarMensaje(' Error al eliminar: ' + err.message, 'error');
  }
}

// ==========================================
// CARGAR HISTORIAL DE ELIMINADOS
// ==========================================
async function cargarHistorialEliminados() {
  const tbody = document.getElementById('tbodyEliminados');
  
  try {
    const { data, error } = await supabaseClient
      .from('equipos_eliminados')
      .select('*')
      .order('fecha_eliminacion', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 40px; color: #6b7280;">
            No hay equipos eliminados recientemente
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.map(eq => `
      <tr>
        <td>${new Date(eq.fecha_eliminacion).toLocaleString()}</td>
        <td>${eq.codigo_barras}</td>
        <td>${eq.nombre_equipo}</td>
        <td>${eq.serial || '-'}</td>
        <td>${eq.eliminado_por_email || 'Desconocido'}</td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Error al cargar historial:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px; color: #dc2626;">
          Error al cargar historial
        </td>
      </tr>
    `;
  }
}

// ==========================================
// CANCELAR BÚSQUEDA
// ==========================================
function cancelarBusqueda() {
  equipoEncontrado = null;
  document.getElementById('buscarEquipoInput').value = '';
  document.getElementById('equipoEncontrado').style.display = 'none';
  document.getElementById('motivoEliminacion').value = '';
  document.getElementById('mensaje').className = 'mensaje';
  document.getElementById('mensaje').textContent = '';
  document.getElementById('buscarEquipoInput').focus();
}

// ==========================================
// MOSTRAR MENSAJE
// ==========================================
function mostrarMensaje(texto, tipo) {
  const msg = document.getElementById('mensaje');
  if (msg) {
    msg.textContent = texto;
    msg.className = `mensaje ${tipo}`;
    msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// ==========================================
// INICIALIZAR CUANDO EL DOM ESTÉ LISTO
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 Eliminar DOM cargado');
  inicializarEliminacion();
});
