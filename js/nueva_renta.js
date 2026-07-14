// ==========================================
// VARIABLES GLOBALES
// ==========================================
let numeroRentaActual = null;
let itemsRenta = [];
let usuarioActualRenta = null;
let rentaGuardadaId = null;

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarNuevaRenta() {
  console.log('🤝 === INICIANDO NUEVA RENTA ===');

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
  await generarNumeroRenta();
  
  const hoy = new Date();
  const elFechaRenta = document.getElementById('fechaRenta');
  const elFechaDevolucion = document.getElementById('fechaDevolucion');
  const elFechaEmision = document.getElementById('fechaEmision');
  
  if (elFechaRenta) elFechaRenta.value = hoy.toISOString().split('T')[0];
  
  if (elFechaDevolucion) {
    const fechaDev = new Date();
    fechaDev.setDate(fechaDev.getDate() + 7);
    elFechaDevolucion.value = fechaDev.toISOString().split('T')[0];
  }
  
  if (elFechaEmision) {
    elFechaEmision.textContent = hoy.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  const inputBusqueda = document.getElementById('buscarEquipoInput');
  if (inputBusqueda) {
    inputBusqueda.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        agregarEquipo();
      }
    });
  }

  console.log('✅ === NUEVA RENTA INICIALIZADA ===');
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
      usuarioActualRenta = data;
    } else {
      usuarioActualRenta = { email: session.user.email, id: session.user.id };
    }
  } catch (err) {
    console.error('❌ Error al cargar usuario:', err);
  }
}

// ==========================================
// GENERAR NÚMERO DE RENTA
// ==========================================
async function generarNumeroRenta() {
  try {
    const año = new Date().getFullYear();
    const serie = 'RENT';
    
    const { data, error } = await supabaseClient
      .from('rentas')
      .select('numero_renta')
      .like('numero_renta', `${serie}-${año}-%`)
      .order('numero_renta', { ascending: false })
      .limit(1);

    let siguienteNumero = 1;
    if (data && data.length > 0 && data[0].numero_renta) {
      const ultimoNumero = data[0].numero_renta.split('-').pop();
      siguienteNumero = parseInt(ultimoNumero) + 1;
    }

    numeroRentaActual = `${serie}-${año}-${String(siguienteNumero).padStart(4, '0')}`;
    
    const elNumero = document.getElementById('numeroRenta');
    if (elNumero) elNumero.textContent = numeroRentaActual;
    
  } catch (err) {
    console.error('Error al generar número:', err);
    const elNumero = document.getElementById('numeroRenta');
    if (elNumero) elNumero.textContent = 'Error';
  }
}

