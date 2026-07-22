// ==========================================
// VARIABLES GLOBALES
// ==========================================
let ventaSeleccionada = null;
let usuarioActualModVenta = null;
let paginaActualModVenta = 1;
const POR_PAGINA_MOD_VENTA = 20;
let totalVentasMod = 0;

// ==========================================
// TOAST
// ==========================================
function mostrarToastModVenta(texto, tipo) {
  let toastContainer = document.getElementById('toastContainerModVenta');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainerModVenta';
    toastContainer.style.cssText = `position: fixed; top: 80px; right: 20px; z-index: 999999; display: flex; flex-direction: column; gap: 10px; max-width: 350px;`;
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  const bgColor = tipo === 'exito' ? '#d1fae5' : (tipo === 'error' ? '#fee2e2' : '#fef3c7');
  const borderColor = tipo === 'exito' ? '#10b981' : (tipo === 'error' ? '#dc2626' : '#f59e0b');
  const textColor = tipo === 'exito' ? '#065f46' : (tipo === 'error' ? '#991b1b' : '#92400e');
  toast.style.cssText = `background: ${bgColor}; border-left: 4px solid ${borderColor}; color: ${textColor}; padding: 14px 18px; border-radius: 8px; font-size: 14px; font-family: 'Poppins', sans-serif; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: toastSlideIn 0.3s ease; display: flex; align-items: center; gap: 10px;`;
  toast.innerHTML = `<span style="font-size: 18px;">${tipo === 'exito' ? '✅' : '⚠️'}</span><span style="flex: 1;">${texto}</span><span onclick="this.parentElement.remove()" style="cursor: pointer; font-size: 18px; opacity: 0.6;">✕</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'toastSlideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 3000);
}

if (!document.getElementById('toastStylesModVenta')) {
  const style = document.createElement('style');
  style.id = 'toastStylesModVenta';
  style.textContent = `@keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes toastSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }`;
  document.head.appendChild(style);
}

// ==========================================
// ZOOM
// ==========================================
function abrirZoomInfalibleModVenta(url) {
  const modal = document.createElement('div');
  modal.id = 'modalZoomDinamicoModVenta';
  modal.style.cssText = `position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background-color: rgba(0, 0, 0, 0.95) !important; z-index: 999999 !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: zoom-out;`;
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = `position: absolute !important; top: 20px !important; right: 30px !important; color: #fff !important; font-size: 40px !important; font-weight: bold !important; cursor: pointer !important; background: none !important; border: none !important; z-index: 1000000 !important;`;
  closeBtn.onclick = function(e) { e.stopPropagation(); cerrarZoomInfalibleModVenta(); };
  const img = document.createElement('img');
  img.src = url;
  img.alt = 'Zoom de foto';
  img.style.cssText = `max-width: 90% !important; max-height: 90vh !important; border-radius: 8px; box-shadow: 0 0 30px rgba(0,0,0,0.8); cursor: default;`;
  modal.appendChild(closeBtn);
  modal.appendChild(img);
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  modal.addEventListener('click', function(e) { if (e.target === modal) cerrarZoomInfalibleModVenta(); });
}

function cerrarZoomInfalibleModVenta() {
  const modal = document.getElementById('modalZoomDinamicoModVenta');
  if (modal) { modal.remove(); document.body.style.overflow = ''; }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarModificarVenta() {
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }
  if (typeof supabaseClient === 'undefined') {
    mostrarToastModVenta('Error: Supabase no está disponible', 'error');
    return;
  }
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    const { data } = await supabaseClient.from('usuarios').select('*').eq('email', session.user.email).maybeSingle();
    usuarioActualModVenta = data || { email: session.user.email, id: session.user.id };
  }
  await buscarVentas();
}

