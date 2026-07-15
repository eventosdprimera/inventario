// ==========================================
// VARIABLES GLOBALES
// ==========================================
let numeroRentaActual = null;
let itemsRenta = [];
let usuarioActualRenta = null;
let rentaGuardadaId = null;
let clientesCache = []; // Cache de clientes para autocomplete
let autocompletePagina = 1;
const AUTOCOMPLETE_POR_PAGINA = 20;
let autocompleteFiltro = '';
let autocompleteIndexActivo = -1;

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
  await cargarClientesExistentes();
  
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

  // Event listener para Enter en búsqueda de equipos
  const inputBusqueda = document.getElementById('buscarEquipoInput');
  if (inputBusqueda) {
    inputBusqueda.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        agregarEquipo();
      }
    });
  }

  // Configurar autocomplete del cliente
  configurarAutocompleteCliente();

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
// CARGAR CLIENTES EXISTENTES (para autocomplete)
// ==========================================
async function cargarClientesExistentes() {
  try {
    const { data, error } = await supabaseClient
      .from('rentas')
      .select('cliente_nombre, cliente_telefono, cliente_email')
      .not('cliente_nombre', 'is', null)
      .order('cliente_nombre', { ascending: true });

    if (error) {
      console.error('Error al cargar clientes:', error);
      return;
    }

    // Agrupar por nombre (puede haber rentas repetidas del mismo cliente)
    const unicos = new Map();
    (data || []).forEach(r => {
      const nombre = r.cliente_nombre.trim();
      if (nombre && !unicos.has(nombre)) {
        unicos.set(nombre, {
          nombre: nombre,
          telefono: r.cliente_telefono || '',
          email: r.cliente_email || ''
        });
      }
    });

    clientesCache = Array.from(unicos.values());
    console.log(`✅ ${clientesCache.length} clientes cargados para autocomplete`);
  } catch (err) {
    console.error('Error al cargar clientes:', err);
  }
}

// ==========================================
// AUTOCOMPLETE DE CLIENTE
// ==========================================
function configurarAutocompleteCliente() {
  const input = document.getElementById('clienteNombre');
  const lista = document.getElementById('autocompleteList');
  if (!input || !lista) return;

  input.addEventListener('input', (e) => {
    const valor = e.target.value.trim();
    autocompleteFiltro = valor.toLowerCase();
    autocompletePagina = 1;
    autocompleteIndexActivo = -1;
    
    if (valor.length === 0) {
      lista.classList.remove('visible');
      return;
    }
    
    renderizarAutocomplete();
  });

  input.addEventListener('focus', (e) => {
    const valor = e.target.value.trim();
    if (valor.length > 0) {
      autocompleteFiltro = valor.toLowerCase();
      autocompletePagina = 1;
      renderizarAutocomplete();
    }
  });

  input.addEventListener('keydown', (e) => {
    const items = lista.querySelectorAll('.autocomplete-item');
    if (!lista.classList.contains('visible') || items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      autocompleteIndexActivo = Math.min(autocompleteIndexActivo + 1, items.length - 1);
      actualizarItemActivo(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      autocompleteIndexActivo = Math.max(autocompleteIndexActivo - 1, 0);
      actualizarItemActivo(items);
    } else if (e.key === 'Enter') {
      if (autocompleteIndexActivo >= 0 && items[autocompleteIndexActivo]) {
        e.preventDefault();
        items[autocompleteIndexActivo].click();
      }
    } else if (e.key === 'Escape') {
      lista.classList.remove('visible');
    }
  });

  // Cerrar al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !lista.contains(e.target)) {
      lista.classList.remove('visible');
    }
  });
}

