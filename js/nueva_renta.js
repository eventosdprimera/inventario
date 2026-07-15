// ==========================================
// VARIABLES GLOBALES
// ==========================================
let numeroRentaActual = null;
let itemsRenta = [];
let usuarioActualRenta = null;
let rentaGuardadaId = null;
let clientesCache = [];
let autocompletePagina = 1;
const AUTOCOMPLETE_POR_PAGINA = 10;
let autocompleteFiltro = '';
let autocompleteIndexActivo = -1;
let fechaHoyStr = ''; // Fecha de hoy en formato YYYY-MM-DD

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
  
  // ✅ FECHA DE HOY (para validaciones)
  const hoy = new Date();
  fechaHoyStr = hoy.toISOString().split('T')[0];
  
  const elFechaRenta = document.getElementById('fechaRenta');
  const elFechaDevolucion = document.getElementById('fechaDevolucion');
  const elFechaEmision = document.getElementById('fechaEmision');
  
  // ✅ CONFIGURAR FECHA MÍNIMA (hoy) en ambos campos de fecha
  if (elFechaRenta) {
    elFechaRenta.value = fechaHoyStr;
    elFechaRenta.min = fechaHoyStr; // No permitir fechas anteriores a hoy
  }
  
  if (elFechaDevolucion) {
    const fechaDev = new Date();
    fechaDev.setDate(fechaDev.getDate() + 7);
    const fechaDevStr = fechaDev.toISOString().split('T')[0];
    elFechaDevolucion.value = fechaDevStr;
    elFechaDevolucion.min = fechaHoyStr; // No permitir fechas anteriores a hoy
  }
  
  if (elFechaEmision) {
    elFechaEmision.textContent = hoy.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  // ✅ VALIDAR QUE FECHA DEVOLUCIÓN NO SEA ANTERIOR A FECHA INICIO
  if (elFechaRenta && elFechaDevolucion) {
    elFechaRenta.addEventListener('change', () => {
      elFechaDevolucion.min = elFechaRenta.value;
      if (elFechaDevolucion.value && elFechaDevolucion.value < elFechaRenta.value) {
        elFechaDevolucion.value = elFechaRenta.value;
      }
    });
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

  // ✅ FILTRAR SOLO NÚMEROS EN TELÉFONO (11 dígitos)
  const inputTelefono = document.getElementById('clienteTelefono');
  if (inputTelefono) {
    inputTelefono.addEventListener('input', (e) => {
      // Eliminar cualquier carácter que no sea número
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      // Limitar a 11 dígitos
      if (e.target.value.length > 11) {
        e.target.value = e.target.value.slice(0, 11);
      }
    });
    inputTelefono.addEventListener('keypress', (e) => {
      // Prevenir entrada de caracteres no numéricos
      if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
        e.preventDefault();
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
// CARGAR CLIENTES EXISTENTES
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

  const ocultarLista = () => {
    lista.classList.remove('visible');
    lista.innerHTML = '';
    autocompleteFiltro = '';
    autocompletePagina = 1;
    autocompleteIndexActivo = -1;
  };

  input.addEventListener('input', (e) => {
    const valor = e.target.value.trim();
    if (!valor) {
      ocultarLista();
      return;
    }
    autocompleteFiltro = valor.toLowerCase();
    autocompletePagina = 1;
    autocompleteIndexActivo = -1;
    renderizarAutocomplete();
  });

  input.addEventListener('focus', (e) => {
    const valor = e.target.value.trim();
    if (valor) {
      autocompleteFiltro = valor.toLowerCase();
      autocompletePagina = 1;
      renderizarAutocomplete();
    }
  });

  input.addEventListener('keydown', (e) => {
    const items = lista.querySelectorAll('.autocomplete-item');
    if (!lista.classList.contains('visible') || items.length === 0) {
      if (e.key === 'Escape') ocultarLista();
      return;
    }

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
      ocultarLista();
    }
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !lista.contains(e.target)) {
      ocultarLista();
    }
  });
}

function renderizarAutocomplete() {
  const lista = document.getElementById('autocompleteList');
  if (!lista) return;

  if (!autocompleteFiltro) {
    lista.classList.remove('visible');
    lista.innerHTML = '';
    return;
  }

  const filtrados = clientesCache.filter(c => 
    c.nombre.toLowerCase().startsWith(autocompleteFiltro)
  );

  if (filtrados.length === 0) {
    lista.classList.remove('visible');
    lista.innerHTML = '';
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
    if (cliente.email) detalles.push(`📧 ${cliente.email}`);
    
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
        <button type="button" onclick="cambiarPaginaAutocomplete(${autocompletePagina - 1})" ${autocompletePagina === 1 ? 'disabled' : ''}>‹ Anterior</button>
        <span>Pág. ${autocompletePagina} de ${totalPaginas} (${filtrados.length} clientes)</span>
        <button type="button" onclick="cambiarPaginaAutocomplete(${autocompletePagina + 1})" ${autocompletePagina === totalPaginas ? 'disabled' : ''}>Siguiente ›</button>
      </div>
    `;
  }

  lista.innerHTML = html;
  lista.classList.add('visible');
}

function cambiarPaginaAutocomplete(nuevaPagina) {
  const filtrados = clientesCache.filter(c => 
    c.nombre.toLowerCase().startsWith(autocompleteFiltro)
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
  
  const lista = document.getElementById('autocompleteList');
  if (lista) {
    lista.classList.remove('visible');
    lista.innerHTML = '';
  }
}

// ==========================================
// NOTIFICACIÓN TOAST
// ==========================================
function mostrarToast(texto, tipo) {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.style.cssText = `
      position: fixed; top: 80px; right: 20px; z-index: 9999;
      display: flex; flex-direction: column; gap: 10px; max-width: 350px;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgColor = tipo === 'exito' ? '#d1fae5' : (tipo === 'error' ? '#fee2e2' : '#fef3c7');
  const borderColor = tipo === 'exito' ? '#10b981' : (tipo === 'error' ? '#dc2626' : '#f59e0b');
  const textColor = tipo === 'exito' ? '#065f46' : (tipo === 'error' ? '#991b1b' : '#92400e');
  
  toast.style.cssText = `
    background: ${bgColor}; border-left: 4px solid ${borderColor}; color: ${textColor};
    padding: 14px 18px; border-radius: 8px; font-size: 14px; font-family: 'Poppins', sans-serif;
    font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: toastSlideIn 0.3s ease;
    display: flex; align-items: center; gap: 10px;
  `;
  
  toast.innerHTML = `
    <span style="font-size: 18px;">${tipo === 'exito' ? '✅' : (tipo === 'error' ? '⚠️' : 'ℹ️')}</span>
    <span style="flex: 1;">${texto}</span>
    <span onclick="this.parentElement.remove()" style="cursor: pointer; font-size: 18px; opacity: 0.6;">✕</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'toastSlideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 3000);
}

if (!document.getElementById('toastStyles')) {
  const style = document.createElement('style');
  style.id = 'toastStyles';
  style.textContent = `
    @keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes toastSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
  `;
  document.head.appendChild(style);
}

// ==========================================
// AGREGAR EQUIPO
// ==========================================
async function agregarEquipo() {
  const input = document.getElementById('buscarEquipoInput');
  if (!input) return;
  
  let codigo = input.value.trim();
  if (!codigo) {
    mostrarToast('Por favor ingrese un código de barras o serial', 'error');
    input.value = '';
    input.focus();
    return;
  }

  codigo = codigo.replace(/'/g, '-').replace(/"/g, '-').replace(/`/g, '-').trim();
  
  try {
    const { data, error } = await supabaseClient
      .from('equipos')
      .select('*')
      .or(`codigo_barras.eq.${codigo},serial.eq.${codigo}`)
      .maybeSingle();

    if (error || !data) {
      mostrarToast(`Equipo no encontrado: "${codigo}"`, 'error');
      input.value = '';
      input.focus();
      return;
    }

    const existe = itemsRenta.find(item => item.codigo_barras === data.codigo_barras);
    if (existe) {
      mostrarToast('Este equipo ya está en la renta', 'error');
      input.value = '';
      input.focus();
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
    
    mostrarToast(`Equipo agregado: ${data.nombre_equipo}`, 'exito');

  } catch (err) {
    console.error('Error al agregar equipo:', err);
    mostrarToast('Error al buscar equipo', 'error');
    input.value = '';
    input.focus();
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
// GUARDAR RENTA
// ==========================================
async function guardarRenta() {
  const clienteNombre = document.getElementById('clienteNombre')?.value.trim() || '';
  const clienteTelefono = document.getElementById('clienteTelefono')?.value.trim() || '';
  const fechaRenta = document.getElementById('fechaRenta')?.value || '';
  const fechaDevolucion = document.getElementById('fechaDevolucion')?.value || '';
  
  if (!clienteNombre) { 
    mostrarMensaje('Por favor ingrese el nombre del cliente/responsable', 'error'); 
    return; 
  }
  
  // ✅ VALIDAR TELÉFONO (si se ingresó, debe ser 11 dígitos)
  if (clienteTelefono && clienteTelefono.length !== 11) {
    mostrarMensaje('El teléfono debe tener exactamente 11 dígitos', 'error');
    return;
  }
  
  // ✅ VALIDAR FECHAS
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
        cliente_telefono: clienteTelefono,
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

    if (typeof registrarLog === 'function') {
      const fechaInicioStr = new Date(fechaRenta + 'T12:00:00').toLocaleDateString('es-ES');
      const fechaDevStr = new Date(fechaDevolucion + 'T12:00:00').toLocaleDateString('es-ES');
      const descripcion = `Renta #${numeroRentaActual} | Cliente: ${clienteNombre} | Inicio: ${fechaInicioStr} | Devolución: ${fechaDevStr} | Equipos: ${itemsRenta.length} | Total: $${total.toFixed(2)} | Creada por: ${usuarioActualRenta?.email || 'Desconocido'}`;
      await registrarLog('rentar', 'Nueva renta creada', descripcion, 'success');
    }

    mostrarMensaje(`✅ Renta #${numeroRentaActual} guardada exitosamente`, 'exito');
    
    const btnImprimir = document.getElementById('btnImprimir');
    if (btnImprimir) btnImprimir.style.display = 'inline-block';
    if (btnGuardar) btnGuardar.textContent = '✅ Guardada';

    setTimeout(() => {
      imprimirComprobante();
    }, 500);

  } catch (err) {
    console.error('❌ Error al guardar renta:', err);
    mostrarMensaje('Error al guardar: ' + err.message, 'error');
    if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = ' Guardar Renta'; }
  }
}

// ==========================================
// IMPRIMIR COMPROBANTE (CON LOGO img/logo.png)
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

  // ✅ RUTA COMPLETA DEL LOGO (para que funcione en ventana nueva)
  const logoUrl = new URL('img/logo.png', window.location.href).href;

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
    .logo-img { 
      max-width: 120px;
      max-height: 120px;
      object-fit: contain;
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
      <img src="${logoUrl}" alt="Logo Eventos D' Primera" class="logo-img" onerror="this.style.display='none'">
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

  <h3 style="margin: 20px 0 10px 0; color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px;">📦 Equipos Rentados (${itemsRenta.length})</h3>
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
        <p><strong>${usuarioActualRenta?.email || 'Administrador'}</strong></p>
        <p>Entregado por</p>
        <p style="font-size: 10px; color: #666;">Firma del responsable</p>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>©copyright Eventos de Primera | 2026-2027 | Documento generado el ${new Date().toLocaleString('es-ES')}</p>
  </div>

  <div class="no-print" style="margin-top: 30px; text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
    <button onclick="window.print()" style="padding: 12px 30px; background: #1e3a8a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-right: 10px;">
      🖨️ Imprimir Comprobante
    </button>
    <button onclick="window.close()" style="padding: 12px 30px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">
      ❌ Cerrar
    </button>
  </div>
</body>
</html>`;

  ventana.document.write(html);
  ventana.document.close();
}

// ==========================================
// LIMPIAR FORMULARIO
// ==========================================
function limpiarFormulario() {
  if (itemsRenta.length > 0 && !confirm('¿Está seguro de iniciar una nueva renta? Se perderán los datos no guardados.')) return;

  itemsRenta = [];
  rentaGuardadaId = null;
  
  ['clienteNombre', 'clienteTelefono', 'clienteEmail', 'clienteDireccion', 'ingenieroNombre', 'ingenieroContacto', 'observaciones'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  
  const descuentoEl = document.getElementById('descuento');
  if (descuentoEl) descuentoEl.value = '0';
  
  const btnImprimir = document.getElementById('btnImprimir');
  if (btnImprimir) btnImprimir.style.display = 'none';
  
  const btnGuardar = document.getElementById('btnGuardar');
  if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = '💾 Guardar Renta'; }
  
  // ✅ RESTABLECER FECHAS CON VALIDACIÓN
  const hoy = new Date();
  const fechaHoy = hoy.toISOString().split('T')[0];
  
  const elFechaRenta = document.getElementById('fechaRenta');
  const elFechaDevolucion = document.getElementById('fechaDevolucion');
  const fechaEmision = document.getElementById('fechaEmision');
  
  if (elFechaRenta) {
    elFechaRenta.value = fechaHoy;
    elFechaRenta.min = fechaHoy;
  }
  if (elFechaDevolucion) {
    const fechaDev = new Date();
    fechaDev.setDate(fechaDev.getDate() + 7);
    elFechaDevolucion.value = fechaDev.toISOString().split('T')[0];
    elFechaDevolucion.min = fechaHoy;
  }
  if (fechaEmision) {
    fechaEmision.textContent = hoy.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  }
  
  const lista = document.getElementById('autocompleteList');
  if (lista) {
    lista.classList.remove('visible');
    lista.innerHTML = '';
  }
  
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
  console.log('📄 Nueva Renta DOM cargado');
  inicializarNuevaRenta();
});
