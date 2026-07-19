// ==========================================
// VARIABLES GLOBALES
// ==========================================
let equipoEncontrado = null;
let usuarioActual = null;

// ==========================================
// SISTEMA DE MENSAJES
// ==========================================
function mostrarMensaje(texto, tipo) {
  const mensajeDiv = document.getElementById('mensaje');
  if (!mensajeDiv) return;

  mensajeDiv.textContent = texto;
  mensajeDiv.className = `mensaje ${tipo}`;
  mensajeDiv.style.display = 'block';

  // Ocultar automáticamente después de 5 segundos si es éxito
  if (tipo === 'exito') {
    setTimeout(() => {
      mensajeDiv.style.display = 'none';
    }, 5000);
  }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarEliminacion() {
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }

  if (typeof supabaseClient === 'undefined') {
    mostrarMensaje('Error: Supabase no está disponible', 'error');
    return;
  }

  // Obtener usuario actual
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    const { data } = await supabaseClient.from('usuarios').select('*').eq('email', session.user.email).maybeSingle();
    usuarioActual = data || { email: session.user.email, id: session.user.id };
  }

  // Evento Enter en el input de búsqueda
  const inputBusqueda = document.getElementById('buscarEquipoInput');
  if (inputBusqueda) {
    inputBusqueda.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        buscarEquipo();
      }
    });
  }

  cargarHistorialEliminados();
}

