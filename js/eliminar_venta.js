// ==========================================
// VARIABLES GLOBALES
// ==========================================
let ventaAEliminar = null;
let usuarioActualElimVenta = null;
let paginaActualElimVenta = 1;
const POR_PAGINA_ELIM_VENTA = 20;
let totalVentasElim = 0;

// ==========================================
// TOAST
// ==========================================
function mostrarToastElimVenta(texto, tipo) {
  let toastContainer = document.getElementById('toastContainerElimVenta');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainerElimVenta';
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

if (!document.getElementById('toastStylesElimVenta')) {
  const style = document.createElement('style');
  style.id = 'toastStylesElimVenta';
  style.textContent = `@keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes toastSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }`;
  document.head.appendChild(style);
}

// ==========================================
// ZOOM
// ==========================================
function abrirZoomInfalibleElimVenta(url) {
  const modal = document.createElement('div');
  modal.id = 'modalZoomDinamicoElimVenta';
  modal.style.cssText = `position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background-color: rgba(0, 0, 0, 0.95) !important; z-index: 999999 !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: zoom-out;`;
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = `position: absolute !important; top: 20px !important; right: 30px !important; color: #fff !important; font-size: 40px !important; font-weight: bold !important; cursor: pointer !important; background: none !important; border: none !important; z-index: 1000000 !important;`;
  closeBtn.onclick = function(e) { e.stopPropagation(); cerrarZoomInfalibleElimVenta(); };
  const img = document.createElement('img');
  img.src = url;
  img.alt = 'Zoom de foto';
  img.style.cssText = `max-width: 90% !important; max-height: 90vh !important; border-radius: 8px; box-shadow: 0 0 30px rgba(0,0,0,0.8); cursor: default;`;
  modal.appendChild(closeBtn);
  modal.appendChild(img);
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  modal.addEventListener('click', function(e) { if (e.target === modal) cerrarZoomInfalibleElimVenta(); });
}

function cerrarZoomInfalibleElimVenta() {
  const modal = document.getElementById('modalZoomDinamicoElimVenta');
  if (modal) { modal.remove(); document.body.style.overflow = ''; }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarEliminarVenta() {
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }
  if (typeof supabaseClient === 'undefined') {
    mostrarToastElimVenta('Error: Supabase no está disponible', 'error');
    return;
  }
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    const { data } = await supabaseClient.from('usuarios').select('*').eq('email', session.user.email).maybeSingle();
    usuarioActualElimVenta = data || { email: session.user.email, id: session.user.id };
  }
  await buscarVentasEliminar();
}

// ==========================================
// BUSCAR VENTAS CON FILTROS
// ==========================================
async function buscarVentasEliminar() {
  const filtroCliente = document.getElementById('filtroClienteElim')?.value.trim() || '';
  const filtroNumero = document.getElementById('filtroNumeroElim')?.value.trim().toUpperCase() || '';
  const filtroDesde = document.getElementById('filtroFechaDesdeElim')?.value || '';
  const filtroHasta = document.getElementById('filtroFechaHastaElim')?.value || '';

  const tbody = document.getElementById('tbodyVentasElim');
  const totalSpan = document.getElementById('totalVentasElim');
  if (!tbody) return;

  try {
    const desde = (paginaActualElimVenta - 1) * POR_PAGINA_ELIM_VENTA;
    const hasta = desde + POR_PAGINA_ELIM_VENTA - 1;

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

    totalVentasElim = count || 0;
    if (totalSpan) totalSpan.textContent = totalVentasElim;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 40px; color: #6b7280;"><div style="font-size: 40px; margin-bottom: 10px;">📭</div><div>No se encontraron ventas con los filtros aplicados</div></td></tr>`;
      document.getElementById('paginacionVentasElim').innerHTML = '';
      return;
    }

    tbody.innerHTML = data.map((venta, index) => {
      const globalIndex = desde + index + 1;
      const fecha = new Date(venta.fecha_venta).toLocaleDateString('es-ES');
      const comprador = `${venta.comprador_nombre || ''} ${venta.comprador_apellido || ''}`.trim();
      return `
        <tr onclick="seleccionarVentaEliminar('${venta.id}')" id="fila-venta-elim-${venta.id}">
          <td>${globalIndex}</td>
          <td style="font-family: monospace; font-weight: 600; color: #1e3a8a;">${venta.numero_venta}</td>
          <td>${fecha}</td>
          <td><strong>${venta.nombre_equipo}</strong></td>
          <td>${venta.serial || '-'}</td>
          <td>${comprador}</td>
          <td>${venta.comprador_cedula || '-'}</td>
          <td style="text-align: right; color: #047857; font-weight: 600;">$${parseFloat(venta.precio_venta).toFixed(2)}</td>
          <td style="text-align: center;">
            <button type="button" onclick="event.stopPropagation(); seleccionarVentaEliminar('${venta.id}')" 
                    style="background: #fee2e2; color: #dc2626; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">
              🗑️ Eliminar
            </button>
          </td>
        </tr>
      `;
    }).join('');

    renderizarPaginacionEliminarVenta();
  } catch (err) {
    console.error('Error al buscar ventas:', err);
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 40px; color: #ef4444;">Error al cargar: ${err.message}</td></tr>`;
  }
}