// ==========================================
// BUSCAR VENTAS CON FILTROS
// ==========================================
async function buscarVentas() {
  const filtroCliente = document.getElementById('filtroCliente')?.value.trim() || '';
  const filtroNumero = document.getElementById('filtroNumero')?.value.trim().toUpperCase() || '';
  const filtroDesde = document.getElementById('filtroFechaDesde')?.value || '';
  const filtroHasta = document.getElementById('filtroFechaHasta')?.value || '';

  const tbody = document.getElementById('tbodyVentasMod');
  const totalSpan = document.getElementById('totalVentas');
  if (!tbody) return;

  try {
    const desde = (paginaActualModVenta - 1) * POR_PAGINA_MOD_VENTA;
    const hasta = desde + POR_PAGINA_MOD_VENTA - 1;

    let query = supabaseClient
      .from('ventas')
      .select('*', { count: 'exact' })
      .order('fecha_venta', { ascending: false });

    if (filtroCliente) query = query.ilike('comprador_nombre', `%${filtroCliente}%`);
    if (filtroNumero) query = query.ilike('numero_venta', `%${filtroNumero}%`);
    if (filtroDesde) query = query.gte('fecha_venta', filtroDesde);
    if (filtroHasta) query = query.lte('fecha_venta', filtroHasta + 'T23:59:59');

    query = query.range(desde, hasta);

    const { data, count, error } = await query;
    if (error) throw error;

    totalVentasMod = count || 0;
    if (totalSpan) totalSpan.textContent = totalVentasMod;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 40px; color: #6b7280;"><div style="font-size: 40px; margin-bottom: 10px;">📭</div><div>No se encontraron ventas con los filtros aplicados</div></td></tr>`;
      document.getElementById('paginacionVentasMod').innerHTML = '';
      return;
    }

    tbody.innerHTML = data.map((venta, index) => {
      const globalIndex = desde + index + 1;
      const fecha = new Date(venta.fecha_venta).toLocaleDateString('es-ES');
      const comprador = `${venta.comprador_nombre || ''} ${venta.comprador_apellido || ''}`.trim();
      return `
        <tr onclick="seleccionarVenta('${venta.id}')" id="fila-venta-${venta.id}">
          <td>${globalIndex}</td>
          <td style="font-family: monospace; font-weight: 600; color: #1e3a8a;">${venta.numero_venta}</td>
          <td>${fecha}</td>
          <td><strong>${venta.nombre_equipo}</strong></td>
          <td>${venta.serial || '-'}</td>
          <td>${comprador}</td>
          <td>${venta.comprador_cedula || '-'}</td>
          <td style="text-align: right; color: #047857; font-weight: 600;">$${parseFloat(venta.precio_venta).toFixed(2)}</td>
          <td style="text-align: center;">
            <button type="button" onclick="event.stopPropagation(); seleccionarVenta('${venta.id}')" 
                    style="background: #dbeafe; color: #1e3a8a; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">
              ✏️ Editar
            </button>
          </td>
        </tr>
      `;
    }).join('');

    renderizarPaginacionModVenta();
  } catch (err) {
    console.error('Error al buscar ventas:', err);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 40px; color: #ef4444;">Error al cargar: ${err.message}</td></tr>`;
  }
}

// ==========================================
// PAGINACIÓN
// ==========================================
function renderizarPaginacionModVenta() {
  const cont = document.getElementById('paginacionVentasMod');
  if (!cont) return;

  const totalPaginas = Math.ceil(totalVentasMod / POR_PAGINA_MOD_VENTA);
  if (totalPaginas <= 1) {
    cont.innerHTML = `<span style="color: #6b7280; font-size: 13px;">Total: ${totalVentasMod} venta(s)</span>`;
    return;
  }

  let html = '';
  html += `<button type="button" onclick="cambiarPaginaModVenta(${paginaActualModVenta - 1})" 
           style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px;"
           ${paginaActualModVenta === 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>‹ Anterior</button>`;
  html += `<span style="color: #374151; font-size: 13px; font-weight: 600;">Página ${paginaActualModVenta} de ${totalPaginas}</span>`;
  html += `<button type="button" onclick="cambiarPaginaModVenta(${paginaActualModVenta + 1})" 
           style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px;"
           ${paginaActualModVenta === totalPaginas ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>Siguiente ›</button>`;
  html += `<span style="color: #6b7280; font-size: 13px;">Total: ${totalVentasMod}</span>`;

  cont.innerHTML = html;
}

