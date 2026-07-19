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

  if (tipo === 'exito') {
    setTimeout(() => {
      const msg = document.getElementById('mensaje');
      if (msg) msg.style.display = 'none';
    }, 4000);
  }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarEliminacion() {
  console.log('🗑️ Inicializando módulo de eliminación...');
  
  // 1. Limpiar estado previo al entrar
  equipoEncontrado = null;
  usuarioActual = null;

  // 2. Esperar a que supabaseClient esté disponible
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }

  if (typeof supabaseClient === 'undefined') {
    mostrarMensaje('Error: Supabase no está disponible', 'error');
    return;
  }

  // 3. Obtener usuario actual
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      const { data } = await supabaseClient.from('usuarios').select('*').eq('email', session.user.email).maybeSingle();
      usuarioActual = data || { email: session.user.email, id: session.user.id };
    }
  } catch (err) {
    console.error('Error al obtener usuario:', err);
  }

  // 4. Configurar evento Enter en el input (EVITA DUPLICADOS)
  const inputBusqueda = document.getElementById('buscarEquipoInput');
  if (inputBusqueda) {
    // Solo agregamos el listener si NO tiene la marca de que ya fue agregado
    if (!inputBusqueda.dataset.listenerAttached) {
      inputBusqueda.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          buscarEquipo();
        }
      });
      inputBusqueda.dataset.listenerAttached = 'true'; // Marcamos que ya tiene el listener
    }
    // Dar foco automático al cargar
    setTimeout(() => inputBusqueda.focus(), 100);
  }

  // 5. Cargar historial
  await cargarHistorialEliminados();
}

// ==========================================
// BUSCAR EQUIPO (CON PROTECCIÓN ANTE DOBLE CLIC)
// ==========================================
async function buscarEquipo() {
  const input = document.getElementById('buscarEquipoInput');
  const btnBuscar = document.querySelector('button[onclick="buscarEquipo()"]');
  
  if (!input) return;

  const codigoOriginal = input.value.trim();
  if (!codigoOriginal) {
    mostrarMensaje('⚠️ Por favor ingrese un código de barras o serial', 'warning');
    input.focus();
    return;
  }

  // Bloquear botón para evitar búsquedas múltiples simultáneas
  if (btnBuscar) {
    btnBuscar.disabled = true;
    btnBuscar.textContent = '⏳ Buscando...';
  }

  try {
    const codigoBusqueda = codigoOriginal.replace(/'/g, '-').replace(/"/g, '-').replace(/`/g, '-').trim();

    const { data, error } = await supabaseClient
      .from('equipos')
      .select('*')
      .or(`codigo_barras.eq.${codigoBusqueda},serial.eq.${codigoBusqueda}`)
      .maybeSingle();

    if (error || !data) {
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
  } finally {
    // Restaurar botón siempre, haya éxito o error
    if (btnBuscar) {
      btnBuscar.disabled = false;
      btnBuscar.textContent = '🔎 Buscar';
    }
  }
}

// ==========================================
// MOSTRAR DATOS DEL EQUIPO (BLINDADO)
// ==========================================
function mostrarDatosEquipo(equipo) {
  const elCodigo = document.getElementById('fichaCodigo');
  const elNombre = document.getElementById('fichaNombre');
  const elMarca = document.getElementById('fichaMarca');
  const elModelo = document.getElementById('fichaModelo');
  const elSerial = document.getElementById('fichaSerial');
  const elEstatus = document.getElementById('fichaEstatus');
  const elEncontrado = document.getElementById('equipoEncontrado');

  if (elCodigo) elCodigo.textContent = equipo.codigo_barras || 'N/A';
  if (elNombre) elNombre.textContent = equipo.nombre_equipo || 'N/A';
  if (elMarca) elMarca.textContent = equipo.marca || 'N/A';
  if (elModelo) elModelo.textContent = equipo.modelo || 'N/A';
  if (elSerial) elSerial.textContent = equipo.serial || 'N/A';
  if (elEstatus) elEstatus.textContent = equipo.estatus || 'N/A';

  if (elEncontrado) {
    elEncontrado.style.display = 'block';
    elEncontrado.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ==========================================
// CONFIRMAR ELIMINACIÓN
// ==========================================
async function confirmarEliminacion() {
  if (!equipoEncontrado) return;

  const motivoInput = document.getElementById('motivoEliminacion');
  const motivo = motivoInput ? motivoInput.value.trim() : '';
  
  const confirmacion = confirm(
    `⚠️ ¿Estás SEGURO de que deseas eliminar permanentemente este equipo?\n\n` +
    `Código: ${equipoEncontrado.codigo_barras}\n` +
    `Nombre: ${equipoEncontrado.nombre_equipo}\n\n` +
    `Esta acción no se puede deshacer.`
  );

  if (!confirmacion) return;

  const btnEliminar = document.querySelector('.btn-danger');
  if (btnEliminar) {
    btnEliminar.disabled = true;
    btnEliminar.textContent = '⏳ Eliminando...';
  }

  try {
    // 1. Insertar en la tabla de respaldo
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
        eliminado_por_email: usuarioActual?.email || 'unknown',
        eliminado_por_id: usuarioActual?.id || null,
        fecha_eliminacion: new Date().toISOString()
      });

    if (errorRespaldo) throw new Error('Error al guardar respaldo: ' + errorRespaldo.message);

    // 2. Eliminar de la tabla activa
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
    const btn = document.querySelector('.btn-danger');
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🗑️ Eliminar Equipo Permanentemente';
    }
  }
}

// ==========================================
// CANCELAR BÚSQUEDA (100% BLINDADO)
// ==========================================
function cancelarBusqueda() {
  equipoEncontrado = null;
  
  const input = document.getElementById('buscarEquipoInput');
  if (input) {
    input.value = '';
    input.focus();
  }
  
  const motivo = document.getElementById('motivoEliminacion');
  if (motivo) motivo.value = '';
  
  const encontrado = document.getElementById('equipoEncontrado');
  if (encontrado) encontrado.style.display = 'none';
  
  const mensaje = document.getElementById('mensaje');
  if (mensaje) mensaje.style.display = 'none';
}

// ==========================================
// CARGAR HISTORIAL DE ELIMINADOS
// ==========================================
async function cargarHistorialEliminados() {
  const tbody = document.getElementById('tbodyEliminados');
  if (!tbody) return; // Si el usuario ya cambió de pestaña, no hacer nada

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
      const eliminadoPor = item.eliminado_por_email || item.eliminado_por || 'N/A'; 
      return `
        <tr>
          <td>${fecha}</td>
          <td style="font-family: monospace; font-weight: 600;">${item.codigo_barras}</td>
          <td>${item.nombre_equipo}</td>
          <td>${item.serial || '-'}</td>
          <td>${eliminadoPor}</td>
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