// ==========================================
// PAGINACIÓN
// ==========================================
function renderizarPaginacionEliminarVenta() {
  const cont = document.getElementById('paginacionVentasElim');
  if (!cont) return;

  const totalPaginas = Math.ceil(totalVentasElim / POR_PAGINA_ELIM_VENTA);
  if (totalPaginas <= 1) {
    cont.innerHTML = `<span style="color: #6b7280; font-size: 13px;">Total: ${totalVentasElim} venta(s)</span>`;
    return;
  }

  let html = '';
  html += `<button type="button" onclick="cambiarPaginaEliminarVenta(${paginaActualElimVenta - 1})" 
           style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px;"
           ${paginaActualElimVenta === 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>‹ Anterior</button>`;
  html += `<span style="color: #374151; font-size: 13px; font-weight: 600;">Página ${paginaActualElimVenta} de ${totalPaginas}</span>`;
  html += `<button type="button" onclick="cambiarPaginaEliminarVenta(${paginaActualElimVenta + 1})" 
           style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px;"
           ${paginaActualElimVenta === totalPaginas ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>Siguiente ›</button>`;
  html += `<span style="color: #6b7280; font-size: 13px;">Total: ${totalVentasElim}</span>`;

  cont.innerHTML = html;
}

async function cambiarPaginaEliminarVenta(nuevaPagina) {
  const totalPaginas = Math.ceil(totalVentasElim / POR_PAGINA_ELIM_VENTA);
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
  paginaActualElimVenta = nuevaPagina;
  await buscarVentasEliminar();
  document.getElementById('fieldsetListaVentasElim')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// LIMPIAR FILTROS
// ==========================================
function limpiarFiltrosEliminar() {
  document.getElementById('filtroClienteElim').value = '';
  document.getElementById('filtroNumeroElim').value = '';
  document.getElementById('filtroFechaDesdeElim').value = '';
  document.getElementById('filtroFechaHastaElim').value = '';
  paginaActualElimVenta = 1;
  buscarVentasEliminar();
}

// ==========================================
// SELECCIONAR VENTA PARA ELIMINAR
// ==========================================
async function seleccionarVentaEliminar(id) {
  try {
    const { data, error } = await supabaseClient
      .from('ventas')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      mostrarToastElimVenta('Error al cargar la venta', 'error');
      return;
    }

    ventaAEliminar = data;

    // Resaltar fila seleccionada
    document.querySelectorAll('#tbodyVentasElim tr').forEach(tr => tr.classList.remove('selected'));
    const fila = document.getElementById(`fila-venta-elim-${id}`);
    if (fila) fila.classList.add('selected');

    // Llenar ficha solo lectura
    document.getElementById('elimVentaNumero').textContent = data.numero_venta || '-';
    document.getElementById('elimVentaFecha').textContent = data.fecha_venta ? new Date(data.fecha_venta).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
    document.getElementById('elimVentaCodigo').textContent = data.codigo_barras || '-';
    document.getElementById('elimVentaNombre').textContent = data.nombre_equipo || '-';
    document.getElementById('elimVentaSerial').textContent = data.serial || '-';
    document.getElementById('elimVentaPrecio').textContent = `$${parseFloat(data.precio_venta).toFixed(2)}`;
    document.getElementById('elimVentaComprador').textContent = `${data.comprador_nombre || ''} ${data.comprador_apellido || ''}`.trim() || '-';
    document.getElementById('elimVentaCedula').textContent = data.comprador_cedula || '-';
    document.getElementById('fieldsetDetallesElim').style.display = 'block';

    // Fotos del equipo vendido
    const contenedorFotos = document.getElementById('fotosEquipoEliminar');
    contenedorFotos.innerHTML = '';
    const fotos = data.fotos_equipo || [];
    if (fotos.length === 0) {
      contenedorFotos.innerHTML = `<div class="foto-preview-placeholder"><div class="foto-preview-placeholder-icon">📷</div><div>Sin fotos registradas</div></div>`;
    } else {
      fotos.forEach((url, i) => {
        const div = document.createElement('div');
        div.className = 'foto-preview';
        div.onclick = function() { abrirZoomInfalibleElimVenta(url); };
        div.innerHTML = `<img src="${url}" alt="Foto ${i+1}">`;
        contenedorFotos.appendChild(div);
      });
    }

    document.getElementById('botonesAccionElimVenta').style.display = 'flex';
    document.getElementById('fieldsetDetallesElim').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    console.error('Error al seleccionar venta:', err);
    mostrarToastElimVenta('Error: ' + err.message, 'error');
  }
}