function renderizarAutocomplete() {
  const lista = document.getElementById('autocompleteList');
  if (!lista) return;

  const filtrados = clientesCache.filter(c => 
    c.nombre.toLowerCase().includes(autocompleteFiltro)
  );

  if (filtrados.length === 0) {
    lista.classList.remove('visible');
    return;
  }

  const totalPaginas = Math.ceil(filtrados.length / AUTOCOMPLETE_POR_PAGINA);
  const inicio = (autocompletePagina - 1) * AUTOCOMPLETE_POR_PAGINA;
  const fin = inicio + AUTOCOMPLETE_POR_PAGINA;
  const paginaActual = filtrados.slice(inicio, fin);

  let html = '';
  paginaActual.forEach((cliente, idx) => {
    const globalIdx = inicio + idx;
    const detalles = [];
    if (cliente.telefono) detalles.push(`📞 ${cliente.telefono}`);
    if (cliente.email) detalles.push(`️ ${cliente.email}`);
    
    html += `
      <div class="autocomplete-item" data-index="${globalIdx}" onclick="seleccionarCliente('${cliente.nombre.replace(/'/g, "\\'")}', '${cliente.telefono || ''}', '${cliente.email || ''}')">
        <div class="cliente-nombre">${cliente.nombre}</div>
        ${detalles.length > 0 ? `<div class="cliente-detalles">${detalles.join(' | ')}</div>` : ''}
      </div>
    `;
  });

  if (totalPaginas > 1) {
    html += `
      <div class="autocomplete-pagination">
        <button onclick="cambiarPaginaAutocomplete(${autocompletePagina - 1})" ${autocompletePagina === 1 ? 'disabled' : ''}>‹ Anterior</button>
        <span>Página ${autocompletePagina} de ${totalPaginas} (${filtrados.length} clientes)</span>
        <button onclick="cambiarPaginaAutocomplete(${autocompletePagina + 1})" ${autocompletePagina === totalPaginas ? 'disabled' : ''}>Siguiente ›</button>
      </div>
    `;
  }

  lista.innerHTML = html;
  lista.classList.add('visible');
}

function cambiarPaginaAutocomplete(nuevaPagina) {
  const filtrados = clientesCache.filter(c => 
    c.nombre.toLowerCase().includes(autocompleteFiltro)
  );
  const totalPaginas = Math.ceil(filtrados.length / AUTOCOMPLETE_POR_PAGINA);
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
  autocompletePagina = nuevaPagina;
  autocompleteIndexActivo = -1;
  renderizarAutocomplete();
}

function actualizarItemActivo(items) {
  items.forEach((item, idx) => {
    item.classList.toggle('active', idx === autocompleteIndexActivo);
    if (idx === autocompleteIndexActivo) {
      item.scrollIntoView({ block: 'nearest' });
    }
  });
}

function seleccionarCliente(nombre, telefono, email) {
  document.getElementById('clienteNombre').value = nombre;
  if (telefono) document.getElementById('clienteTelefono').value = telefono;
  if (email) document.getElementById('clienteEmail').value = email;
  document.getElementById('autocompleteList').classList.remove('visible');
}

