// ==========================================
// VARIABLES GLOBALES
// ==========================================
let rentasCacheEliminar = [];
let paginaActualEliminar = 1;
const POR_PAGINA_ELIMINAR = 20;
let rentaEliminarSeleccionada = null;
let itemsEliminarSeleccionada = [];
let usuarioActualEliminarRenta = null;

// ==========================================
// ✅ FUNCIÓN PARA OBTENER LA FECHA DE HOY EN CARACAS (UTC-4)
// ==========================================
function obtenerFechaHoyCaracas() {
  const opciones = { 
    timeZone: 'America/Caracas', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  };
  return new Date().toLocaleDateString('en-CA', opciones); // Retorna "YYYY-MM-DD"
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarEliminarRenta() {
  console.log('🗑️ === INICIANDO ELIMINAR RENTA ===');

  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }

  if (typeof supabaseClient === 'undefined') {
    mostrarMensajeEliminar('Error: Supabase no está disponible', 'error');
    return;
  }

  await cargarUsuarioEliminar();
  await buscarRentasEliminar();

  console.log('✅ === ELIMINAR RENTA INICIALIZADO ===');
}

// ==========================================
// CARGAR USUARIO
// ==========================================
async function cargarUsuarioEliminar() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data, error } = await supabaseClient
      .from('usuarios')
      .select('*')
      .eq('email', session.user.email)
      .maybeSingle();

    if (data && !error) {
      usuarioActualEliminarRenta = data;
    } else {
      usuarioActualEliminarRenta = { email: session.user.email, id: session.user.id };
    }
  } catch (err) {
    console.error('Error al cargar usuario:', err);
  }
}

// ==========================================
// BUSCAR RENTAS CON FILTROS
// ==========================================
async function buscarRentasEliminar() {
  const filtroCliente = document.getElementById('filtroClienteEliminar')?.value.trim() || '';
  const filtroNumero = document.getElementById('filtroNumeroEliminar')?.value.trim() || '';
  const filtroDesde = document.getElementById('filtroFechaDesdeEliminar')?.value || '';
  const filtroHasta = document.getElementById('filtroFechaHastaEliminar')?.value || '';

  try {
    let query = supabaseClient
      .from('rentas')
      .select('*', { count: 'exact' })
      .order('fecha_creacion', { ascending: false });

    if (filtroCliente) query = query.ilike('cliente_nombre', `%${filtroCliente}%`);
    if (filtroNumero) query = query.ilike('numero_renta', `%${filtroNumero}%`);
    if (filtroDesde) query = query.gte('fecha_renta', filtroDesde);
    if (filtroHasta) query = query.lte('fecha_renta', filtroHasta);

    const desde = (paginaActualEliminar - 1) * POR_PAGINA_ELIMINAR;
    const hasta = desde + POR_PAGINA_ELIMINAR - 1;
    query = query.range(desde, hasta);

    const { data, error, count } = await query;
    if (error) throw error;

    rentasCacheEliminar = data || [];
    renderizarTablaRentasEliminar(count || 0);

  } catch (err) {
    console.error('Error al buscar rentas:', err);
    mostrarMensajeEliminar('Error al buscar rentas: ' + err.message, 'error');
  }
}