// ==========================================
// CONFIRMAR Y ELIMINAR (CON LOGS)
// ==========================================
async function confirmarEliminarVenta() {
  if (!ventaAEliminar) return;

  const confirmacion = prompt(`⚠️ CONFIRMACIÓN DE SEGURIDAD\n\nPara eliminar permanentemente la venta ${ventaAEliminar.numero_venta}, escriba la palabra ELIMINAR en mayúsculas:`);
  
  if (confirmacion !== 'ELIMINAR') {
    mostrarToastElimVenta('❌ Operación cancelada. La palabra de confirmación no coincide.', 'error');
    return;
  }

  const btnEliminar = document.getElementById('btnEliminarVenta');
  btnEliminar.disabled = true;
  btnEliminar.textContent = '⏳ Eliminando...';

  try {
    // Eliminar de la tabla ventas
    const { error } = await supabaseClient
      .from('ventas')
      .delete()
      .eq('id', ventaAEliminar.id);

    if (error) throw error;

    // ✅ Registrar en logs
    if (typeof registrarLog === 'function') {
      const descripcion = `Venta ELIMINADA | N° Venta: ${ventaAEliminar.numero_venta} | Equipo: ${ventaAEliminar.nombre_equipo} (${ventaAEliminar.codigo_barras}) | Comprador: ${ventaAEliminar.comprador_nombre} ${ventaAEliminar.comprador_apellido} | Precio: $${parseFloat(ventaAEliminar.precio_venta).toFixed(2)} | Eliminado por: ${usuarioActualElimVenta?.email || 'Desconocido'}`;
      await registrarLog('ventas', 'Venta eliminada', descripcion, 'error');
    }

    mostrarToastElimVenta('🗑️ Venta eliminada permanentemente y registrada en logs', 'exito');
    
    // Actualizar la lista y limpiar
    setTimeout(() => {
      limpiarFormularioElimVenta();
      buscarVentasEliminar();
    }, 1000);

  } catch (err) {
    console.error('Error al eliminar venta:', err);
    mostrarToastElimVenta('Error al eliminar: ' + err.message, 'error');
  } finally {
    const btn = document.getElementById('btnEliminarVenta');
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🗑️ Eliminar Venta Permanentemente';
    }
  }
}