// ==========================================
// AGREGAR EQUIPO (CON SANITIZACIÓN DE ESCÁNER)
// ==========================================
async function agregarEquipo() {
  const input = document.getElementById('buscarEquipoInput');
  if (!input) return;
  
  let codigo = input.value.trim();
  if (!codigo) {
    mostrarMensaje('Por favor ingrese un código de barras o serial', 'error');
    return;
  }

  // ✅ SANITIZAR: reemplazar comillas simples por guiones (problema común de escáneres)
  codigo = codigo.replace(/'/g, '-').replace(/"/g, '-').replace(/`/g, '-').trim();
  input.value = codigo; // Mostrar el código corregido

  try {
    const { data, error } = await supabaseClient
      .from('equipos')
      .select('*')
      .or(`codigo_barras.eq.${codigo},serial.eq.${codigo}`)
      .maybeSingle();

    if (error || !data) {
      mostrarMensaje(`❌ Equipo no encontrado: "${codigo}"`, 'error');
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
    mostrarMensaje(`✅ Equipo agregado: ${data.nombre_equipo}`, 'exito');

  } catch (err) {
    console.error('Error al agregar equipo:', err);
    mostrarMensaje('Error al buscar equipo: ' + err.message, 'error');
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
        <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
          <div style="font-size: 40px; margin-bottom: 10px;">📭</div>
          <div>No hay equipos agregados. Escanee o busque un equipo para comenzar.</div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = itemsRenta.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td style="font-family: monospace; font-size: 11px;">${item.codigo_barras}</td>
      <td><strong>${item.nombre_equipo}</strong></td>
      <td>${item.serial || '-'}</td>
      <td style="text-align: right;">$${item.precio_unitario.toFixed(2)}</td>
      <td style="text-align: center;">
        <input type="number" min="1" value="${item.cantidad}" 
               style="width: 60px; padding: 4px 8px; border: 1px solid #e5e7eb; border-radius: 4px; text-align: center;"
               onchange="actualizarCantidad(${index}, this.value)">
      </td>
      <td style="text-align: right;"><strong>$${item.subtotal.toFixed(2)}</strong></td>
      <td style="text-align: center;">
        <button type="button" onclick="eliminarItem(${index})" 
                style="background: #fee2e2; color: #dc2626; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer;">
          🗑️
        </button>
      </td>
    </tr>
  `).join('');
}

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
// GUARDAR RENTA (CON LOG DETALLADO)
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
  if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.textContent = '⏳ Guardando...'; }

  try {
    const subtotal = itemsRenta.reduce((sum, item) => sum + item.subtotal, 0);
    const descuentoInput = document.getElementById('descuento');
    const descuento = descuentoInput ? (parseFloat(descuentoInput.value) || 0) : 0;
    const total = Math.max(0, subtotal - descuento);

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
      .select().single();

    if (rentaError) throw rentaError;
    rentaGuardadaId = rentaData.id;

    for (const item of itemsRenta) {
      const { error: itemError } = await supabaseClient.from('rentas_items').insert({
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

    // ✅ LOG DETALLADO
    if (typeof registrarLog === 'function') {
      const fechaInicioStr = new Date(fechaRenta).toLocaleDateString('es-ES');
      const fechaDevStr = new Date(fechaDevolucion).toLocaleDateString('es-ES');
      const descripcion = `Renta #${numeroRentaActual} | Cliente: ${clienteNombre} | Inicio: ${fechaInicioStr} | Devolución: ${fechaDevStr} | Equipos: ${itemsRenta.length} | Total: $${total.toFixed(2)} | Creada por: ${usuarioActualRenta?.email || 'Desconocido'}`;
      await registrarLog('rentar', 'Nueva renta creada', descripcion, 'success');
    }

    mostrarMensaje(`✅ Renta #${numeroRentaActual} guardada exitosamente`, 'exito');
    const btnImprimir = document.getElementById('btnImprimir');
    if (btnImprimir) btnImprimir.style.display = 'inline-block';
    if (btnGuardar) btnGuardar.textContent = '✅ Guardada';

  } catch (err) {
    console.error('❌ Error al guardar renta:', err);
    mostrarMensaje('Error al guardar: ' + err.message, 'error');
    if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = '💾 Guardar Renta'; }
  }
}

