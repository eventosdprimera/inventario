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
  document.getElementById('fechaRenta').value = hoy.toISOString().split('T')[0];
  
  const fechaDev = new Date();
  fechaDev.setDate(fechaDev.getDate() + 7);
  document.getElementById('fechaDevolucion').value = fechaDev.toISOString().split('T')[0];
  
  document.getElementById('fechaEmision').textContent = hoy.toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const inputBusqueda = document.getElementById('buscarEquipoInput');
  if (inputBusqueda) {
    inputBusqueda.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        agregarEquipo();
      }
    });
  }

  actualizarVistaPrevia();
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
    const elFactura = document.getElementById('facturaNumero');
    if (elNumero) elNumero.textContent = numeroRentaActual;
    if (elFactura) elFactura.textContent = numeroRentaActual;
    
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
    actualizarVistaPrevia();
    
    mostrarMensaje(`✅ Equipo agregado: ${data.nombre_equipo}`, 'exito');

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
        <td colspan="8" style="text-align: center; padding: 40px; color: #94a3b8;">
          <div style="font-size: 40px; margin-bottom: 10px;">📭</div>
          <div>No hay equipos agregados. Escanee o busque un equipo para comenzar.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = itemsRenta.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td style="font-family: monospace; font-size: 11px;">${item.codigo_barras}</td>
      <td><strong>${item.nombre_equipo}</strong></td>
      <td>${item.serial || '-'}</td>
      <td class="precio">$${item.precio_unitario.toFixed(2)}</td>
      <td style="text-align: center;">
        <input type="number" min="1" value="${item.cantidad}" 
               class="cantidad-input"
               onchange="actualizarCantidad(${index}, this.value)">
      </td>
      <td class="precio"><strong>$${item.subtotal.toFixed(2)}</strong></td>
      <td style="text-align: center;">
        <button type="button" class="btn-eliminar-item" onclick="eliminarItem(${index})">
          🗑️
        </button>
      </td>
    </tr>
  `).join('');
}

// ==========================================
// ACTUALIZAR CANTIDAD
// ==========================================
function actualizarCantidad(index, cantidad) {
  const qty = parseInt(cantidad) || 1;
  itemsRenta[index].cantidad = qty;
  itemsRenta[index].subtotal = itemsRenta[index].precio_unitario * qty;
  
  renderizarTablaItems();
  calcularTotales();
  actualizarVistaPrevia();
}

// ==========================================
// ELIMINAR ITEM
// ==========================================
function eliminarItem(index) {
  itemsRenta.splice(index, 1);
  renderizarTablaItems();
  calcularTotales();
  actualizarVistaPrevia();
}

// ==========================================
// CALCULAR TOTALES
// ==========================================
function calcularTotales() {
  const subtotal = itemsRenta.reduce((sum, item) => sum + item.subtotal, 0);
  const descuentoInput = document.getElementById('descuento');
  const descuento = descuentoInput ? (parseFloat(descuentoInput.value) || 0) : 0;
  const total = subtotal - descuento;

  const elSubtotal = document.getElementById('subtotal');
  const elTotal = document.getElementById('total');
  if (elSubtotal) elSubtotal.textContent = `$${subtotal.toFixed(2)}`;
  if (elTotal) elTotal.textContent = `$${total.toFixed(2)}`;
  
  actualizarVistaPrevia();
}

// ==========================================
// ACTUALIZAR VISTA PREVIA
// ==========================================
function actualizarVistaPrevia() {
  const elFacturaNumero = document.getElementById('facturaNumero');
  if (elFacturaNumero) elFacturaNumero.textContent = numeroRentaActual || '---';
  
  const clienteNombre = document.getElementById('clienteNombre')?.value.trim() || '';
  const clienteTel = document.getElementById('clienteTelefono')?.value.trim() || '';
  const clienteEmail = document.getElementById('clienteEmail')?.value.trim() || '';
  
  const elFacturaCliente = document.getElementById('facturaCliente');
  const elFacturaClienteTel = document.getElementById('facturaClienteTel');
  const elFacturaFirmaCliente = document.getElementById('facturaFirmaCliente');
  
  if (clienteNombre) {
    if (elFacturaCliente) elFacturaCliente.innerHTML = `<strong>${clienteNombre}</strong>`;
    if (elFacturaClienteTel) elFacturaClienteTel.textContent = `${clienteTel}${clienteEmail ? ' | ' + clienteEmail : ''}`;
    if (elFacturaFirmaCliente) elFacturaFirmaCliente.innerHTML = `<strong>${clienteNombre}</strong>`;
  } else {
    if (elFacturaCliente) elFacturaCliente.innerHTML = '<em>Sin información</em>';
    if (elFacturaClienteTel) elFacturaClienteTel.textContent = '';
    if (elFacturaFirmaCliente) elFacturaFirmaCliente.innerHTML = '<strong>Cliente</strong>';
  }
  
  const fechaRenta = document.getElementById('fechaRenta')?.value || '';
  const fechaDevolucion = document.getElementById('fechaDevolucion')?.value || '';
  const elFacturaFechas = document.getElementById('facturaFechas');
  
  if (fechaRenta && fechaDevolucion) {
    if (elFacturaFechas) {
      elFacturaFechas.innerHTML = `
        <strong>Desde:</strong> ${new Date(fechaRenta).toLocaleDateString()}<br>
        <strong>Hasta:</strong> ${new Date(fechaDevolucion).toLocaleDateString()}
      `;
    }
  } else {
    if (elFacturaFechas) elFacturaFechas.innerHTML = '<em>Sin fechas</em>';
  }
  
  const ingenieroNombre = document.getElementById('ingenieroNombre')?.value.trim() || '';
  const ingenieroContacto = document.getElementById('ingenieroContacto')?.value.trim() || '';
  const elFacturaIngeniero = document.getElementById('facturaIngeniero');
  
  if (ingenieroNombre) {
    if (elFacturaIngeniero) {
      elFacturaIngeniero.innerHTML = `<strong>Ing.:</strong> ${ingenieroNombre}${ingenieroContacto ? ' | ' + ingenieroContacto : ''}`;
    }
  } else {
    if (elFacturaIngeniero) elFacturaIngeniero.textContent = '';
  }
  
  const tbodyFactura = document.getElementById('facturaItems');
  if (tbodyFactura) {
    if (itemsRenta.length === 0) {
      tbodyFactura.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 30px; color: #94a3b8;">
            Sin equipos agregados
          </td>
        </tr>
      `;
    } else {
      tbodyFactura.innerHTML = itemsRenta.map((item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td style="font-family: monospace; font-size: 10px;">${item.codigo_barras}</td>
          <td><strong>${item.nombre_equipo}</strong></td>
          <td>${item.serial || '-'}</td>
          <td style="text-align: right;">$${item.precio_unitario.toFixed(2)}</td>
          <td style="text-align: center;">${item.cantidad}</td>
          <td style="text-align: right;"><strong>$${item.subtotal.toFixed(2)}</strong></td>
        </tr>
      `).join('');
    }
  }
  
  const subtotal = itemsRenta.reduce((sum, item) => sum + item.subtotal, 0);
  const descuentoInput = document.getElementById('descuento');
  const descuento = descuentoInput ? (parseFloat(descuentoInput.value) || 0) : 0;
  const total = subtotal - descuento;
  
  const elFacturaSubtotal = document.getElementById('facturaSubtotal');
  const elFacturaDescuento = document.getElementById('facturaDescuento');
  const elFacturaTotal = document.getElementById('facturaTotal');
  
  if (elFacturaSubtotal) elFacturaSubtotal.textContent = `$${subtotal.toFixed(2)}`;
  if (elFacturaDescuento) elFacturaDescuento.textContent = `$${descuento.toFixed(2)}`;
  if (elFacturaTotal) elFacturaTotal.textContent = `$${total.toFixed(2)}`;
}

// ==========================================
// GUARDAR RENTA
// ==========================================
async function guardarRenta() {
  const clienteNombre = document.getElementById('clienteNombre')?.value.trim() || '';
  const fechaRenta = document.getElementById('fechaRenta')?.value || '';
  const fechaDevolucion = document.getElementById('fechaDevolucion')?.value || '';
  
  if (!clienteNombre) {
    mostrarMensaje('Por favor ingrese el nombre del cliente/responsable', 'error');
    return;
  }
  
  if (!fechaRenta || !fechaDevolucion) {
    mostrarMensaje('Por favor ingrese las fechas de renta y devolución', 'error');
    return;
  }
  
  if (itemsRenta.length === 0) {
    mostrarMensaje('Por favor agregue al menos un equipo', 'error');
    return;
  }

  const btnGuardar = document.getElementById('btnGuardar');
  if (btnGuardar) {
    btnGuardar.disabled = true;
    btnGuardar.textContent = '⏳ Guardando...';
  }

  try {
    const subtotal = itemsRenta.reduce((sum, item) => sum + item.subtotal, 0);
    const descuentoInput = document.getElementById('descuento');
    const descuento = descuentoInput ? (parseFloat(descuentoInput.value) || 0) : 0;
    const total = subtotal - descuento;

    const { data: rentaData, error: rentaError } = await supabaseClient
      .from('rentas')
      .insert({
        numero_renta: numeroRentaActual,
        serie: 'RENT',
        fecha_renta: fechaRenta,
        fecha_devolucion: fechaDevolucion,
        
        cliente_nombre: clienteNombre,
        cliente_telefono: document.getElementById('clienteTelefono')?.value.trim() || '',
        cliente_email: document.getElementById('clienteEmail')?.value.trim() || '',
        cliente_direccion: document.getElementById('clienteDireccion')?.value.trim() || '',
        
        ingeniero_nombre: document.getElementById('ingenieroNombre')?.value.trim() || '',
        ingeniero_contacto: document.getElementById('ingenieroContacto')?.value.trim() || '',
        
        subtotal: subtotal,
        descuento: descuento,
        total: total,
        
        estado: 'activa',
        observaciones: document.getElementById('observaciones')?.value.trim() || '',
        
        usuario_registro: usuarioActualRenta?.email || 'unknown',
        usuario_registro_id: usuarioActualRenta?.id || null
      })
      .select()
      .single();

    if (rentaError) throw rentaError;

    rentaGuardadaId = rentaData.id;

    for (const item of itemsRenta) {
      const { error: itemError } = await supabaseClient
        .from('rentas_items')
        .insert({
          renta_id: rentaData.id,
          codigo_barras: item.codigo_barras,
          nombre_equipo: item.nombre_equipo,
          marca: item.marca,
          modelo: item.modelo,
          serial: item.serial,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal
        });

      if (itemError) throw itemError;
    }

    if (typeof registrarLog === 'function') {
      await registrarLog('rentar', 'Nueva renta creada', 
        `Renta #${numeroRentaActual} - Cliente: ${clienteNombre} - Total: $${total.toFixed(2)} - Equipos: ${itemsRenta.length}`, 
        'success');
    }

    mostrarMensaje(`✅ Renta #${numeroRentaActual} guardada exitosamente`, 'exito');
    
    const btnImprimir = document.getElementById('btnImprimir');
    if (btnImprimir) btnImprimir.style.display = 'inline-flex';
    
    if (btnGuardar) btnGuardar.textContent = '✅ Guardada';
    
    setTimeout(() => {
      if (btnImprimir) btnImprimir.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);

  } catch (err) {
    console.error('❌ Error al guardar renta:', err);
    mostrarMensaje('Error al guardar: ' + err.message, 'error');
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.textContent = ' Guardar Renta';
    }
  }
}

