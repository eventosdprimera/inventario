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
  await generarNumeroRenta();
  
  // Establecer fechas por defecto
  const hoy = new Date().toISOString().split('T')[0];
  document.getElementById('fechaRenta').value = hoy;
  
  // Calcular fecha devolución (7 días después)
  const fechaDev = new Date();
  fechaDev.setDate(fechaDev.getDate() + 7);
  document.getElementById('fechaDevolucion').value = fechaDev.toISOString().split('T')[0];

  // Event listener para Enter en búsqueda
  const inputBusqueda = document.getElementById('buscarEquipoInput');
  inputBusqueda.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') agregarEquipo();
  });

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
    
    // Obtener el último número de renta del año
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
    
    document.getElementById('numeroRenta').textContent = numeroRentaActual;
    
  } catch (err) {
    console.error('Error al generar número:', err);
    document.getElementById('numeroRenta').textContent = 'Error';
  }
}

// ==========================================
// AGREGAR EQUIPO
// ==========================================
async function agregarEquipo() {
  const codigo = document.getElementById('buscarEquipoInput').value.trim();
  
  if (!codigo) {
    mostrarMensaje('Por favor ingrese un código de barras o serial', 'error');
    return;
  }

  try {
    // Buscar equipo en base de datos
    const { data, error } = await supabaseClient
      .from('equipos')
      .select('*')
      .or(`codigo_barras.eq.${codigo},serial.eq.${codigo}`)
      .maybeSingle();

    if (error || !data) {
      mostrarMensaje(`❌ Equipo no encontrado: ${codigo}`, 'error');
      return;
    }

    // Verificar si ya está agregado
    const existe = itemsRenta.find(item => item.codigo_barras === data.codigo_barras);
    if (existe) {
      mostrarMensaje('⚠️ Este equipo ya está en la renta', 'error');
      return;
    }

    // Agregar a items
    const precioUnitario = data.costo || 0; // Usar costo como precio de renta por día
    
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

    // Limpiar input
    document.getElementById('buscarEquipoInput').value = '';
    document.getElementById('buscarEquipoInput').focus();

    // Actualizar tabla
    renderizarTablaItems();
    calcularTotales();
    
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
  
  if (itemsRenta.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
          No hay equipos agregados. Escanee o busque un equipo para agregar.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = itemsRenta.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.codigo_barras}</td>
      <td><strong>${item.nombre_equipo}</strong></td>
      <td>${item.serial || '-'}</td>
      <td>$${item.precio_unitario.toFixed(2)}</td>
      <td>
        <input type="number" min="1" value="${item.cantidad}" 
               style="width: 60px; padding: 5px; border: 1px solid #e5e7eb; border-radius: 4px;"
               onchange="actualizarCantidad(${index}, this.value)">
      </td>
      <td><strong>$${item.subtotal.toFixed(2)}</strong></td>
      <td>
        <button type="button" onclick="eliminarItem(${index})" 
                style="background: #fee2e2; color: #dc2626; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
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
}

// ==========================================
// ELIMINAR ITEM
// ==========================================
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
  const descuento = parseFloat(document.getElementById('descuento').value) || 0;
  const total = subtotal - descuento;

  document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

// ==========================================
// GUARDAR RENTA
// ==========================================
async function guardarRenta() {
  // Validaciones
  const clienteNombre = document.getElementById('clienteNombre').value.trim();
  const fechaRenta = document.getElementById('fechaRenta').value;
  const fechaDevolucion = document.getElementById('fechaDevolucion').value;
  
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

  const btnGuardar = document.querySelector('button[onclick="guardarRenta()"]');
  btnGuardar.disabled = true;
  btnGuardar.textContent = ' Guardando...';

  try {
    const subtotal = itemsRenta.reduce((sum, item) => sum + item.subtotal, 0);
    const descuento = parseFloat(document.getElementById('descuento').value) || 0;
    const total = subtotal - descuento;

    // 1. Insertar renta principal
    const { data: rentaData, error: rentaError } = await supabaseClient
      .from('rentas')
      .insert({
        numero_renta: numeroRentaActual,
        serie: 'RENT',
        fecha_renta: fechaRenta,
        fecha_devolucion: fechaDevolucion,
        
        cliente_nombre: clienteNombre,
        cliente_telefono: document.getElementById('clienteTelefono').value.trim(),
        cliente_email: document.getElementById('clienteEmail').value.trim(),
        cliente_direccion: document.getElementById('clienteDireccion').value.trim(),
        
        ingeniero_nombre: document.getElementById('ingenieroNombre').value.trim(),
        ingeniero_contacto: document.getElementById('ingenieroContacto').value.trim(),
        
        subtotal: subtotal,
        descuento: descuento,
        total: total,
        
        estado: 'activa',
        observaciones: document.getElementById('observaciones').value.trim(),
        
        usuario_registro: usuarioActualRenta?.email || 'unknown',
        usuario_registro_id: usuarioActualRenta?.id || null
      })
      .select()
      .single();

    if (rentaError) throw rentaError;

    rentaGuardadaId = rentaData.id;

    // 2. Insertar items
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

    // 3. Registrar en logs
    if (typeof registrarLog === 'function') {
      await registrarLog('rentar', 'Nueva renta creada', 
        `Renta #${numeroRentaActual} - Cliente: ${clienteNombre} - Total: $${total.toFixed(2)} - Equipos: ${itemsRenta.length}`, 
        'success');
    }

    mostrarMensaje(`✅ Renta #${numeroRentaActual} guardada exitosamente`, 'exito');
    
    // Mostrar botón de imprimir
    document.getElementById('btnImprimir').style.display = 'inline-block';
    
    btnGuardar.textContent = '✅ Guardada';
    
    // Scroll al botón de imprimir
    setTimeout(() => {
      document.getElementById('btnImprimir').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);

  } catch (err) {
    console.error('❌ Error al guardar renta:', err);
    mostrarMensaje('Error al guardar: ' + err.message, 'error');
    btnGuardar.disabled = false;
    btnGuardar.textContent = '💾 Guardar Renta';
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

  const clienteNombre = document.getElementById('clienteNombre').value;
  const fechaRenta = document.getElementById('fechaRenta').value;
  const fechaDevolucion = document.getElementById('fechaDevolucion').value;
  const ingenieroNombre = document.getElementById('ingenieroNombre').value;
  const total = document.getElementById('total').textContent;

  const ventana = window.open('', '_blank', 'width=800,height=900');
  
  const itemsHTML = itemsRenta.map((item, i) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${i + 1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.codigo_barras}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>${item.nombre_equipo}</strong></td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.serial || '-'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.precio_unitario.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.cantidad}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong>$${item.subtotal.toFixed(2)}</strong></td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Comprobante de Renta #${numeroRentaActual}</title>
  <style>
    @page { size: auto; margin: 15mm; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
    .header { text-align: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { color: #1e3a8a; margin: 0; font-size: 24px; }
    .header p { margin: 5px 0; color: #666; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .info-box { background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; }
    .info-box h3 { margin: 0 0 10px 0; color: #1e3a8a; font-size: 14px; }
    .info-box p { margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #1e3a8a; color: white; padding: 10px; text-align: left; }
    .totales { text-align: right; margin-top: 20px; }
    .totales p { margin: 5px 0; font-size: 14px; }
    .totales .total { font-size: 20px; font-weight: bold; color: #1e3a8a; border-top: 2px solid #3b82f6; padding-top: 10px; margin-top: 10px; }
    .firmas { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; text-align: center; }
    .firma-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; }
    @media print {
      .no-print { display: none; }
      body { font-size: 11px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🤝 EVENTOS D' PRIMERA</h1>
    <p><strong>COMPROBANTE DE RENTA DE EQUIPOS</strong></p>
    <p>Número de Renta: <strong>${numeroRentaActual}</strong></p>
    <p>Fecha de Emisión: ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>👤 Cliente/Responsable</h3>
      <p><strong>Nombre:</strong> ${clienteNombre}</p>
      <p><strong>Teléfono:</strong> ${document.getElementById('clienteTelefono').value || 'N/A'}</p>
      <p><strong>Email:</strong> ${document.getElementById('clienteEmail').value || 'N/A'}</p>
      <p><strong>Dirección:</strong> ${document.getElementById('clienteDireccion').value || 'N/A'}</p>
    </div>
    <div class="info-box">
      <h3>📅 Detalles de Renta</h3>
      <p><strong>Fecha Renta:</strong> ${new Date(fechaRenta).toLocaleDateString()}</p>
      <p><strong>Fecha Devolución:</strong> ${new Date(fechaDevolucion).toLocaleDateString()}</p>
      <p><strong>Ingeniero:</strong> ${ingenieroNombre || 'N/A'}</p>
      <p><strong>Contacto Ing.:</strong> ${document.getElementById('ingenieroContacto').value || 'N/A'}</p>
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
    <p>Subtotal: <strong>$${document.getElementById('subtotal').textContent}</strong></p>
    <p>Descuento: <strong>$${document.getElementById('descuento').value}</strong></p>
    <p class="total">TOTAL: <strong>${total}</strong></p>
  </div>

  <div style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
    <p style="margin: 0;"><strong>️ Observaciones:</strong></p>
    <p style="margin: 5px 0 0 0;">${document.getElementById('observaciones').value || 'Ninguna'}</p>
  </div>

  <div class="firmas">
    <div>
      <div class="firma-line">
        <p><strong>${clienteNombre}</strong></p>
        <p>Cliente/Responsable</p>
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

  <div class="no-print" style="margin-top: 30px; text-align: center;">
    <button onclick="window.print()" style="padding: 12px 30px; background: #1e3a8a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
      🖨️ Imprimir Comprobante
    </button>
    <button onclick="window.close()" style="padding: 12px 30px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-left: 10px;">
      ❌ Cerrar
    </button>
  </div>

  <script>
    window.onload = function() {
      // Auto-imprimir al abrir (opcional)
      // setTimeout(function() { window.print(); }, 500);
    };
  <\/script>
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
  
  document.getElementById('clienteNombre').value = '';
  document.getElementById('clienteTelefono').value = '';
  document.getElementById('clienteEmail').value = '';
  document.getElementById('clienteDireccion').value = '';
  document.getElementById('ingenieroNombre').value = '';
  document.getElementById('ingenieroContacto').value = '';
  document.getElementById('observaciones').value = '';
  document.getElementById('descuento').value = '0';
  
  document.getElementById('btnImprimir').style.display = 'none';
  
  renderizarTablaItems();
  calcularTotales();
  generarNumeroRenta();
  
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