async function cambiarPaginaModVenta(nuevaPagina) {
  const totalPaginas = Math.ceil(totalVentasMod / POR_PAGINA_MOD_VENTA);
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
  paginaActualModVenta = nuevaPagina;
  await buscarVentas();
  document.getElementById('fieldsetListaVentas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// LIMPIAR FILTROS
// ==========================================
function limpiarFiltros() {
  document.getElementById('filtroCliente').value = '';
  document.getElementById('filtroNumero').value = '';
  document.getElementById('filtroFechaDesde').value = '';
  document.getElementById('filtroFechaHasta').value = '';
  paginaActualModVenta = 1;
  buscarVentas();
}

// ==========================================
// SELECCIONAR VENTA
// ==========================================
async function seleccionarVenta(id) {
  try {
    const { data, error } = await supabaseClient
      .from('ventas')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      mostrarToastModVenta('Error al cargar la venta', 'error');
      return;
    }

    ventaSeleccionada = data;

    // Resaltar fila seleccionada
    document.querySelectorAll('#tbodyVentasMod tr').forEach(tr => tr.classList.remove('selected'));
    const fila = document.getElementById(`fila-venta-${id}`);
    if (fila) fila.classList.add('selected');

    // Ficha solo lectura
    document.getElementById('modVentaNumero').textContent = data.numero_venta || '-';
    document.getElementById('modVentaCodigo').textContent = data.codigo_barras || '-';
    document.getElementById('modVentaNombre').textContent = data.nombre_equipo || '-';
    document.getElementById('modVentaSerial').textContent = data.serial || '-';
    document.getElementById('fieldsetEquipoVendido').style.display = 'block';

    // Fotos del equipo vendido
    const contenedorFotos = document.getElementById('fotosEquipoVendidoMod');
    contenedorFotos.innerHTML = '';
    const fotos = data.fotos_equipo || [];
    if (fotos.length === 0) {
      contenedorFotos.innerHTML = `<div class="foto-preview-placeholder"><div class="foto-preview-placeholder-icon">📷</div><div>Sin fotos registradas</div></div>`;
    } else {
      fotos.forEach((url, i) => {
        const div = document.createElement('div');
        div.className = 'foto-preview';
        div.onclick = function() { abrirZoomInfalibleModVenta(url); };
        div.innerHTML = `<img src="${url}" alt="Foto ${i+1}">`;
        contenedorFotos.appendChild(div);
      });
    }

    // Campos editables
    document.getElementById('modCompradorNombre').value = data.comprador_nombre || '';
    document.getElementById('modCompradorApellido').value = data.comprador_apellido || '';
    document.getElementById('modCompradorCedula').value = data.comprador_cedula || '';
    document.getElementById('modCompradorTelefono').value = data.comprador_telefono || '';
    document.getElementById('modCompradorEmail').value = data.comprador_email || '';
    document.getElementById('modCompradorDireccion').value = data.comprador_direccion || '';
    document.getElementById('modPrecioVenta').value = data.precio_venta || '';

    document.getElementById('fieldsetDatosVentaMod').style.display = 'block';
    document.getElementById('botonesAccionModVenta').style.display = 'flex';

    document.getElementById('fieldsetEquipoVendido').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    console.error('Error al seleccionar venta:', err);
    mostrarToastModVenta('Error: ' + err.message, 'error');
  }
}

// ==========================================
// GUARDAR CAMBIOS (CON LOGS)
// ==========================================
async function guardarCambiosVenta() {
  if (!ventaSeleccionada) return;

  const nombre = document.getElementById('modCompradorNombre').value.trim();
  const apellido = document.getElementById('modCompradorApellido').value.trim();
  const cedula = document.getElementById('modCompradorCedula').value.trim();
  const telefono = document.getElementById('modCompradorTelefono').value.trim();
  const email = document.getElementById('modCompradorEmail').value.trim();
  const direccion = document.getElementById('modCompradorDireccion').value.trim();
  const precioVenta = document.getElementById('modPrecioVenta').value;

  if (!nombre || !apellido || !cedula || !telefono || !precioVenta) {
    mostrarToastModVenta('Complete todos los campos obligatorios (*)', 'error');
    return;
  }
  if (!/^\d{7,8}$/.test(cedula)) {
    mostrarToastModVenta('La cédula debe tener exactamente 7 u 8 dígitos numéricos', 'error');
    return;
  }
  if (!/^\d{11}$/.test(telefono)) {
    mostrarToastModVenta('El teléfono debe tener exactamente 11 dígitos numéricos', 'error');
    return;
  }

  const btnGuardar = document.getElementById('btnGuardarCambiosVenta');
  btnGuardar.disabled = true;
  btnGuardar.textContent = '⏳ Guardando...';

  try {
    const updateData = {
      comprador_nombre: nombre,
      comprador_apellido: apellido,
      comprador_cedula: cedula,
      comprador_telefono: telefono,
      comprador_email: email,
      comprador_direccion: direccion,
      precio_venta: parseFloat(precioVenta)
    };

    const { error } = await supabaseClient
      .from('ventas')
      .update(updateData)
      .eq('id', ventaSeleccionada.id);

    if (error) throw error;

    // Registrar en logs
    if (typeof registrarLog === 'function') {
      const descripcion = `Venta modificada | N° Venta: ${ventaSeleccionada.numero_venta} | Equipo: ${ventaSeleccionada.nombre_equipo} | Nuevo Comprador: ${nombre} ${apellido} (C.I: ${cedula}) | Nuevo Precio: $${parseFloat(precioVenta).toFixed(2)} | Modificado por: ${usuarioActualModVenta?.email || 'Desconocido'}`;
      await registrarLog('ventas', 'Venta modificada', descripcion, 'warning');
    }

    mostrarToastModVenta('✅ Cambios guardados exitosamente y registrados en logs', 'exito');
    
    // Actualizar la lista
    setTimeout(() => {
      buscarVentas();
    }, 1000);

  } catch (err) {
    console.error('Error al guardar cambios:', err);
    mostrarToastModVenta('Error al guardar: ' + err.message, 'error');
  } finally {
    const btn = document.getElementById('btnGuardarCambiosVenta');
    if (btn) {
      btn.disabled = false;
      btn.textContent = '💾 Guardar Cambios';
    }
  }
}

// ==========================================
// IMPRIMIR NOTA DE ENTREGA
// ==========================================
function imprimirNotaVenta() {
  if (!ventaSeleccionada) {
    mostrarToastModVenta('No hay ninguna venta seleccionada para imprimir', 'error');
    return;
  }

  const logoUrl = new URL('../img/logo.png', window.location.href).href;
  const fecha = new Date(ventaSeleccionada.fecha_venta).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const fotos = ventaSeleccionada.fotos_equipo || [];
  const fotosHTML = fotos.map((url, i) => 
    `<img src="${url}" style="width: 100px; height: 100px; object-fit: cover; border: 1px solid #ccc; border-radius: 4px; margin: 5px;">`
  ).join('');

  const ventana = window.open('', '_blank', 'width=800,height=900');
  ventana.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Nota de Entrega - ${ventaSeleccionada.numero_venta}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; }
        .logo { max-width: 150px; margin-bottom: 10px; }
        .titulo { font-size: 24px; font-weight: bold; color: #1e3a8a; margin: 10px 0; }
        .subtitulo { font-size: 14px; color: #666; }
        .seccion { margin-bottom: 20px; padding: 15px; background: #f9fafb; border-radius: 8px; }
        .seccion h3 { margin-top: 0; color: #1e3a8a; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .dato { margin: 5px 0; font-size: 14px; }
        .dato strong { color: #374151; }
        .total { text-align: right; font-size: 20px; font-weight: bold; color: #047857; margin-top: 20px; border-top: 2px solid #047857; padding-top: 10px; }
        .firmas { display: flex; justify-content: space-between; margin-top: 60px; text-align: center; }
        .firma { border-top: 1px solid #333; width: 40%; padding-top: 5px; font-size: 12px; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${logoUrl}" class="logo" onerror="this.style.display='none'">
        <div class="titulo">EVENTOS D' PRIMERA</div>
        <div class="subtitulo">Nota de Entrega de Venta</div>
        <div style="margin-top: 10px; font-size: 18px; font-weight: bold; color: #dc2626;">N° ${ventaSeleccionada.numero_venta}</div>
        <div style="font-size: 12px; color: #666;">Fecha: ${fecha}</div>
      </div>

      <div class="seccion">
        <h3>👤 Datos del Comprador</h3>
        <div class="grid">
          <div class="dato"><strong>Nombre:</strong> ${ventaSeleccionada.comprador_nombre} ${ventaSeleccionada.comprador_apellido}</div>
          <div class="dato"><strong>Cédula:</strong> ${ventaSeleccionada.comprador_cedula}</div>
          <div class="dato"><strong>Teléfono:</strong> ${ventaSeleccionada.comprador_telefono}</div>
          <div class="dato"><strong>Correo:</strong> ${ventaSeleccionada.comprador_email || 'N/A'}</div>
          <div class="dato" style="grid-column: 1 / -1;"><strong>Dirección:</strong> ${ventaSeleccionada.comprador_direccion || 'N/A'}</div>
        </div>
      </div>

      <div class="seccion">
        <h3>📦 Equipo Vendido</h3>
        <div class="grid">
          <div class="dato"><strong>Equipo:</strong> ${ventaSeleccionada.nombre_equipo}</div>
          <div class="dato"><strong>Marca/Modelo:</strong> ${ventaSeleccionada.marca || ''} ${ventaSeleccionada.modelo || ''}</div>
          <div class="dato"><strong>Código:</strong> ${ventaSeleccionada.codigo_barras}</div>
          <div class="dato"><strong>Serial:</strong> ${ventaSeleccionada.serial || 'N/A'}</div>
        </div>
        ${fotosHTML ? `<div style="margin-top: 15px;"><strong>Fotos del equipo:</strong><br>${fotosHTML}</div>` : ''}
      </div>

      <div class="total">TOTAL PAGADO: $${parseFloat(ventaSeleccionada.precio_venta).toFixed(2)}</div>

      <div class="firmas">
        <div class="firma">Firma del Comprador<br>C.I: ${ventaSeleccionada.comprador_cedula}</div>
        <div class="firma">Firma de Eventos D' Primera<br>${ventaSeleccionada.usuario_venta}</div>
      </div>

      <div class="no-print" style="text-align: center; margin-top: 30px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #1e3a8a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">🖨️ Imprimir Nota</button>
        <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin-left: 10px;">Cerrar</button>
      </div>
    </body>
    </html>
  `);
  ventana.document.close();
}

// ==========================================
// LIMPIAR FORMULARIO
// ==========================================
function limpiarFormularioModVenta() {
  ventaSeleccionada = null;
  document.getElementById('modCompradorNombre').value = '';
  document.getElementById('modCompradorApellido').value = '';
  document.getElementById('modCompradorCedula').value = '';
  document.getElementById('modCompradorTelefono').value = '';
  document.getElementById('modCompradorEmail').value = '';
  document.getElementById('modCompradorDireccion').value = '';
  document.getElementById('modPrecioVenta').value = '';

  document.getElementById('fieldsetEquipoVendido').style.display = 'none';
  document.getElementById('fieldsetDatosVentaMod').style.display = 'none';
  document.getElementById('botonesAccionModVenta').style.display = 'none';
  
  const contenedorFotos = document.getElementById('fotosEquipoVendidoMod');
  if (contenedorFotos) contenedorFotos.innerHTML = '';

  document.querySelectorAll('#tbodyVentasMod tr').forEach(tr => tr.classList.remove('selected'));

  document.getElementById('fieldsetListaVentas').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  inicializarModificarVenta();
});
