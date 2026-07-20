// ==========================================
// VARIABLES GLOBALES
// ==========================================
let equipoEncontrado = null;
let usuarioActual = null;

// ==========================================
// SISTEMA DE MENSAJES (100% SEGURO)
// ==========================================
function mostrarMensaje(texto, tipo) {
  const mensajeDiv = document.getElementById('mensaje');
  if (!mensajeDiv) {
    console.warn('⚠️ Elemento #mensaje no encontrado en el DOM');
    return;
  }

  // Usamos textContent por seguridad, evita errores de inyección y null
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
  
  equipoEncontrado = null;
  usuarioActual = null;

  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }

  if (typeof supabaseClient === 'undefined') {
    mostrarMensaje('Error: Supabase no está disponible', 'error');
    return;
  }

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      const { data } = await supabaseClient.from('usuarios').select('*').eq('email', session.user.email).maybeSingle();
      usuarioActual = data || { email: session.user.email, id: session.user.id };
    }
  } catch (err) {
    console.error('Error al obtener usuario:', err);
  }

  const inputBusqueda = document.getElementById('buscarEquipoInput');
  if (inputBusqueda) {
    if (!inputBusqueda.dataset.listenerAttached) {
      inputBusqueda.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          buscarEquipo();
        }
      });
      inputBusqueda.dataset.listenerAttached = 'true';
    }
    setTimeout(() => inputBusqueda.focus(), 100);
  }

  await cargarHistorialEliminados();
}

// ==========================================
// BUSCAR EQUIPO
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
    mostrarMensaje('Error al buscar: ' + err.message, 'error');
  } finally {
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
  const campos = [
    { id: 'fichaCodigo', valor: equipo.codigo_barras },
    { id: 'fichaNombre', valor: equipo.nombre_equipo },
    { id: 'fichaMarca', valor: equipo.marca },
    { id: 'fichaModelo', valor: equipo.modelo },
    { id: 'fichaSerial', valor: equipo.serial },
    { id: 'fichaEstatus', valor: equipo.estatus }
  ];

  campos.forEach(campo => {
    const el = document.getElementById(campo.id);
    if (el) {
      el.textContent = campo.valor || 'N/A';
    } else {
      console.warn(`⚠️ Elemento #${campo.id} no encontrado en el HTML`);
    }
  });

  const elEncontrado = document.getElementById('equipoEncontrado');
  if (elEncontrado) {
    elEncontrado.style.display = 'block';
    setTimeout(() => {
      elEncontrado.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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

    const { error: errorEliminacion } = await supabaseClient
      .from('equipos')
      .delete()
      .eq('id', equipoEncontrado.id);

    if (errorEliminacion) throw new Error('Error al eliminar: ' + errorEliminacion.message);

    if (typeof registrarLog === 'function') {
      await registrarLog(
        'inventario', 
        'Equipo eliminado', 
        `Equipo eliminado: ${equipoEncontrado.codigo_barras} (${equipoEncontrado.nombre_equipo}) | Motivo: ${motivo || 'N/A'} | Eliminado por: ${usuarioActual?.email || 'Desconocido'}`, 
        'error'
      );
    }

    mostrarMensaje('✅ Equipo eliminado y movido al historial exitosamente', 'exito');
    
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
// CANCELAR BÚSQUEDA
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
  if (!tbody) {
    console.warn('⚠️ Elemento #tbodyEliminados no encontrado');
    return;
  }

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