// ==========================================
// ✅ RENDERIZAR TABLA DE RENTAS (CON ESTADO DINÁMICO EN TIEMPO REAL)
// ==========================================
function renderizarTablaRentasEliminar(totalRegistros) {
  const tbody = document.getElementById('tbodyRentasEliminar');
  if (!tbody) return;

  if (rentasCacheEliminar.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
          <div style="font-size: 40px; margin-bottom: 10px;">📭</div>
          <div>No se encontraron rentas con los filtros aplicados</div>
        </td>
      </tr>`;
    document.getElementById('paginacionEliminar').innerHTML = '';
    return;
  }

  // ✅ Obtener fecha de hoy en Caracas para comparación en tiempo real
  const hoyCaracas = obtenerFechaHoyCaracas();
  console.log('🔍 Evaluando fechas. Hoy en Caracas es:', hoyCaracas);

  tbody.innerHTML = rentasCacheEliminar.map((renta, index) => {
    const globalIndex = (paginaActualEliminar - 1) * POR_PAGINA_ELIMINAR + index + 1;
    const fechaInicio = new Date(renta.fecha_renta + 'T12:00:00').toLocaleDateString('es-ES');
    const fechaDev = new Date(renta.fecha_devolucion + 'T12:00:00').toLocaleDateString('es-ES');
    
    // ✅ LÓGICA CLAVE: Normalizar la fecha de la BD a "YYYY-MM-DD" puro para comparar con seguridad
    const fechaDevStr = renta.fecha_devolucion ? renta.fecha_devolucion.split('T')[0] : '';
    
    let estadoReal = renta.estado;
    
    // Mensaje de depuración en consola para cada renta
    console.log(`📌 Renta: ${renta.numero_renta} | Estado BD: "${renta.estado}" | Devolución BD: "${fechaDevStr}" | ¿Es <= hoy (${hoyCaracas})? ${fechaDevStr <= hoyCaracas}`);

    if (renta.estado === 'activa' && fechaDevStr && fechaDevStr <= hoyCaracas) {
      estadoReal = 'vencida';
      console.log(`⚠️ ALERTA VISUAL: ${renta.numero_renta} forzada a mostrarse como VENCIDA`);
    }

    const estadoColors = {
      'activa': '#10b981',
      'devuelta': '#3b82f6',
      'vencida': '#ef4444',
      'cancelada': '#6b7280'
    };
    const colorEstado = estadoColors[estadoReal] || '#6b7280';

    return `
      <tr>
        <td>${globalIndex}</td>
        <td style="font-family: monospace; font-weight: 600; color: #1e3a8a;">${renta.numero_renta}</td>
        <td><strong>${renta.cliente_nombre}</strong></td>
        <td>${fechaInicio}</td>
        <td>${fechaDev}</td>
        <td style="text-align: right; font-weight: 600;">$${parseFloat(renta.total).toFixed(2)}</td>
        <td style="text-align: center;">
          <span style="background: ${colorEstado}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
            ${estadoReal}
          </span>
        </td>
        <td style="text-align: center;">
          <button type="button" onclick="seleccionarRentaEliminar('${renta.numero_renta}')" 
                  style="background: #fee2e2; color: #dc2626; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s;"
                  onmouseover="this.style.background='#dc2626'; this.style.color='white';"
                  onmouseout="this.style.background='#fee2e2'; this.style.color='#dc2626';"
                  title="Eliminar esta renta">
            🗑️ Eliminar
          </button>
        </td>
      </tr>
    `;
  }).join('');

  renderizarPaginacionEliminar(totalRegistros);
}

// ==========================================
// PAGINACIÓN
// ==========================================
function renderizarPaginacionEliminar(totalRegistros) {
  const cont = document.getElementById('paginacionEliminar');
  if (!cont) return;

  const totalPaginas = Math.ceil(totalRegistros / POR_PAGINA_ELIMINAR);
  
  if (totalPaginas <= 1) {
    cont.innerHTML = `<span style="color: #6b7280; font-size: 13px;">Total: ${totalRegistros} renta(s)</span>`;
    return;
  }

  let html = '';
  html += `<button type="button" onclick="cambiarPaginaEliminar(${paginaActualEliminar - 1})" 
           style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px;"
           ${paginaActualEliminar === 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>‹ Anterior</button>`;
  
  html += `<span style="color: #374151; font-size: 13px; font-weight: 600;">Página ${paginaActualEliminar} de ${totalPaginas}</span>`;
  
  html += `<button type="button" onclick="cambiarPaginaEliminar(${paginaActualEliminar + 1})" 
           style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px;"
           ${paginaActualEliminar === totalPaginas ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>Siguiente ›</button>`;
  
  html += `<span style="color: #6b7280; font-size: 13px;">Total: ${totalRegistros}</span>`;

  cont.innerHTML = html;
}

async function cambiarPaginaEliminar(nuevaPagina) {
  await buscarRentasEliminar();
  document.getElementById('fieldsetListaEliminar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// LIMPIAR FILTROS
// ==========================================
function limpiarFiltrosEliminar() {
  document.getElementById('filtroClienteEliminar').value = '';
  document.getElementById('filtroNumeroEliminar').value = '';
  document.getElementById('filtroFechaDesdeEliminar').value = '';
  document.getElementById('filtroFechaHastaEliminar').value = '';
  paginaActualEliminar = 1;
  buscarRentasEliminar();
}

// ==========================================
// SELECCIONAR RENTA PARA ELIMINAR
// ==========================================
async function seleccionarRentaEliminar(numeroRenta) {
  try {
    const { data: renta, error } = await supabaseClient
      .from('rentas')
      .select('*')
      .eq('numero_renta', numeroRenta)
      .single();

    if (error || !renta) {
      mostrarMensajeEliminar('No se pudo cargar la renta', 'error');
      return;
    }

    const { data: items, error: errorItems } = await supabaseClient
      .from('rentas_items')
      .select('*')
      .eq('renta_id', renta.id)
      .order('id', { ascending: true });

    if (errorItems) throw errorItems;

    rentaEliminarSeleccionada = renta;
    itemsEliminarSeleccionada = items || [];

    document.getElementById('eliminarNumeroRenta').textContent = ` - ${renta.numero_renta}`;
    document.getElementById('eliminarClienteNombre').value = renta.cliente_nombre || '';
    document.getElementById('eliminarClienteTelefono').value = renta.cliente_telefono || '';
    document.getElementById('eliminarClienteEmail').value = renta.cliente_email || '';
    document.getElementById('eliminarClienteDireccion').value = renta.cliente_direccion || '';
    document.getElementById('eliminarFechaRenta').value = renta.fecha_renta || '';
    document.getElementById('eliminarFechaDevolucion').value = renta.fecha_devolucion || '';
    document.getElementById('eliminarIngenieroNombre').value = renta.ingeniero_nombre || '';
    document.getElementById('eliminarIngenieroContacto').value = renta.ingeniero_contacto || '';
    document.getElementById('eliminarEstado').value = renta.estado || 'activa';
    document.getElementById('eliminarObservaciones').value = renta.observaciones || '';

    renderizarItemsEliminar();
    calcularTotalesEliminar();

    document.getElementById('eliminarMotivo').value = '';

    document.getElementById('fieldsetListaEliminar').style.display = 'none';
    document.getElementById('fieldsetDetalleEliminar').style.display = 'block';

    document.getElementById('fieldsetDetalleEliminar').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    console.error('Error al seleccionar renta:', err);
    mostrarMensajeEliminar('Error al cargar la renta: ' + err.message, 'error');
  }
}

// ==========================================
// RENDERIZAR ITEMS
// ==========================================
function renderizarItemsEliminar() {
  const tbody = document.getElementById('eliminarTbodyItems');
  if (!tbody) return;

  if (itemsEliminarSeleccionada.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 30px; color: #6b7280;">
          No hay equipos en esta renta.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = itemsEliminarSeleccionada.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td style="font-family: monospace; font-size: 11px;">${item.codigo_barras}</td>
      <td><strong>${item.nombre_equipo}</strong></td>
      <td>${item.serial || '-'}</td>
      <td style="text-align: right;">$${parseFloat(item.precio_unitario).toFixed(2)}</td>
      <td style="text-align: center;">${item.cantidad}</td>
      <td style="text-align: right;"><strong>$${parseFloat(item.subtotal).toFixed(2)}</strong></td>
    </tr>
  `).join('');
}

function calcularTotalesEliminar() {
  const subtotal = itemsEliminarSeleccionada.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
  const descuento = parseFloat(rentaEliminarSeleccionada?.descuento) || 0;
  const total = Math.max(0, subtotal - descuento);

  const elSubtotal = document.getElementById('eliminarSubtotal');
  const elDescuento = document.getElementById('eliminarDescuento');
  const elTotal = document.getElementById('eliminarTotal');
  if (elSubtotal) elSubtotal.textContent = `$${subtotal.toFixed(2)}`;
  if (elDescuento) elDescuento.textContent = `$${descuento.toFixed(2)}`;
  if (elTotal) elTotal.textContent = `$${total.toFixed(2)}`;
}

// ==========================================
// CONFIRMAR ELIMINACIÓN
// ==========================================
async function confirmarEliminacionRenta() {
  if (!rentaEliminarSeleccionada) return;

  const motivo = document.getElementById('eliminarMotivo')?.value.trim() || '';
  
  if (!motivo) {
    mostrarMensajeEliminar('Por favor ingrese el motivo de la eliminación', 'error');
    document.getElementById('eliminarMotivo').focus();
    return;
  }

  const confirmacion = confirm(`⚠️ ¿Está seguro de eliminar la renta #${rentaEliminarSeleccionada.numero_renta}?\n\nCliente: ${rentaEliminarSeleccionada.cliente_nombre}\nTotal: $${parseFloat(rentaEliminarSeleccionada.total).toFixed(2)}\n\nEsta acción no se puede deshacer (se guardará respaldo).`);
  
  if (!confirmacion) return;

  const btnEliminar = document.getElementById('btnEliminarRenta');
  if (btnEliminar) { 
    btnEliminar.disabled = true; 
    btnEliminar.textContent = '⏳ Eliminando...'; 
  }

  try {
    // 1. Insertar en tabla de respaldo
    const { data: rentaEliminada, error: errorRespaldoRenta } = await supabaseClient
      .from('rentas_eliminadas')
      .insert({
        numero_renta: rentaEliminarSeleccionada.numero_renta,
        serie: rentaEliminarSeleccionada.serie || 'RENT',
        fecha_renta: rentaEliminarSeleccionada.fecha_renta,
        fecha_devolucion: rentaEliminarSeleccionada.fecha_devolucion,
        cliente_nombre: rentaEliminarSeleccionada.cliente_nombre,
        cliente_telefono: rentaEliminarSeleccionada.cliente_telefono,
        cliente_email: rentaEliminarSeleccionada.cliente_email,
        cliente_direccion: rentaEliminarSeleccionada.cliente_direccion,
        ingeniero_nombre: rentaEliminarSeleccionada.ingeniero_nombre,
        ingeniero_contacto: rentaEliminarSeleccionada.ingeniero_contacto,
        subtotal: rentaEliminarSeleccionada.subtotal,
        descuento: rentaEliminarSeleccionada.descuento,
        total: rentaEliminarSeleccionada.total,
        estado: rentaEliminarSeleccionada.estado,
        observaciones: rentaEliminarSeleccionada.observaciones,
        usuario_registro: rentaEliminarSeleccionada.usuario_registro,
        usuario_registro_id: rentaEliminarSeleccionada.usuario_registro_id,
        eliminado_por_email: usuarioActualEliminarRenta?.email || 'unknown',
        eliminado_por_id: usuarioActualEliminarRenta?.id || null,
        motivo_eliminacion: motivo
      })
      .select()
      .single();

    if (errorRespaldoRenta) throw new Error('Error al crear respaldo de renta: ' + errorRespaldoRenta.message);

    // 2. Insertar items en tabla de respaldo
    for (const item of itemsEliminarSeleccionada) {
      const { error: errorRespaldoItem } = await supabaseClient
        .from('rentas_items_eliminadas')
        .insert({
          renta_eliminada_id: rentaEliminada.id,
          renta_id_original: item.renta_id,
          codigo_barras: item.codigo_barras,
          nombre_equipo: item.nombre_equipo,
          marca: item.marca,
          modelo: item.modelo,
          serial: item.serial,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal
        });

      if (errorRespaldoItem) throw new Error('Error al crear respaldo de item: ' + errorRespaldoItem.message);
    }

    // 3. Eliminar items de la tabla original
    const { error: errorDeleteItems } = await supabaseClient
      .from('rentas_items')
      .delete()
      .eq('renta_id', rentaEliminarSeleccionada.id);

    if (errorDeleteItems) throw new Error('Error al eliminar items: ' + errorDeleteItems.message);

    // 4. Eliminar renta de la tabla original
    const { error: errorDeleteRenta } = await supabaseClient
      .from('rentas')
      .delete()
      .eq('id', rentaEliminarSeleccionada.id);

    if (errorDeleteRenta) throw new Error('Error al eliminar renta: ' + errorDeleteRenta.message);

    // 5. Registrar en logs
    if (typeof registrarLog === 'function') {
      const descripcion = `Eliminó Renta #${rentaEliminarSeleccionada.numero_renta} | Cliente: ${rentaEliminarSeleccionada.cliente_nombre} | Total: $${parseFloat(rentaEliminarSeleccionada.total).toFixed(2)} | Equipos: ${itemsEliminarSeleccionada.length} | Motivo: ${motivo} | Eliminado por: ${usuarioActualEliminarRenta?.email || 'Desconocido'}`;
      await registrarLog('rentar', 'Renta eliminada', descripcion, 'error');
    }

    mostrarMensajeEliminar(`✅ Renta #${rentaEliminarSeleccionada.numero_renta} eliminada exitosamente`, 'exito');

    // Resetear silenciosamente y recargar
    rentaEliminarSeleccionada = null;
    itemsEliminarSeleccionada = [];
    document.getElementById('fieldsetListaEliminar').style.display = 'block';
    document.getElementById('fieldsetDetalleEliminar').style.display = 'none';
    
    if (btnEliminar) {
      btnEliminar.disabled = false;
      btnEliminar.textContent = '🗑️ Eliminar Renta Permanentemente';
    }

    setTimeout(() => {
      paginaActualEliminar = 1;
      buscarRentasEliminar();
    }, 1500);

  } catch (err) {
    console.error('Error al eliminar renta:', err);
    mostrarMensajeEliminar('Error al eliminar: ' + err.message, 'error');
    if (btnEliminar) { 
      btnEliminar.disabled = false; 
      btnEliminar.textContent = '🗑️ Eliminar Renta Permanentemente'; 
    }
  }
}

// ==========================================
// CANCELAR ELIMINACIÓN
// ==========================================
function cancelarEliminacion() {
  if (itemsEliminarSeleccionada.length > 0 && !confirm('¿Cancelar la eliminación?')) {
    return;
  }

  rentaEliminarSeleccionada = null;
  itemsEliminarSeleccionada = [];

  document.getElementById('fieldsetListaEliminar').style.display = 'block';
  document.getElementById('fieldsetDetalleEliminar').style.display = 'none';

  const btnEliminar = document.getElementById('btnEliminarRenta');
  if (btnEliminar) { 
    btnEliminar.disabled = false; 
    btnEliminar.textContent = '🗑️ Eliminar Renta Permanentemente'; 
  }

  document.getElementById('fieldsetListaEliminar').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// MOSTRAR MENSAJE
// ==========================================
function mostrarMensajeEliminar(texto, tipo) {
  const msg = document.getElementById('mensaje');
  if (msg) {
    msg.textContent = texto;
    msg.className = `mensaje ${tipo}`;
    setTimeout(() => { msg.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
    if (tipo === 'exito') {
      setTimeout(() => { if (msg.classList.contains('exito')) msg.className = 'mensaje'; }, 5000);
    }
  }
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 Eliminar Renta DOM cargado');
  inicializarEliminarRenta();
});