// ==========================================
// IMPRIMIR COMPROBANTE
// ==========================================
function imprimirComprobante() {
  if (!rentaGuardadaId) {
    mostrarMensaje('Primero debe guardar la renta', 'error');
    return;
  }

  const clienteNombre = document.getElementById('clienteNombre')?.value || '';
  const clienteTel = document.getElementById('clienteTelefono')?.value || '';
  const clienteEmail = document.getElementById('clienteEmail')?.value || '';
  const clienteDir = document.getElementById('clienteDireccion')?.value || '';
  const fechaRenta = document.getElementById('fechaRenta')?.value || '';
  const fechaDevolucion = document.getElementById('fechaDevolucion')?.value || '';
  const ingenieroNombre = document.getElementById('ingenieroNombre')?.value || '';
  const ingenieroContacto = document.getElementById('ingenieroContacto')?.value || '';
  const observaciones = document.getElementById('observaciones')?.value || '';
  const subtotal = document.getElementById('subtotal')?.textContent || '$0.00';
  const descuentoInput = document.getElementById('descuento');
  const descuento = descuentoInput ? descuentoInput.value : '0';
  const total = document.getElementById('total')?.textContent || '$0.00';

  const itemsHTML = itemsRenta.map((item, i) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${i + 1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 10px;">${item.codigo_barras}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>${item.nombre_equipo}</strong></td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.serial || '-'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.precio_unitario.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.cantidad}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong>$${item.subtotal.toFixed(2)}</strong></td>
    </tr>
  `).join('');

  const ventana = window.open('', '_blank', 'width=800,height=900');
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Comprobante de Renta #${numeroRentaActual}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; }
    .logo { display: flex; align-items: center; gap: 15px; }
    .logo-icon { width: 60px; height: 60px; background: linear-gradient(135deg, #1e3a8a, #2563eb); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: 700; font-family: serif; }
    .logo-text h1 { color: #1e3a8a; margin: 0; font-size: 22px; font-family: serif; }
    .logo-text p { margin: 3px 0 0 0; color: #666; font-size: 11px; }
    .numero-renta { text-align: right; }
    .numero-renta .label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    .numero-renta .valor { font-size: 20px; font-weight: 700; color: #1e3a8a; font-family: monospace; margin-top: 5px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .info-box { background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb; }
    .info-box h3 { margin: 0 0 10px 0; color: #1e3a8a; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
    .info-box p { margin: 5px 0; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #1e3a8a; color: white; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
    td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
    .totales { text-align: right; margin-top: 20px; padding: 15px; background: #eff6ff; border-radius: 8px; }
    .totales p { margin: 5px 0; font-size: 13px; }
    .totales .total { font-size: 18px; font-weight: bold; color: #1e3a8a; border-top: 2px solid #1e3a8a; padding-top: 10px; margin-top: 10px; }
    .observaciones { margin-top: 20px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; }
    .observaciones h4 { margin: 0 0 5px 0; color: #92400e; font-size: 12px; }
    .observaciones p { margin: 0; font-size: 12px; }
    .firmas { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; text-align: center; }
    .firma-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; }
    .firma-line p { margin: 3px 0; font-size: 12px; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    @media print {
      .no-print { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <div class="logo-icon">EP</div>
      <div class="logo-text">
        <h1>Eventos D' Primera</h1>
        <p>Sistema de Inventario y Rentas</p>
      </div>
    </div>
    <div class="numero-renta">
      <div class="label">Comprobante de Renta</div>
      <div class="valor">${numeroRentaActual}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>👤 Cliente / Responsable</h3>
      <p><strong>Nombre:</strong> ${clienteNombre || 'N/A'}</p>
      <p><strong>Teléfono:</strong> ${clienteTel || 'N/A'}</p>
      <p><strong>Email:</strong> ${clienteEmail || 'N/A'}</p>
      <p><strong>Dirección:</strong> ${clienteDir || 'N/A'}</p>
    </div>
    <div class="info-box">
      <h3>📅 Detalles de Renta</h3>
      <p><strong>Fecha Renta:</strong> ${fechaRenta ? new Date(fechaRenta).toLocaleDateString() : 'N/A'}</p>
      <p><strong>Fecha Devolución:</strong> ${fechaDevolucion ? new Date(fechaDevolucion).toLocaleDateString() : 'N/A'}</p>
      <p><strong>Ingeniero:</strong> ${ingenieroNombre || 'N/A'}</p>
      <p><strong>Contacto Ing.:</strong> ${ingenieroContacto || 'N/A'}</p>
    </div>
  </div>

  <h3 style="margin: 20px 0 10px 0; color: #1e3a8a;">📦 Equipos Rentados</h3>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Código</th>
        <th>Equipo</th>
        <th>Serial</th>
        <th style="text-align: right;">Precio/Día</th>
        <th style="text-align: center;">Cant.</th>
        <th style="text-align: right;">Subtotal</th>
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
    <h4> Observaciones</h4>
    <p>${observaciones}</p>
  </div>
  ` : ''}

  <div class="firmas">
    <div>
      <div class="firma-line">
        <p><strong>${clienteNombre || 'Cliente'}</strong></p>
        <p>Cliente / Responsable</p>
        <p style="font-size: 10px; color: #666;">Firma de conformidad</p>
      </div>
    </div>
    <div>
      <div class="firma-line">
        <p><strong>${usuarioActualRenta?.email || 'Administrador'}</strong></p>
        <p>Entregado por</p>
        <p style="font-size: 10px; color: #666;">Firma del responsable</p>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>©copyright Eventos de Primera | 2026-2027 | Documento generado el ${new Date().toLocaleString()}</p>
  </div>

  <div class="no-print" style="margin-top: 30px; text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
    <button onclick="window.print()" style="padding: 12px 30px; background: #1e3a8a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-right: 10px;">
      ️ Imprimir Comprobante
    </button>
    <button onclick="window.close()" style="padding: 12px 30px; background: #64748b; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
       Cerrar
    </button>
  </div>
</body>
</html>
  `;

  ventana.document.write(html);
  ventana.document.close();
}

// ==========================================
// LIMPIAR FORMULARIO
// ==========================================
function limpiarFormulario() {
  if (itemsRenta.length > 0 && !confirm('¿Está seguro de iniciar una nueva renta? Se perderán los datos no guardados.')) {
    return;
  }

  itemsRenta = [];
  rentaGuardadaId = null;
  
  const campos = ['clienteNombre', 'clienteTelefono', 'clienteEmail', 'clienteDireccion', 
                  'ingenieroNombre', 'ingenieroContacto', 'observaciones'];
  campos.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  
  const descuentoEl = document.getElementById('descuento');
  if (descuentoEl) descuentoEl.value = '0';
  
  const btnImprimir = document.getElementById('btnImprimir');
  if (btnImprimir) btnImprimir.style.display = 'none';
  
  const btnGuardar = document.getElementById('btnGuardar');
  if (btnGuardar) {
    btnGuardar.disabled = false;
    btnGuardar.textContent = '💾 Guardar Renta';
  }
  
  renderizarTablaItems();
  calcularTotales();
  generarNumeroRenta();
  
  const hoy = new Date();
  const fechaEmision = document.getElementById('fechaEmision');
  if (fechaEmision) {
    fechaEmision.textContent = hoy.toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }
  
  actualizarVistaPrevia();
  
  mostrarMensaje('Formulario listo para nueva renta', 'exito');
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
  console.log('📄 Nueva Renta DOM cargado');
  inicializarNuevaRenta();
});