// ==========================================
// AGREGAR EQUIPO
// ==========================================
async function agregarEquipo() {
  const input = document.getElementById('buscarEquipoInput');
  if (!input) return;
  
  const codigo = input.value.trim();
  if (!codigo) {
    mostrarMensaje('Por favor ingrese un código de barras o serial', 'error');
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('equipos')
      .select('*')
      .or(`codigo_barras.eq.${codigo},serial.eq.${codigo}`)
      .maybeSingle();

    if (error || !data) {
      mostrarMensaje(`❌ Equipo no encontrado: ${codigo}`, 'error');
      return;
    }

    const existe = itemsRenta.find(item => item.codigo_barras === data.codigo_barras);
    if (existe) {
      mostrarMensaje('⚠️ Este equipo ya está en la renta', 'error');
      return;
    }

    const precioUnitario = data.costo || 0;
    itemsRenta.push({
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

    renderizarTablaItems();
    calcularTotales();
    mostrarMensaje(`✅ Equipo agregado: ${data.nombre_equipo}`, 'success');

  } catch (err) {
    console.error('Error al agregar equipo:', err);
    mostrarMensaje('Error al buscar equipo', 'error');
  }
}

// ==========================================
// RENDERIZAR TABLA
// ==========================================
function renderizarTablaItems() {
  const tbody = document.getElementById('tbodyItems');
  if (!tbody) return;
  
  if (itemsRenta.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center" style="padding: 40px; color: #9ca3af;">
          No hay equipos agregados. Escanee o busque un equipo para comenzar.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = itemsRenta.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td style="font-family: monospace; font-size: 12px;">${item.codigo_barras}</td>
      <td><strong>${item.nombre_equipo}</strong></td>
      <td>${item.serial || '-'}</td>
      <td class="text-right">$${item.precio_unitario.toFixed(2)}</td>
      <td class="text-center">
        <input type="number" min="1" value="${item.cantidad}" class="qty-input" onchange="actualizarCantidad(${index}, this.value)">
      </td>
      <td class="text-right"><strong>$${item.subtotal.toFixed(2)}</strong></td>
      <td class="text-center">
        <button type="button" class="btn-remove" onclick="eliminarItem(${index})" title="Eliminar">✕</button>
      </td>
    </tr>
  `).join('');
}

// ==========================================
// ACTUALIZAR CANTIDAD Y ELIMINAR
// ==========================================
function actualizarCantidad(index, cantidad) {
  const qty = parseInt(cantidad) || 1;
  itemsRenta[index].cantidad = qty;
  itemsRenta[index].subtotal = itemsRenta[index].precio_unitario * qty;
  renderizarTablaItems();
  calcularTotales();
}

function eliminarItem(index) {
  itemsRenta.splice(index, 1);
  renderizarTablaItems();
  calcularTotales();
}

// ==========================================
// CALCULAR TOTALES
// ==========================================
function calcularTotales() {
  const subtotal = itemsRenta.reduce((sum, item) => sum + item.subtotal, 0);
  const descuentoInput = document.getElementById('descuento');
  const descuento = descuentoInput ? (parseFloat(descuentoInput.value) || 0) : 0;
  const total = Math.max(0, subtotal - descuento);

  const elSubtotal = document.getElementById('subtotal');
  const elTotal = document.getElementById('total');
  if (elSubtotal) elSubtotal.textContent = `$${subtotal.toFixed(2)}`;
  if (elTotal) elTotal.textContent = `$${total.toFixed(2)}`;
}

// ==========================================
// GUARDAR RENTA
// ==========================================
async function guardarRenta() {
  const clienteNombre = document.getElementById('clienteNombre')?.value.trim() || '';
  const fechaRenta = document.getElementById('fechaRenta')?.value || '';
  const fechaDevolucion = document.getElementById('fechaDevolucion')?.value || '';
  
  if (!clienteNombre) { mostrarMensaje('Por favor ingrese el nombre del cliente/responsable', 'error'); return; }
  if (!fechaRenta || !fechaDevolucion) { mostrarMensaje('Por favor ingrese las fechas de renta y devolución', 'error'); return; }
  if (itemsRenta.length === 0) { mostrarMensaje('Por favor agregue al menos un equipo', 'error'); return; }

  const btnGuardar = document.getElementById('btnGuardar');
  if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.textContent = '⏳ Guardando...'; }

  try {
    const subtotal = itemsRenta.reduce((sum, item) => sum + item.subtotal, 0);
    const descuentoInput = document.getElementById('descuento');
    const descuento = descuentoInput ? (parseFloat(descuentoInput.value) || 0) : 0;
    const total = Math.max(0, subtotal - descuento);

    const { data: rentaData, error: rentaError } = await supabaseClient
      .from('rentas')
      .insert({
        numero_renta: numeroRentaActual, serie: 'RENT', fecha_renta: fechaRenta, fecha_devolucion: fechaDevolucion,
        cliente_nombre: clienteNombre,
        cliente_telefono: document.getElementById('clienteTelefono')?.value.trim() || '',
        cliente_email: document.getElementById('clienteEmail')?.value.trim() || '',
        cliente_direccion: '',
        ingeniero_nombre: document.getElementById('ingenieroNombre')?.value.trim() || '',
        ingeniero_contacto: '',
        subtotal: subtotal, descuento: descuento, total: total, estado: 'activa',
        observaciones: document.getElementById('observaciones')?.value.trim() || '',
        usuario_registro: usuarioActualRenta?.email || 'unknown',
        usuario_registro_id: usuarioActualRenta?.id || null
      })
      .select().single();

    if (rentaError) throw rentaError;
    rentaGuardadaId = rentaData.id;

    for (const item of itemsRenta) {
      const { error: itemError } = await supabaseClient.from('rentas_items').insert({
        renta_id: rentaData.id, codigo_barras: item.codigo_barras, nombre_equipo: item.nombre_equipo,
        marca: item.marca, modelo: item.modelo, serial: item.serial, cantidad: item.cantidad,
        precio_unitario: item.precio_unitario, subtotal: item.subtotal
      });
      if (itemError) throw itemError;
    }

    if (typeof registrarLog === 'function') {
      await registrarLog('rentar', 'Nueva renta creada', `Renta #${numeroRentaActual} - Cliente: ${clienteNombre} - Total: $${total.toFixed(2)} - Equipos: ${itemsRenta.length}`, 'success');
    }

    mostrarMensaje(`✅ Renta #${numeroRentaActual} guardada exitosamente`, 'success');
    const btnImprimir = document.getElementById('btnImprimir');
    if (btnImprimir) btnImprimir.style.display = 'inline-flex';
    if (btnGuardar) btnGuardar.textContent = '✅ Guardada';

  } catch (err) {
    console.error('❌ Error al guardar renta:', err);
    mostrarMensaje('Error al guardar: ' + err.message, 'error');
    if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = '💾 Guardar Renta'; }
  }
}

