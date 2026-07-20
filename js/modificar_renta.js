// ==========================================
// VARIABLES GLOBALES
// ==========================================
let rentasCache = [];
let paginaActualModificar = 1;
const POR_PAGINA_MODIFICAR = 20;
let rentaEditando = null;
let itemsEdicion = [];
let usuarioActualModificarRenta = null;
let fechaHoyStrModificar = '';

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
async function inicializarModificarRenta() {
  console.log('📝 === INICIANDO MODIFICAR RENTA ===');

  fechaHoyStrModificar = obtenerFechaHoyCaracas();
  console.log('📅 Fecha de hoy (Caracas) establecida en:', fechaHoyStrModificar);

  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }

  if (typeof supabaseClient === 'undefined') {
    mostrarMensajeModificar('Error: Supabase no está disponible', 'error');
    return;
  }

  await cargarUsuarioModificar();
  await buscarRentasModificar();

  const inputEquipo = document.getElementById('editBuscarEquipo');
  if (inputEquipo) {
    const nuevoInput = inputEquipo.cloneNode(true);
    inputEquipo.parentNode.replaceChild(nuevoInput, inputEquipo);
    nuevoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        agregarEquipoEdicion();
      }
    });
  }

  const telInput = document.getElementById('editClienteTelefono');
  if (telInput) {
    const nuevoTel = telInput.cloneNode(true);
    telInput.parentNode.replaceChild(nuevoTel, telInput);
    nuevoTel.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
    });
  }

  console.log('✅ === MODIFICAR RENTA INICIALIZADO ===');
}

// ==========================================
// CARGAR USUARIO
// ==========================================
async function cargarUsuarioModificar() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data, error } = await supabaseClient
      .from('usuarios')
      .select('*')
      .eq('email', session.user.email)
      .maybeSingle();

    if (data && !error) {
      usuarioActualModificarRenta = data;
    } else {
      usuarioActualModificarRenta = { email: session.user.email, id: session.user.id };
    }
  } catch (err) {
    console.error('Error al cargar usuario:', err);
  }
}

// ==========================================
// BUSCAR RENTAS CON FILTROS (ORDENADO POR FECHA DE CREACIÓN)
// ==========================================
async function buscarRentasModificar() {
  const filtroCliente = document.getElementById('filtroCliente')?.value.trim() || '';
  const filtroNumero = document.getElementById('filtroNumero')?.value.trim() || '';
  const filtroDesde = document.getElementById('filtroFechaDesde')?.value || '';
  const filtroHasta = document.getElementById('filtroFechaHasta')?.value || '';

  try {
    let query = supabaseClient
      .from('rentas')
      .select('*', { count: 'exact' })
      .order('fecha_creacion', { ascending: false });

    if (filtroCliente) query = query.ilike('cliente_nombre', `%${filtroCliente}%`);
    if (filtroNumero) query = query.ilike('numero_renta', `%${filtroNumero}%`);
    if (filtroDesde) query = query.gte('fecha_renta', filtroDesde);
    if (filtroHasta) query = query.lte('fecha_renta', filtroHasta);

    const desde = (paginaActualModificar - 1) * POR_PAGINA_MODIFICAR;
    const hasta = desde + POR_PAGINA_MODIFICAR - 1;
    query = query.range(desde, hasta);

    const { data, error, count } = await query;
    if (error) throw error;

    rentasCache = data || [];
    renderizarTablaRentasModificar(count || 0);

  } catch (err) {
    console.error('Error al buscar rentas:', err);
    mostrarMensajeModificar('Error al buscar rentas: ' + err.message, 'error');
  }
}