// ==========================================
// BUSCAR EQUIPO
// ==========================================
async function buscarEquipo() {
  const input = document.getElementById('buscarEquipoInput');
  if (!input) return;

  const codigoOriginal = input.value.trim();
  if (!codigoOriginal) {
    mostrarMensaje('⚠️ Por favor ingrese un código de barras o serial', 'warning');
    input.focus();
    return;
  }

  // ✅ CORRECCIÓN: Reemplazar COMILLAS SIMPLES, DOBLES y ACENTOS GRAVES por guiones
  const codigoBusqueda = codigoOriginal.replace(/'/g, '-').replace(/"/g, '-').replace(/`/g, '-').trim();

  try {
    const { data, error } = await supabaseClient
      .from('equipos')
      .select('*')
      .or(`codigo_barras.eq.${codigoBusqueda},serial.eq.${codigoBusqueda}`)
      .maybeSingle();

    if (error || !data) {
      // Mostramos el código corregido para que el usuario sepa qué se buscó
      mostrarMensaje(`❌ No se encontró ningún equipo con: "${codigoBusqueda}"`, 'error');
      input.value = '';
      input.focus();
      return;
    }

    equipoEncontrado = data;
    mostrarDatosEquipo(data);
    mostrarMensaje(`✅ Equipo encontrado: ${data.nombre_equipo}`, 'exito');

  } catch (err) {
    console.error('Error al buscar:', err);
    mostrarMensaje('Error al buscar en la base de datos: ' + err.message, 'error');
  }
}

// ==========================================
// MOSTRAR DATOS DEL EQUIPO
// ==========================================
// ==========================================
// MOSTRAR DATOS DEL EQUIPO
// ==========================================
function mostrarDatosEquipo(equipo) {
  // Actualizar cada campo individualmente
  document.getElementById('fichaCodigo').textContent = equipo.codigo_barras || 'N/A';
  document.getElementById('fichaNombre').textContent = equipo.nombre_equipo || 'N/A';
  document.getElementById('fichaMarca').textContent = equipo.marca || 'N/A';
  document.getElementById('fichaModelo').textContent = equipo.modelo || 'N/A';
  document.getElementById('fichaSerial').textContent = equipo.serial || 'N/A';
  document.getElementById('fichaEstatus').textContent = equipo.estatus || 'N/A';

  document.getElementById('equipoEncontrado').style.display = 'block';
  document.getElementById('equipoEncontrado').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// CONFIRMAR ELIMINACIÓN
// ==========================================
async function confirmarEliminacion() {
  if (!equipoEncontrado) return;

  const motivo = document.getElementById('motivoEliminacion').value.trim();
  
  const confirmacion = confirm(
    `⚠️ ¿Estás SEGURO de que deseas eliminar permanentemente este equipo?\n\n` +
    `Código: ${equipoEncontrado.codigo_barras}\n` +
    `Nombre: ${equipoEncontrado.nombre_equipo}\n\n` +
    `Esta acción no se puede deshacer.`
  );

  if (!confirmacion) return;

  const btnEliminar = document.querySelector('.btn-danger');
  btnEliminar.disabled = true;
  btnEliminar.textContent = '⏳ Eliminando...';

  try {
    // 1. Insertar en la tabla de respaldo (equipos_eliminados)
    const { error: errorRespaldo } = await supabaseClient
      .from('equipos_eliminados')
      .insert({
        equipo_id_original: equipoEncontrado.id,
        codigo_barras: equipoEncontrado.codigo_barras,
        nombre_equipo: equipoEncontrado.nombre_equipo,
        marca: equipoEncontrado.marca,
        modelo: equipoEncontrado.modelo,
        serial: equipoEncontrado.serial,
        costo: equipoEncontrado.costo || 0,
        estatus: equipoEncontrado.estatus,
        motivo_eliminacion: motivo || 'Sin motivo especificado',
        eliminado_por_email: usuarioActual?.email || 'unknown', // ✅ CORREGIDO: Nombre exacto de la columna
        eliminado_por_id: usuarioActual?.id || null,
        fecha_eliminacion: new Date().toISOString()
      });

    if (errorRespaldo) throw new Error('Error al guardar respaldo: ' + errorRespaldo.message);

    // 2. Eliminar de la tabla activa (equipos)
    const { error: errorEliminacion } = await supabaseClient
      .from('equipos')
      .delete()
      .eq('id', equipoEncontrado.id);

    if (errorEliminacion) throw new Error('Error al eliminar: ' + errorEliminacion.message);

    // 3. Registrar en logs
    if (typeof registrarLog === 'function') {
      await registrarLog(
        'inventario', 
        'Equipo eliminado', 
        `Equipo eliminado: ${equipoEncontrado.codigo_barras} (${equipoEncontrado.nombre_equipo}) | Motivo: ${motivo || 'N/A'} | Eliminado por: ${usuarioActual?.email || 'Desconocido'}`, 
        'error'
      );
    }

    mostrarMensaje('✅ Equipo eliminado y movido al historial de respaldo exitosamente', 'exito');
    
    // Limpiar y recargar
    setTimeout(() => {
      cancelarBusqueda();
      cargarHistorialEliminados();
    }, 1500);

  } catch (err) {
    console.error('Error al eliminar:', err);
    mostrarMensaje('❌ Error al eliminar: ' + err.message, 'error');
  } finally {
    btnEliminar.disabled = false;
    btnEliminar.textContent = '🗑️ Eliminar Equipo Permanentemente';
  }
}
// ==========================================
// CANCELAR BÚSQUEDA
// ==========================================
function cancelarBusqueda() {
  equipoEncontrado = null;
  document.getElementById('buscarEquipoInput').value = '';
  document.getElementById('motivoEliminacion').value = '';
  document.getElementById('equipoEncontrado').style.display = 'none';
  document.getElementById('mensaje').style.display = 'none';
  document.getElementById('buscarEquipoInput').focus();
}

// ==========================================
// CARGAR HISTORIAL DE ELIMINADOS
// ==========================================
async function cargarHistorialEliminados() {
  const tbody = document.getElementById('tbodyEliminados');
  if (!tbody) return;

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
        </tr>`;
      return;
    }

    tbody.innerHTML = data.map(item => {
      const fecha = item.fecha_eliminacion ? new Date(item.fecha_eliminacion).toLocaleDateString('es-ES') : '-';
      return `
        <tr>
          <td>${fecha}</td>
          <td style="font-family: monospace; font-weight: 600;">${item.codigo_barras}</td>
          <td>${item.nombre_equipo}</td>
          <td>${item.serial || '-'}</td>
          <td>${item.eliminado_por || 'N/A'}</td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Error al cargar historial:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px; color: #ef4444;">
          Error al cargar historial: ${err.message}
        </td>
      </tr>`;
  }
}

// ==========================================
// INICIALIZAR AL CARGAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  inicializarEliminacion();
});