// ==========================================
// IMPRIMIR COMPROBANTE
// ==========================================
function imprimirComprobante() {
  if (!rentaGuardadaId) { mostrarMensaje('Primero debe guardar la renta', 'error'); return; }

  const clienteNombre = document.getElementById('clienteNombre')?.value || 'N/A';
  const clienteTel = document.getElementById('clienteTelefono')?.value || 'N/A';
  const clienteEmail = document.getElementById('clienteEmail')?.value || 'N/A';
  const fechaRenta = document.getElementById('fechaRenta')?.value || '';
  const fechaDevolucion = document.getElementById('fechaDevolucion')?.value || '';
  const ingenieroNombre = document.getElementById('ingenieroNombre')?.value || 'N/A';
  const observaciones = document.getElementById('observaciones')?.value || '';
  const subtotal = document.getElementById('subtotal')?.textContent || '$0.00';
  const descuentoInput = document.getElementById('descuento');
  const descuento = descuentoInput ? descuentoInput.value : '0';
  const total = document.getElementById('total')?.textContent || '$0.00';

  const itemsHTML = itemsRenta.map((item, i) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${i + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; font-family: monospace; font-size: 11px;">${item.codigo_barras}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>${item.nombre_equipo}</strong></td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.serial || '-'}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.precio_unitario.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.cantidad}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;"><strong>$${item.subtotal.toFixed(2)}</strong></td>
    </tr>
  `).join('');

  const ventana = window.open('', '_blank', 'width=800,height=900');
  const html = `<!DOCTYPE html><html><head><title>Renta #${numeroRentaActual}</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; font-size: 13px; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; border-bottom: 3px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 30px; }
    .brand h1 { color: #1e3a8a; margin: 0; font-size: 24px; }
    .brand p { margin: 5px 0 0 0; color: #666; font-size: 12px; }
    .meta { text-align: right; }
    .meta .label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    .meta .value { font-size: 20px; font-weight: bold; color: #1e3a8a; font-family: monospace; margin-top: 5px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .info-box h3 { margin: 0 0 10px 0; color: #1e3a8a; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    .info-box p { margin: 6px 0; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #1e3a8a; color: white; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
    td { padding: 10px; border-bottom: 1px solid #eee; font-size: 12px; }
    .totales { text-align: right; margin-top: 20px; }
    .totales p { margin: 5px 0; font-size: 14px; }
    .totales .total { font-size: 20px; font-weight: bold; color: #1e3a8a; border-top: 2px solid #1e3a8a; padding-top: 10px; margin-top: 10px; }
    .firmas { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; text-align: center; }
    .firma-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; }
    .firma-line p { margin: 3px 0; font-size: 12px; }
    .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }
    @media print { .no-print { display: none; } body { padding: 0; } }
  </style></head><body>
  <div class="header">
    <div class="brand"><h1>Eventos D' Primera</h1><p>Comprobante de Renta de Equipos</p></div>
    <div class="meta"><div class="label">Número de Renta</div><div class="value">${numeroRentaActual}</div></div>
  </div>
  <div class="info-grid">
    <div class="info-box"><h3>Cliente / Responsable</h3><p><strong>Nombre:</strong> ${clienteNombre}</p><p><strong>Teléfono:</strong> ${clienteTel}</p><p><strong>Email:</strong> ${clienteEmail}</p></div>
    <div class="info-box"><h3>Detalles de Renta</h3><p><strong>Fecha Renta:</strong> ${fechaRenta ? new Date(fechaRenta).toLocaleDateString() : 'N/A'}</p><p><strong>Devolución:</strong> ${fechaDevolucion ? new Date(fechaDevolucion).toLocaleDateString() : 'N/A'}</p><p><strong>Ingeniero:</strong> ${ingenieroNombre}</p></div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Código</th><th>Equipo</th><th>Serial</th><th style="text-align: right;">Precio</th><th style="text-align: center;">Cant.</th><th style="text-align: right;">Subtotal</th></tr></thead>
    <tbody>${itemsHTML}</tbody>
  </table>
  <div class="totales">
    <p>Subtotal: <strong>${subtotal}</strong></p>
    <p>Descuento: <strong>$${parseFloat(descuento).toFixed(2)}</strong></p>
    <p class="total">TOTAL: <strong>${total}</strong></p>
  </div>
  ${observaciones ? `<div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 4px;"><strong>Observaciones:</strong> ${observaciones}</div>` : ''}
  <div class="firmas">
    <div><div class="firma-line"><p><strong>${clienteNombre}</strong></p><p>Cliente / Responsable</p></div></div>
    <div><div class="firma-line"><p><strong>${usuarioActualRenta?.email || 'Administrador'}</strong></p><p>Entregado por</p></div></div>
  </div>
  <div class="footer">©copyright Eventos de Primera | 2026-2027 | Documento generado el ${new Date().toLocaleString()}</div>
  <div class="no-print" style="margin-top: 30px; text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
    <button onclick="window.print()" style="padding: 12px 30px; background: #1e3a8a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-right: 10px;">🖨️ Imprimir</button>
    <button onclick="window.close()" style="padding: 12px 30px; background: #e5e7eb; color: #374151; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">Cerrar</button>
  </div></body></html>`;

  ventana.document.write(html);
  ventana.document.close();
}

// ==========================================
// LIMPIAR FORMULARIO
// ==========================================
function limpiarFormulario() {
  if (itemsRenta.length > 0 && !confirm('¿Está seguro de cancelar? Se perderán los datos no guardados.')) return;

  itemsRenta = [];
  rentaGuardadaId = null;
  
  ['clienteNombre', 'clienteTelefono', 'clienteEmail', 'ingenieroNombre', 'observaciones'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  
  const descuentoEl = document.getElementById('descuento');
  if (descuentoEl) descuentoEl.value = '0';
  
  const btnImprimir = document.getElementById('btnImprimir');
  if (btnImprimir) btnImprimir.style.display = 'none';
  
  const btnGuardar = document.getElementById('btnGuardar');
  if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = '💾 Guardar Renta'; }
  
  renderizarTablaItems();
  calcularTotales();
  generarNumeroRenta();
  
  const hoy = new Date();
  const fechaEmision = document.getElementById('fechaEmision');
  if (fechaEmision) fechaEmision.textContent = hoy.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ==========================================
// MOSTRAR MENSAJE
// ==========================================
function mostrarMensaje(texto, tipo) {
  const msg = document.getElementById('mensaje');
  if (msg) {
    msg.textContent = texto;
    msg.className = `alert alert-${tipo}`;
    if (tipo === 'success') {
      setTimeout(() => { msg.className = 'alert'; }, 5000);
    }
  }
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 Nueva Renta DOM cargado');
  inicializarNuevaRenta();
});