// ==========================================
// RENDERIZAR TABLA DE RENTAS (CON ESTADO DINÁMICO Y LOGS)
// ==========================================
function renderizarTablaRentasModificar(totalRegistros) {
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

  const hoy = obtenerFechaHoyCaracas();
  console.log('🔍 Evaluando fechas. Hoy es:', hoy);

  tbody.innerHTML = rentasCache.map((renta, index) => {
    const globalIndex = (paginaActualModificar - 1) * POR_PAGINA_MODIFICAR + index + 1;
    const fechaInicio = new Date(renta.fecha_renta + 'T12:00:00').toLocaleDateString('es-ES');
    const fechaDev = new Date(renta.fecha_devolucion + 'T12:00:00').toLocaleDateString('es-ES');
    
    // ✅ Lógica estricta para determinar el estado real
    let estadoReal = renta.estado;
    
    // Debug en consola para verificar qué está pasando
    console.log(`Renta: ${renta.numero_renta} | Estado BD: ${renta.estado} | Devolución: ${renta.fecha_devolucion} | ¿Es menor a hoy (${hoy})? ${renta.fecha_devolucion < hoy}`);

  if (renta.estado === 'activa' && renta.fecha_devolucion && renta.fecha_devolucion <= hoy) {
  estadoReal = 'vencida';
  console.log(`⚠️ ALERTA: ${renta.numero_renta} cambiada visualmente a VENCIDA (fecha_devolucion: ${renta.fecha_devolucion} <= hoy: ${hoy})`);
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
          <button type="button" onclick="seleccionarRentaModificar('${renta.numero_renta}')" 
                  style="background: #dbeafe; color: #1e3a8a; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s;"
                  onmouseover="this.style.background='#1e3a8a'; this.style.color='white';"
                  onmouseout="this.style.background='#dbeafe'; this.style.color='#1e3a8a';"
                  title="Editar esta renta">
            ✏️ Editar
          </button>
        </td>
      </tr>
    `;
  }).join('');

  renderizarPaginacionModificar(totalRegistros);
}

// ==========================================
// PAGINACIÓN
// ==========================================
function renderizarPaginacionModificar(totalRegistros) {
  const cont = document.getElementById('paginacion');
  if (!cont) return;

  const totalPaginas = Math.ceil(totalRegistros / POR_PAGINA_MODIFICAR);
  if (totalPaginas <= 1) {
    cont.innerHTML = `<span style="color: #6b7280; font-size: 13px;">Total: ${totalRegistros} renta(s)</span>`;
    return;
  }

  let html = '';
  html += `<button type="button" onclick="cambiarPaginaModificar(${paginaActualModificar - 1})" 
           style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px;"
           ${paginaActualModificar === 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>‹ Anterior</button>`;
  html += `<span style="color: #374151; font-size: 13px; font-weight: 600;">Página ${paginaActualModificar} de ${totalPaginas}</span>`;
  html += `<button type="button" onclick="cambiarPaginaModificar(${paginaActualModificar + 1})" 
           style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px;"
           ${paginaActualModificar === totalPaginas ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>Siguiente ›</button>`;
  html += `<span style="color: #6b7280; font-size: 13px;">Total: ${totalRegistros}</span>`;

  cont.innerHTML = html;
}

async function cambiarPaginaModificar(nuevaPagina) {
  await buscarRentasModificar();
  document.getElementById('fieldsetLista')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// LIMPIAR FILTROS
// ==========================================
function limpiarFiltrosModificar() {
  document.getElementById('filtroCliente').value = '';
  document.getElementById('filtroNumero').value = '';
  document.getElementById('filtroFechaDesde').value = '';
  document.getElementById('filtroFechaHasta').value = '';
  paginaActualModificar = 1;
  buscarRentasModificar();
}

// ==========================================
// SELECCIONAR RENTA PARA EDITAR
// ==========================================
async function seleccionarRentaModificar(numeroRenta) {
  try {
    const { data: renta, error } = await supabaseClient
      .from('rentas')
      .select('*')
      .eq('numero_renta', numeroRenta)
      .single();

    if (error || !renta) {
      mostrarMensajeModificar('No se pudo cargar la renta', 'error');
      return;
    }

    const { data: items, error: errorItems } = await supabaseClient
      .from('rentas_items')
      .select('*')
      .eq('renta_id', renta.id)
      .order('id', { ascending: true });

    if (errorItems) throw errorItems;

    rentaEditando = renta;
    itemsEdicion = items || [];

    document.getElementById('editNumeroRenta').textContent = ` - ${renta.numero_renta}`;
    document.getElementById('editClienteNombre').value = renta.cliente_nombre || '';
    document.getElementById('editClienteTelefono').value = renta.cliente_telefono || '';
    document.getElementById('editClienteEmail').value = renta.cliente_email || '';
    document.getElementById('editClienteDireccion').value = renta.cliente_direccion || '';
    document.getElementById('editIngenieroNombre').value = renta.ingeniero_nombre || '';
    document.getElementById('editIngenieroContacto').value = renta.ingeniero_contacto || '';
    document.getElementById('editEstado').value = renta.estado || 'activa';
    document.getElementById('editObservaciones').value = renta.observaciones || '';
    document.getElementById('editDescuento').value = renta.descuento || 0;

    const hoyCaracas = obtenerFechaHoyCaracas();
    const elFechaRenta = document.getElementById('editFechaRenta');
    const elFechaDevolucion = document.getElementById('editFechaDevolucion');

    if (elFechaRenta) {
      elFechaRenta.min = hoyCaracas; 
      elFechaRenta.value = hoyCaracas; 
    }
    if (elFechaDevolucion) {
      elFechaDevolucion.min = hoyCaracas;
      const fechaDev = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Caracas"}));
      fechaDev.setDate(fechaDev.getDate() + 7);
      const devYear = fechaDev.getFullYear();
      const devMonth = String(fechaDev.getMonth() + 1).padStart(2, '0');
      const devDay = String(fechaDev.getDate()).padStart(2, '0');
      elFechaDevolucion.value = `${devYear}-${devMonth}-${devDay}`;
    }

    if (elFechaRenta && elFechaDevolucion) {
      elFechaRenta.addEventListener('change', () => {
        elFechaDevolucion.min = elFechaRenta.value;
        if (elFechaDevolucion.value && elFechaDevolucion.value < elFechaRenta.value) {
          elFechaDevolucion.value = elFechaRenta.value;
        }
      });
    }

    renderizarItemsEdicion();
    calcularTotalesEdicion();

    document.getElementById('fieldsetLista').style.display = 'none';
    document.getElementById('fieldsetEdicion').style.display = 'block';
    document.getElementById('fieldsetEdicion').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    console.error('Error al seleccionar renta:', err);
    mostrarMensajeModificar('Error al cargar la renta: ' + err.message, 'error');
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
                style="background: #fee2e2; color: #dc2626; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
                onmouseover="this.style.background='#dc2626'; this.style.color='white';"
                onmouseout="this.style.background='#fee2e2'; this.style.color='#dc2626';"
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
    mostrarMensajeModificar('Por favor ingrese un código de barras', 'error');
    return;
  }

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
      mostrarMensajeModificar(`Equipo no encontrado: ${codigoFormateado}`, 'error');
      input.value = '';
      input.focus();
      return;
    }

    const existe = itemsEdicion.find(item => item.codigo_barras === data.codigo_barras);
    if (existe) {
      mostrarMensajeModificar('Este equipo ya está en la renta', 'error');
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
    mostrarMensajeModificar(`Equipo agregado: ${data.nombre_equipo}`, 'exito');

  } catch (err) {
    console.error('Error al agregar equipo:', err);
    mostrarMensajeModificar('Error al buscar equipo', 'error');
  }
}

// ==========================================
// GUARDAR CAMBIOS (CON LIMPIEZA AUTOMÁTICA)
// ==========================================
async function guardarCambiosRenta() {
  if (!rentaEditando) return;

  const clienteNombre = document.getElementById('editClienteNombre')?.value.trim() || '';
  const fechaRenta = document.getElementById('editFechaRenta')?.value || '';
  const fechaDevolucion = document.getElementById('editFechaDevolucion')?.value || '';

  if (!clienteNombre) {
    mostrarMensajeModificar('Por favor ingrese el nombre del cliente', 'error');
    return;
  }
  if (!fechaRenta || !fechaDevolucion) {
    mostrarMensajeModificar('Por favor ingrese las fechas de renta y devolución', 'error');
    return;
  }
  if (fechaRenta < fechaHoyStrModificar) {
    mostrarMensajeModificar('La fecha de inicio no puede ser anterior al día actual (Caracas)', 'error');
    return;
  }
  if (fechaDevolucion < fechaRenta) {
    mostrarMensajeModificar('La fecha de devolución no puede ser anterior a la fecha de inicio', 'error');
    return;
  }
  if (itemsEdicion.length === 0) {
    mostrarMensajeModificar('Debe haber al menos un equipo en la renta', 'error');
    return;
  }

  const btnGuardar = document.getElementById('btnGuardarCambios');
  if (btnGuardar) { 
    btnGuardar.disabled = true; 
    btnGuardar.textContent = '⏳ Guardando...'; 
  }

  try {
    const subtotal = itemsEdicion.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    const descuento = parseFloat(document.getElementById('editDescuento')?.value) || 0;
    const total = Math.max(0, subtotal - descuento);

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
        observaciones: document.getElementById('editObservaciones')?.value.trim() || ''
      })
      .eq('id', rentaEditando.id);

    if (errorRenta) throw errorRenta;

    const { error: errorDelete } = await supabaseClient
      .from('rentas_items')
      .delete()
      .eq('renta_id', rentaEditando.id);

    if (errorDelete) throw errorDelete;

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

    if (typeof registrarLog === 'function') {
      const descripcion = `Modificó Renta #${rentaEditando.numero_renta} | Cliente: ${clienteNombre} | Total: $${total.toFixed(2)} | Equipos: ${itemsEdicion.length} | Modificado por: ${usuarioActualModificarRenta?.email || 'Desconocido'}`;
      await registrarLog('rentar', 'Renta modificada', descripcion, 'warning');
    }

    mostrarMensajeModificar(`✅ Renta #${rentaEditando.numero_renta} modificada exitosamente`, 'exito');

    rentaEditando = null;
    itemsEdicion = [];
    
    ['editClienteNombre', 'editClienteTelefono', 'editClienteEmail', 'editClienteDireccion', 'editIngenieroNombre', 'editIngenieroContacto', 'editObservaciones'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const editDescuento = document.getElementById('editDescuento');
    if (editDescuento) editDescuento.value = '0';

    document.getElementById('fieldsetLista').style.display = 'block';
    document.getElementById('fieldsetEdicion').style.display = 'none';
    
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.textContent = '💾 Guardar Cambios';
    }

    setTimeout(() => {
      paginaActualModificar = 1;
      buscarRentasModificar();
    }, 1500);

  } catch (err) {
    console.error('Error al guardar cambios:', err);
    mostrarMensajeModificar('Error al guardar: ' + err.message, 'error');
    
    if (btnGuardar) { 
      btnGuardar.disabled = false; 
      btnGuardar.textContent = '💾 Guardar Cambios'; 
    }
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

  const btnGuardar = document.getElementById('btnGuardarCambios');
  if (btnGuardar) {
    btnGuardar.disabled = false;
    btnGuardar.textContent = '💾 Guardar Cambios';
  }

  document.getElementById('fieldsetLista').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// MOSTRAR MENSAJE
// ==========================================
function mostrarMensajeModificar(texto, tipo) {
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
// IMPRIMIR COMPROBANTE DE RENTA MODIFICADA (CORREGIDO)
// ==========================================
function imprimirComprobanteModificacion() {
  if (!rentaEditando) {
    mostrarMensajeModificar('No hay ninguna renta seleccionada para imprimir', 'error');
    return;
  }

  const clienteNombre = document.getElementById('editClienteNombre')?.value || 'N/A';
  const clienteTel = document.getElementById('editClienteTelefono')?.value || 'N/A';
  const clienteEmail = document.getElementById('editClienteEmail')?.value || 'N/A';
  const clienteDir = document.getElementById('editClienteDireccion')?.value || 'N/A';
  const fechaRenta = document.getElementById('editFechaRenta')?.value || '';
  const fechaDevolucion = document.getElementById('editFechaDevolucion')?.value || '';
  const ingenieroNombre = document.getElementById('editIngenieroNombre')?.value || 'N/A';
  const ingenieroContacto = document.getElementById('editIngenieroContacto')?.value || 'N/A';
  const observaciones = document.getElementById('editObservaciones')?.value || '';
  const subtotal = document.getElementById('editSubtotal')?.textContent || '$0.00';
  const descuento = document.getElementById('editDescuento')?.value || '0';
  const total = document.getElementById('editTotal')?.textContent || '$0.00';
  
  // ✅ CORRECCIÓN: Leer el estado de la base de datos
  let estado = document.getElementById('editEstado')?.value || 'activa';
  
  // ✅ APLICAR LÓGICA DE VENCIDO (Caracas) PARA LA IMPRESIÓN
  const hoyCaracas = obtenerFechaHoyCaracas();
  if (estado === 'activa' && fechaDevolucion && fechaDevolucion <= hoyCaracas) {
    estado = 'vencida';
  }

  const logoUrl = new URL('img/logo.png', window.location.href).href;

  const itemsHTML = itemsEdicion.map((item, i) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${i + 1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 10px;">${item.codigo_barras}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>${item.nombre_equipo}</strong><br><small style="color:#666;">${item.marca || ''} ${item.modelo || ''}</small></td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.serial || '-'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${parseFloat(item.precio_unitario).toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.cantidad}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong>$${parseFloat(item.subtotal).toFixed(2)}</strong></td>
    </tr>
  `).join('');

  const ventana = window.open('', '_blank', 'width=900,height=1100');
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Comprobante de Renta #${rentaEditando.numero_renta}</title>
  <style>
    @page { size: letter; margin: 15mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #333; max-width: 216mm; margin: 0 auto; padding: 10mm; }
    .header { text-align: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; }
    .logo-container { display: flex; justify-content: center; align-items: center; margin-bottom: 10px; }
    .logo-img { max-width: 200px; max-height: 200px; object-fit: contain; }
    .brand h1 { color: #1e3a8a; margin: 10px 0 5px 0; font-size: 26px; font-family: 'Libre Caslon Text', serif; }
    .brand p { margin: 3px 0 0 0; color: #666; font-size: 12px; }
    .numero-renta-box { background: linear-gradient(135deg, #eff6ff, #dbeafe); padding: 12px 20px; border-radius: 8px; margin: 15px auto; display: inline-block; border: 2px dashed #3b82f6; }
    .numero-renta-box .label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    .numero-renta-box .valor { font-size: 22px; font-weight: bold; color: #1e3a8a; font-family: monospace; margin-top: 3px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .info-box { background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; }
    .info-box h3 { margin: 0 0 10px 0; color: #1e3a8a; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
    .info-box p { margin: 5px 0; font-size: 12px; }
    .info-box p strong { color: #374151; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #1e3a8a; color: white; padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; }
    td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
    .totales { text-align: right; margin-top: 20px; padding: 15px; background: #eff6ff; border-radius: 8px; }
    .totales p { margin: 5px 0; font-size: 13px; }
    .totales .total { font-size: 20px; font-weight: bold; color: #1e3a8a; border-top: 2px solid #1e3a8a; padding-top: 10px; margin-top: 10px; }
    .observaciones { margin-top: 20px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; }
    .observaciones h4 { margin: 0 0 5px 0; color: #92400e; font-size: 12px; }
    .observaciones p { margin: 0; font-size: 12px; }
    .estado-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; color: white; margin-top: 5px; }
    .firmas { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; text-align: center; }
    .firma-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; }
    .firma-line p { margin: 3px 0; font-size: 12px; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    .reimpresion-aviso { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 8px 12px; border-radius: 6px; font-size: 11px; color: #92400e; margin-bottom: 15px; text-align: center; }
    @media print { .no-print { display: none !important; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-container">
      <img src="${logoUrl}" alt="Logo Eventos D' Primera" class="logo-img" onerror="this.style.display='none'">
    </div>
    <div class="brand">
      <h1>Eventos D' Primera</h1>
      <p>Sistema de Inventario y Rentas</p>
    </div>
    <div class="numero-renta-box">
      <div class="label">Comprobante de Renta N°</div>
      <div class="valor">${rentaEditando.numero_renta}</div>
    </div>
  </div>

  <div class="reimpresion-aviso">
     Documento reimpreso el ${new Date().toLocaleString('es-ES')}
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3> Cliente / Responsable</h3>
      <p><strong>Nombre:</strong> ${clienteNombre}</p>
      <p><strong>Teléfono:</strong> ${clienteTel}</p>
      <p><strong>Email:</strong> ${clienteEmail}</p>
      <p><strong>Dirección:</strong> ${clienteDir}</p>
    </div>
    <div class="info-box">
      <h3>📅 Detalles de Renta</h3>
      <p><strong>Fecha Inicio:</strong> ${fechaRenta ? new Date(fechaRenta + 'T12:00:00').toLocaleDateString('es-ES') : 'N/A'}</p>
      <p><strong>Fecha Devolución:</strong> ${fechaDevolucion ? new Date(fechaDevolucion + 'T12:00:00').toLocaleDateString('es-ES') : 'N/A'}</p>
      <p><strong>Ingeniero:</strong> ${ingenieroNombre}</p>
      <p><strong>Contacto Ing.:</strong> ${ingenieroContacto}</p>
      <p><strong>Estado:</strong> 
        <span class="estado-badge" style="background: ${
          estado === 'activa' ? '#10b981' : 
          estado === 'devuelta' ? '#3b82f6' : 
          estado === 'vencida' ? '#ef4444' : '#6b7280'
        };">${estado}</span>
      </p>
    </div>
  </div>

  <h3 style="margin: 20px 0 10px 0; color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px;"> Equipos Rentados (${itemsEdicion.length})</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 30px;">#</th>
        <th style="width: 130px;">Código</th>
        <th>Equipo</th>
        <th style="width: 100px;">Serial</th>
        <th style="text-align: right; width: 80px;">Precio</th>
        <th style="text-align: center; width: 50px;">Cant.</th>
        <th style="text-align: right; width: 90px;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <div class="totales">
    <p>Subtotal: <strong>${subtotal}</strong></p>
    <p>Descuento: <strong>$${parseFloat(descuento).toFixed(2)}</strong></p>
    <p class="total">TOTAL: <strong>${total}</strong></p>
  </div>

  ${observaciones ? `
  <div class="observaciones">
    <h4>📝 Observaciones</h4>
    <p>${observaciones}</p>
  </div>
  ` : ''}

  <div class="firmas">
    <div>
      <div class="firma-line">
        <p><strong>${clienteNombre}</strong></p>
        <p>Cliente / Responsable</p>
        <p style="font-size: 10px; color: #666;">Firma de conformidad</p>
      </div>
    </div>
    <div>
      <div class="firma-line">
        <p><strong>${usuarioActualModificarRenta?.email || 'Administrador'}</strong></p>
        <p>Entregado por</p>
        <p style="font-size: 10px; color: #666;">Firma del responsable</p>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>©copyright Eventos de Primera | 2026-2027 | Documento reimpreso el ${new Date().toLocaleString('es-ES')}</p>
  </div>

  <div class="no-print" style="margin-top: 30px; text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
    <button onclick="window.print()" style="padding: 12px 30px; background: #1e3a8a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-right: 10px;">🖨️ Imprimir Comprobante</button>
    <button onclick="window.close()" style="padding: 12px 30px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">❌ Cerrar</button>
  </div>
</body>
</html>`;

  ventana.document.write(html);
  ventana.document.close();
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 Modificar Renta DOM cargado');
  inicializarModificarRenta();
});