// ==========================================
// IMPRIMIR COMPROBANTE (HOJA CARTA CON LOGO CENTRADO)
// ==========================================
function imprimirComprobante() {
  if (!rentaGuardadaId) { 
    mostrarMensaje('Primero debe guardar la renta', 'error'); 
    return; 
  }

  const clienteNombre = document.getElementById('clienteNombre')?.value || 'N/A';
  const clienteTel = document.getElementById('clienteTelefono')?.value || 'N/A';
  const clienteEmail = document.getElementById('clienteEmail')?.value || 'N/A';
  const clienteDir = document.getElementById('clienteDireccion')?.value || 'N/A';
  const fechaRenta = document.getElementById('fechaRenta')?.value || '';
  const fechaDevolucion = document.getElementById('fechaDevolucion')?.value || '';
  const ingenieroNombre = document.getElementById('ingenieroNombre')?.value || 'N/A';
  const ingenieroContacto = document.getElementById('ingenieroContacto')?.value || 'N/A';
  const observaciones = document.getElementById('observaciones')?.value || '';
  const subtotal = document.getElementById('subtotal')?.textContent || '$0.00';
  const descuentoInput = document.getElementById('descuento');
  const descuento = descuentoInput ? descuentoInput.value : '0';
  const total = document.getElementById('total')?.textContent || '$0.00';

  const itemsHTML = itemsRenta.map((item, i) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${i + 1}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 10px;">${item.codigo_barras}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>${item.nombre_equipo}</strong><br><small style="color:#666;">${item.marca || ''} ${item.modelo || ''}</small></td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.serial || '-'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.precio_unitario.toFixed(2)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.cantidad}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;"><strong>$${item.subtotal.toFixed(2)}</strong></td>
    </tr>
  `).join('');

  const ventana = window.open('', '_blank', 'width=900,height=1100');
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Comprobante de Renta #${numeroRentaActual}</title>
  <style>
    @page { size: letter; margin: 15mm; }
    * { box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      font-size: 12px; 
      color: #333; 
      max-width: 216mm; 
      margin: 0 auto; 
      padding: 10mm;
    }
    .header { 
      text-align: center; 
      border-bottom: 3px solid #1e3a8a; 
      padding-bottom: 15px; 
      margin-bottom: 20px; 
    }
    .logo-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 10px;
    }
    .logo-icon { 
      width: 70px; 
      height: 70px; 
      background: linear-gradient(135deg, #1e3a8a, #3b82f6); 
      border-radius: 14px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      color: white; 
      font-size: 28px; 
      font-weight: 700; 
      font-family: serif;
      box-shadow: 0 4px 12px rgba(30,58,138,0.3);
    }
    .brand h1 { 
      color: #1e3a8a; 
      margin: 10px 0 5px 0; 
      font-size: 26px; 
      font-family: 'Libre Caslon Text', serif;
    }
    .brand p { 
      margin: 3px 0 0 0; 
      color: #666; 
      font-size: 12px; 
    }
    .numero-renta-box {
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      padding: 12px 20px;
      border-radius: 8px;
      margin: 15px auto;
      display: inline-block;
      border: 2px dashed #3b82f6;
    }
    .numero-renta-box .label { 
      font-size: 10px; 
      color: #666; 
      text-transform: uppercase; 
      letter-spacing: 1px; 
    }
    .numero-renta-box .valor { 
      font-size: 22px; 
      font-weight: bold; 
      color: #1e3a8a; 
      font-family: monospace; 
      margin-top: 3px; 
    }
    .info-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 20px; 
      margin-bottom: 20px; 
    }
    .info-box { 
      background: #f9fafb; 
      padding: 15px; 
      border-radius: 8px; 
      border-left: 4px solid #3b82f6; 
    }
    .info-box h3 { 
      margin: 0 0 10px 0; 
      color: #1e3a8a; 
      font-size: 13px; 
      text-transform: uppercase; 
      letter-spacing: 1px; 
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
    }
    .info-box p { 
      margin: 5px 0; 
      font-size: 12px; 
    }
    .info-box p strong { color: #374151; }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0; 
    }
    th { 
      background: #1e3a8a; 
      color: white; 
      padding: 10px 8px; 
      text-align: left; 
      font-size: 11px; 
      text-transform: uppercase;
    }
    td { 
      padding: 8px; 
      border-bottom: 1px solid #e5e7eb; 
      font-size: 11px; 
    }
    .totales { 
      text-align: right; 
      margin-top: 20px; 
      padding: 15px; 
      background: #eff6ff; 
      border-radius: 8px; 
    }
    .totales p { 
      margin: 5px 0; 
      font-size: 13px; 
    }
    .totales .total { 
      font-size: 20px; 
      font-weight: bold; 
      color: #1e3a8a; 
      border-top: 2px solid #1e3a8a; 
      padding-top: 10px; 
      margin-top: 10px; 
    }
    .observaciones { 
      margin-top: 20px; 
      padding: 15px; 
      background: #fef3c7; 
      border-left: 4px solid #f59e0b; 
      border-radius: 4px; 
    }
    .observaciones h4 { 
      margin: 0 0 5px 0; 
      color: #92400e; 
      font-size: 12px; 
    }
    .observaciones p { 
      margin: 0; 
      font-size: 12px; 
    }
    .firmas { 
      margin-top: 50px; 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 50px; 
      text-align: center; 
    }
    .firma-line { 
      border-top: 1px solid #333; 
      margin-top: 40px; 
      padding-top: 5px; 
    }
    .firma-line p { 
      margin: 3px 0; 
      font-size: 12px; 
    }
    .footer { 
      margin-top: 30px; 
      text-align: center; 
      font-size: 10px; 
      color: #9ca3af; 
      border-top: 1px solid #e5e7eb; 
      padding-top: 10px; 
    }
    @media print { 
      .no-print { display: none !important; } 
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-container">
      <div class="logo-icon">EP</div>
    </div>
    <div class="brand">
      <h1>Eventos D' Primera</h1>
      <p>Sistema de Inventario y Rentas</p>
    </div>
    <div class="numero-renta-box">
      <div class="label">Comprobante de Renta N°</div>
      <div class="valor">${numeroRentaActual}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>👤 Cliente / Responsable</h3>
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
    </div>
  </div>

  <h3 style="margin: 20px 0 10px