// ==========================================
// IMPRIMIR NOTA DE ENTREGA
// ==========================================
function imprimirNotaVentaEliminar() {
  if (!ventaAEliminar) {
    mostrarToastElimVenta('No hay ninguna venta seleccionada para imprimir', 'error');
    return;
  }

  const logoUrl = new URL('../img/logo.png', window.location.href).href;
  const fecha = new Date(ventaAEliminar.fecha_venta).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const fotos = ventaAEliminar.fotos_equipo || [];
  const fotosHTML = fotos.map((url, i) => 
    `<img src="${url}" style="width: 100px; height: 100px; object-fit: cover; border: 1px solid #ccc; border-radius: 4px; margin: 5px;">`
  ).join('');

  const ventana = window.open('', '_blank', 'width=800,height=900');
  ventana.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Nota de Entrega - ${ventaAEliminar.numero_venta}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; }
        .logo { max-width: 150px; margin-bottom: 10px; }
        .titulo { font-size: 24px; font-weight: bold; color: #1e3a8a; margin: 10px 0; }
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
        <div style="font-size: 14px; color: #666;">Nota de Entrega de Venta (Copia de Registro)</div>
        <div style="margin-top: 10px; font-size: 18px; font-weight: bold; color: #dc2626;">N° ${ventaAEliminar.numero_venta}</div>
        <div style="font-size: 12px; color: #666;">Fecha: ${fecha}</div>
      </div>
      <div class="seccion">
        <h3>👤 Datos del Comprador</h3>
        <div class="grid">
          <div class="dato"><strong>Nombre:</strong> ${ventaAEliminar.comprador_nombre} ${ventaAEliminar.comprador_apellido}</div>
          <div class="dato"><strong>Cédula:</strong> ${ventaAEliminar.comprador_cedula}</div>
          <div class="dato"><strong>Teléfono:</strong> ${ventaAEliminar.comprador_telefono}</div>
          <div class="dato" style="grid-column: 1 / -1;"><strong>Dirección:</strong> ${ventaAEliminar.comprador_direccion || 'N/A'}</div>
        </div>
      </div>
      <div class="seccion">
        <h3>📦 Equipo Vendido</h3>
        <div class="grid">
          <div class="dato"><strong>Equipo:</strong> ${ventaAEliminar.nombre_equipo}</div>
          <div class="dato"><strong>Código:</strong> ${ventaAEliminar.codigo_barras}</div>
          <div class="dato"><strong>Serial:</strong> ${ventaAEliminar.serial || 'N/A'}</div>
        </div>
        ${fotosHTML ? `<div style="margin-top: 15px;"><strong>Fotos del equipo:</strong><br>${fotosHTML}</div>` : ''}
      </div>
      <div class="total">TOTAL PAGADO: $${parseFloat(ventaAEliminar.precio_venta).toFixed(2)}</div>
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
function limpiarFormularioElimVenta() {
  ventaAEliminar = null;
  document.getElementById('fieldsetDetallesElim').style.display = 'none';
  document.getElementById('botonesAccionElimVenta').style.display = 'none';
  
  const contenedorFotos = document.getElementById('fotosEquipoEliminar');
  if (contenedorFotos) contenedorFotos.innerHTML = '';

  document.querySelectorAll('#tbodyVentasElim tr').forEach(tr => tr.classList.remove('selected'));

  const btnEliminar = document.getElementById('btnEliminarVenta');
  if (btnEliminar) {
    btnEliminar.disabled = false;
    btnEliminar.textContent = '🗑️ Eliminar Venta Permanentemente';
  }

  document.getElementById('fieldsetListaVentasElim').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  inicializarEliminarVenta();
});
