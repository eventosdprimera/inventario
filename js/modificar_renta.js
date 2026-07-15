// ==========================================
// VARIABLES GLOBALES
// ==========================================
let rentasCache = [];
let paginaActual = 1;
const POR_PAGINA = 20;
let rentaEditando = null;
let itemsEdicion = [];
let usuarioActual = null;
let fechaHoyStr = '';

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarModificarRenta() {
  console.log('📝 === INICIANDO MODIFICAR RENTA ===');

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
  
  const hoy = new Date();
  fechaHoyStr = hoy.toISOString().split('T')[0];
  
  // Cargar últimas 20 rentas al iniciar
  await buscarRentas();

  // Enter en búsqueda de equipos
  const inputEquipo = document.getElementById('editBuscarEquipo');
  if (inputEquipo) {
    inputEquipo.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        agregarEquipoEdicion();
      }
    });
  }

  // Solo números en teléfono
  const telInput = document.getElementById('editClienteTelefono');
  if (telInput) {
    telInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
    });
  }

  console.log('✅ === MODIFICAR RENTA INICIALIZADO ===');
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
      usuarioActual = data;
    } else {
      usuarioActual = { email: session.user.email, id: session.user.id };
    }
  } catch (err) {
    console.error('Error al cargar usuario:', err);
  }
}

// ==========================================
// BUSCAR RENTAS CON FILTROS
// ==========================================
async function buscarRentas() {
  const filtroCliente = document.getElementById('filtroCliente')?.value.trim() || '';
  const filtroNumero = document.getElementById('filtroNumero')?.value.trim() || '';
  const filtroDesde = document.getElementById('filtroFechaDesde')?.value || '';
  const filtroHasta = document.getElementById('filtroFechaHasta')?.value || '';

  try {
    let query = supabaseClient
      .from('rentas')
      .select('*', { count: 'exact' })
      .order('fecha_renta', { ascending: false });

    if (filtroCliente) {
      query = query.ilike('cliente_nombre', `%${filtroCliente}%`);
    }
    if (filtroNumero) {
      query = query.ilike('numero_renta', `%${filtroNumero}%`);
    }
    if (filtroDesde) {
      query = query.gte('fecha_renta', filtroDesde);
    }
    if (filtroHasta) {
      query = query.lte('fecha_renta', filtroHasta);
    }

    // Paginación
    const desde = (paginaActual - 1) * POR_PAGINA;
    const hasta = desde + POR_PAGINA - 1;
    query = query.range(desde, hasta);

    const { data, error, count } = await query;

    if (error) throw error;

    rentasCache = data || [];
    renderizarTablaRentas(count || 0);

  } catch (err) {
    console.error('Error al buscar rentas:', err);
    mostrarMensaje('Error al buscar rentas: ' + err.message, 'error');
  }
}

// ==========================================
// RENDERIZAR TABLA DE RENTAS
// ==========================================
function renderizarTablaRentas(totalRegistros) {
  const tbody = document.getElementById('tbodyRentas');
  if (!tbody) return;

  if (rentasCache.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
          <div style="font-size: 40px; margin-bottom: 10px;">📭</div>
          <div>No se encontraron rentas con los filtros aplicados</div>
        </td>
      </tr>`;
    document.getElementById('paginacion').innerHTML = '';
    return;
  }

  tbody.innerHTML = rentasCache.map((renta, index) => {
    const globalIndex = (paginaActual - 1) * POR_PAGINA + index + 1;
    const fechaInicio = new Date(renta.fecha_renta + 'T12:00:00').toLocaleDateString('es-ES');
    const fechaDev = new Date(renta.fecha_devolucion + 'T12:00:00').toLocaleDateString('es-ES');
    
    const estadoColors = {
      'activa': '#10b981',
      'devuelta': '#3b82f6',
      'vencida': '#ef4444',
      'cancelada': '#6b7280'
    };
    const colorEstado = estadoColors[renta.estado] || '#6b7280';

    return `
      <tr>
        <td>${globalIndex}</td>
        <td style="font-family: monospace; font-weight: 600; color: #1e3a8a;">${renta.numero_renta}</td>
        <td><strong>${renta.cliente_nombre}</strong></td>
        <td>${fechaInicio}</td>
        <td>${fechaDev}</td>
        <td style="text-align: right; font-weight: 600;">$${parseFloat(renta.total).toFixed(2)}</td>
        <td style="text-align: center;">
          <span style="background: ${colorEstado}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 11px; text-transform: capitalize;">
            ${renta.estado}
          </span>
        </td>
        <td style="text-align: center;">
          <button type="button" onclick="seleccionarRenta('${renta.numero_renta}')" 
                  style="background: #dbeafe; color: #1e3a8a; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;"
                  title="Editar esta renta">
            ✏️ Editar
          </button>
        </td>
      </tr>
    `;
  }).join('');

  renderizarPaginacion(totalRegistros);
}

// ==========================================
// PAGINACIÓN
// ==========================================
function renderizarPaginacion(totalRegistros) {
  const cont = document.getElementById('paginacion');
  if (!cont) return;

  const totalPaginas = Math.ceil(totalRegistros / POR_PAGINA);
  
  if (totalPaginas <= 1) {
    cont.innerHTML = `<span style="color: #6b7280; font-size: 13px;">Total: ${totalRegistros} renta(s)</span>`;
    return;
  }

  let html = '';
  html += `<button type="button" onclick="cambiarPagina(${paginaActual - 1})" ${paginaActual === 1 ? 'disabled' : ''} 
           style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px;"
           ${paginaActual === 1 ? 'style="opacity: 0.4; cursor: not-allowed;"' : ''}>‹ Anterior</button>`;
  
  html += `<span style="color: #374151; font-size: 13px; font-weight: 600;">Página ${paginaActual} de ${totalPaginas}</span>`;
  
  html += `<button type="button" onclick="cambiarPagina(${paginaActual + 1})" 
           style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px;"
           ${paginaActual === totalPaginas ? 'style="opacity: 0.4; cursor: not-allowed;"' : ''}>Siguiente ›</button>`;
  
  html += `<span style="color: #6b7280; font-size: 13px;">Total: ${totalRegistros} renta(s)</span>`;

  cont.innerHTML = html;
}

async function cambiarPagina(nuevaPagina) {
  const totalRegistros = rentasCache.length;
  const totalPaginas = Math.ceil(totalRegistros / POR_PAGINA);
  
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
  
  paginaActual = nuevaPagina;
  await buscarRentas();
  
  // Scroll al inicio de la lista
  document.getElementById('fieldsetLista')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// LIMPIAR FILTROS
// ==========================================
function limpiarFiltros() {
  document.getElementById('filtroCliente').value = '';
  document.getElementById('filtroNumero').value = '';
  document.getElementById('filtroFechaDesde').value = '';
  document.getElementById('filtroFechaHasta').value = '';
  paginaActual = 1;
  buscarRentas();
}

// ==========================================
// SELECCIONAR RENTA PARA EDITAR
// ==========================================
async function seleccionarRenta(numeroRenta) {
  try {
    // Cargar datos de la renta
    const { data: renta, error } = await supabaseClient
      .from('rentas')
      .select('*')
      .eq('numero_renta', numeroRenta)
      .single();

    if (error || !renta) {
      mostrarMensaje('No se pudo cargar la renta', 'error');
      return;
    }

    // Cargar items de la renta
    const { data: items, error: errorItems } = await supabaseClient
      .from('rentas_items')
      .select('*')
      .eq('renta_id', renta.id)
      .order('id', { ascending: true });

    if (errorItems) throw errorItems;

    rentaEditando = renta;
    itemsEdicion = items || [];

    // Llenar formulario
    document.getElementById('editNumeroRenta').textContent = ` - ${renta.numero_renta}`;
    document.getElementById('editClienteNombre').value = renta.cliente_nombre || '';
    document.getElementById('editClienteTelefono').value = renta.cliente_telefono || '';
    document.getElementById('editClienteEmail').value = renta.cliente_email || '';
    document.getElementById('editClienteDireccion').value = renta.cliente_direccion || '';
    document.getElementById('editFechaRenta').value = renta.fecha_renta || '';
    document.getElementById('editFechaDevolucion').value = renta.fecha_devolucion || '';
    document.getElementById('editIngenieroNombre').value = renta.ingeniero_nombre || '';
    document.getElementById('editIngenieroContacto').value = renta.ingeniero_contacto || '';
    document.getElementById('editEstado').value = renta.estado || 'activa';
    document.getElementById('editObservaciones').value = renta.observaciones || '';
    document.getElementById('editDescuento').value = renta.descuento || 0;

    // Validar fechas mínimas
    const elFechaRenta = document.getElementById('editFechaRenta');
    const elFechaDevolucion = document.getElementById('editFechaDevolucion');
    if (elFechaRenta) elFechaRenta.min = fechaHoyStr;
    if (elFechaDevolucion) elFechaDevolucion.min = fechaHoyStr;

    if (elFechaRenta && elFechaDevolucion) {
      elFechaRenta.addEventListener('change', () => {
        elFechaDevolucion.min = elFechaRenta.value;
        if (elFechaDevolucion.value && elFechaDevolucion.value < elFechaRenta.value) {
          elFechaDevolucion.value = elFechaRenta.value;
        }
      });
    }

    // Renderizar items
    renderizarItemsEdicion();
    calcularTotalesEdicion();

    // Mostrar formulario de edición, ocultar lista
    document.getElementById('fieldsetLista').style.display = 'none';
    document.getElementById('fieldsetEdicion').style.display = 'block';

    // Scroll al formulario
    document.getElementById('fieldsetEdicion').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    console.error('Error al seleccionar renta:', err);
    mostrarMensaje('Error al cargar la renta: ' + err.message, 'error');
  }
}

// ==========================================
// RENDERIZAR ITEMS EN EDICIÓN
// ==========================================
function renderizarItemsEdicion() {
  const tbody = document.getElementById('editTbodyItems');
  if (!tbody) return;

  if (itemsEdicion.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 30px; color: #6b7280;">
          No hay equipos en esta renta. Agregue equipos usando el buscador.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = itemsEdicion.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td style="font-family: monospace; font-size: 11px;">${item.codigo_barras}</td>
      <td><strong>${item.nombre_equipo}</strong></td>
      <td>${item.serial || '-'}</td>
      <td style="text-align: right;">$${parseFloat(item.precio_unitario).toFixed(2)}</td>
      <td style="text-align: center;">
        <input type="number" min="1" value="${item.cantidad}" 
               style="width: 60px; padding: 4px 8px; border: 1px solid #e5e7eb; border-radius: 4px; text-align: center;"
               onchange="actualizarCantidadEdicion(${index}, this.value)">
      </td>
      <td style="text-align: right;"><strong>$${parseFloat(item.subtotal).toFixed(2)}</strong></td>
      <td style="text-align: center;">
        <button type="button" onclick="eliminarItemEdicion(${index})" 
                style="background: #fee2e2; color: #dc2626; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;"
                title="Eliminar equipo">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

function actualizarCantidadEdicion(index, cantidad) {
  const qty = parseInt(cantidad) || 1;
  itemsEdicion[index].cantidad = qty;
  itemsEdicion[index].subtotal = parseFloat(itemsEdicion[index].precio_unitario) * qty;
  renderizarItemsEdicion();
  calcularTotalesEdicion();
}

function eliminarItemEdicion(index) {
  if (confirm('¿Eliminar este equipo de la renta?')) {
    itemsEdicion.splice(index, 1);
    renderizarItemsEdicion();
    calcularTotalesEdicion();
  }
}

function calcularTotalesEdicion() {
  const subtotal = itemsEdicion.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
  const descuento = parseFloat(document.getElementById('editDescuento')?.value) || 0;
  const total = Math.max(0, subtotal - descuento);

  const elSubtotal = document.getElementById('editSubtotal');
  const elTotal = document.getElementById('editTotal');
  if (elSubtotal) elSubtotal.textContent = `$${subtotal.toFixed(2)}`;
  if (elTotal) elTotal.textContent = `$${total.toFixed(2)}`;
}

// ==========================================
// AGREGAR EQUIPO EN EDICIÓN
// ==========================================
async function agregarEquipoEdicion() {
  const input = document.getElementById('editBuscarEquipo');
  if (!input) return;

  let codigo = input.value.trim();
  if (!codigo) {
    alert('Por favor ingrese un código de barras');
    return;
  }

  // Formatear código
  let codigoLimpio = codigo.replace(/-/g, '').toUpperCase();
  let codigoFormateado = '';
  if (codigoLimpio.length > 0) codigoFormateado = codigoLimpio.substring(0, 2);
  if (codigoLimpio.length > 2) codigoFormateado += '-' + codigoLimpio.substring(2, 10);
  if (codigoLimpio.length > 10) codigoFormateado += '-' + codigoLimpio.substring(10, 16);
  if (codigoLimpio.length > 16) codigoFormateado += '-' + codigoLimpio.substring(16, 22);

  try {
    const { data, error } = await supabaseClient
      .from('equipos')
      .select('*')
      .or(`codigo_barras.eq.${codigoFormateado},serial.eq.${codigoFormateado}`)
      .maybeSingle();

    if (error || !data) {
      alert(`Equipo no encontrado: ${codigoFormateado}`);
      input.value = '';
      input.focus();
      return;
    }

    // Verificar si ya está en la renta
    const existe = itemsEdicion.find(item => item.codigo_barras === data.codigo_barras);
    if (existe) {
      alert('Este equipo ya está en la renta');
      input.value = '';
      input.focus();
      return;
    }

    const precioUnitario = data.costo || 0;
    itemsEdicion.push({
      codigo_barras: data.codigo_barras,
      nombre_equipo: data.nombre_equipo,
      marca: data.marca,
      modelo: data.modelo,
      serial: data.serial,
      cantidad: 1,
      precio_unitario: precioUnitario,
      subtotal: precioUnitario
    });

    input.value = '';
    input.focus();

    renderizarItemsEdicion();
    calcularTotalesEdicion();

  } catch (err) {
    console.error('Error al agregar equipo:', err);
    alert('Error al buscar equipo');
  }
}

// ==========================================
// GUARDAR CAMBIOS
// ==========================================
async function guardarCambiosRenta() {
  if (!rentaEditando) return;

  const clienteNombre = document.getElementById('editClienteNombre')?.value.trim() || '';
  const fechaRenta = document.getElementById('editFechaRenta')?.value || '';
  const fechaDevolucion = document.getElementById('editFechaDevolucion')?.value || '';

  if (!clienteNombre) {
    mostrarMensaje('Por favor ingrese el nombre del cliente', 'error');
    return;
  }
  if (!fechaRenta || !fechaDevolucion) {
    mostrarMensaje('Por favor ingrese las fechas de renta y devolución', 'error');
    return;
  }
  if (fechaRenta < fechaHoyStr) {
    mostrarMensaje('La fecha de inicio no puede ser anterior al día actual', 'error');
    return;
  }
  if (fechaDevolucion < fechaRenta) {
    mostrarMensaje('La fecha de devolución no puede ser anterior a la fecha de inicio', 'error');
    return;
  }
  if (itemsEdicion.length === 0) {
    mostrarMensaje('Debe haber al menos un equipo en la renta', 'error');
    return;
  }

  const btnGuardar = document.getElementById('btnGuardarCambios');
  if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.textContent = '⏳ Guardando...'; }

  try {
    const subtotal = itemsEdicion.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    const descuento = parseFloat(document.getElementById('editDescuento')?.value) || 0;
    const total = Math.max(0, subtotal - descuento);

    // Actualizar renta
    const { error: errorRenta } = await supabaseClient
      .from('rentas')
      .update({
        cliente_nombre: clienteNombre,
        cliente_telefono: document.getElementById('editClienteTelefono')?.value.trim() || '',
        cliente_email: document.getElementById('editClienteEmail')?.value.trim() || '',
        cliente_direccion: document.getElementById('editClienteDireccion')?.value.trim() || '',
        fecha_renta: fechaRenta,
        fecha_devolucion: fechaDevolucion,
        ingeniero_nombre: document.getElementById('editIngenieroNombre')?.value.trim() || '',
        ingeniero_contacto: document.getElementById('editIngenieroContacto')?.value.trim() || '',
        estado: document.getElementById('editEstado')?.value || 'activa',
        subtotal: subtotal,
        descuento: descuento,
        total: total,
        observaciones: document.getElementById('editObservaciones')?.value.trim() || '',
        usuario_modificacion: usuarioActual?.email || 'unknown'
      })
      .eq('id', rentaEditando.id);

    if (errorRenta) throw errorRenta;

    // Eliminar items antiguos
    const { error: errorDelete } = await supabaseClient
      .from('rentas_items')
      .delete()
      .eq('renta_id', rentaEditando.id);

    if (errorDelete) throw errorDelete;

    // Insertar items nuevos
    for (const item of itemsEdicion) {
      const { error: errorItem } = await supabaseClient
        .from('rentas_items')
        .insert({
          renta_id: rentaEditando.id,
          codigo_barras: item.codigo_barras,
          nombre_equipo: item.nombre_equipo,
          marca: item.marca,
          modelo: item.modelo,
          serial: item.serial,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal
        });

      if (errorItem) throw errorItem;
    }

    // Registrar en logs
    if (typeof registrarLog === 'function') {
      const descripcion = `Modificó Renta #${rentaEditando.numero_renta} | Cliente: ${clienteNombre} | Total: $${total.toFixed(2)} | Equipos: ${itemsEdicion.length} | Modificado por: ${usuarioActual?.email || 'Desconocido'}`;
      await registrarLog('rentar', 'Renta modificada', descripcion, 'warning');
    }

    mostrarMensaje(`✅ Renta #${rentaEditando.numero_renta} modificada exitosamente`, 'exito');

    // Volver a la lista después de 2 segundos
    setTimeout(() => {
      cancelarEdicion();
      paginaActual = 1;
      buscarRentas();
    }, 2000);

  } catch (err) {
    console.error('Error al guardar cambios:', err);
    mostrarMensaje('Error al guardar: ' + err.message, 'error');
    if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = '💾 Guardar Cambios'; }
  }
}

// ==========================================
// CANCELAR EDICIÓN
// ==========================================
function cancelarEdicion() {
  if (itemsEdicion.length > 0 && !confirm('¿Cancelar la edición? Los cambios no guardados se perderán.')) {
    return;
  }

  rentaEditando = null;
  itemsEdicion = [];

  document.getElementById('fieldsetLista').style.display = 'block';
  document.getElementById('fieldsetEdicion').style.display = 'none';

  document.getElementById('fieldsetLista').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// MOSTRAR MENSAJE
// ==========================================
function mostrarMensaje(texto, tipo) {
  const msg = document.getElementById('mensaje');
  if (msg) {
    msg.textContent = texto;
    msg.className = `mensaje ${tipo}`;
    
    setTimeout(() => {
      msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    
    if (tipo === 'exito') {
      setTimeout(() => { 
        if (msg.classList.contains('exito')) msg.className = 'mensaje'; 
      }, 5000);
    }
  }
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 Modificar Renta DOM cargado');
  inicializarModificarRenta();
});
