// ==========================================
// VARIABLES GLOBALES
// ==========================================
let rentasTermCache = [];
let paginaActualTerm = 1;
const POR_PAGINA_TERM = 20;
let usuarioActualTerm = null;

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarRentasTerminadas() {
  console.log('📋 === INICIANDO RENTAS TERMINADAS ===');

  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }

  if (typeof supabaseClient === 'undefined') {
    mostrarMensajeTerm('Error: Supabase no está disponible', 'error');
    return;
  }

  await cargarUsuarioTerm();
  await buscarRentasTerminadas();

  console.log('✅ === RENTAS TERMINADAS INICIALIZADO ===');
}

// ==========================================
// CARGAR USUARIO
// ==========================================
async function cargarUsuarioTerm() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data, error } = await supabaseClient
      .from('usuarios')
      .select('*')
      .eq('email', session.user.email)
      .maybeSingle();

    if (data && !error) {
      usuarioActualTerm = data;
    } else {
      usuarioActualTerm = { email: session.user.email, id: session.user.id };
    }
  } catch (err) {
    console.error('Error al cargar usuario:', err);
  }
}

// ==========================================
// BUSCAR RENTAS TERMINADAS
// ==========================================
async function buscarRentasTerminadas() {
  const filtroCliente = document.getElementById('filtroClienteTerm')?.value.trim() || '';
  const filtroNumero = document.getElementById('filtroNumeroTerm')?.value.trim() || '';
  const filtroDesde = document.getElementById('filtroFechaDesdeTerm')?.value || '';
  const filtroHasta = document.getElementById('filtroFechaHastaTerm')?.value || '';

  try {
    let query = supabaseClient
      .from('rentas_terminadas')
      .select('*', { count: 'exact' })
      .order('fecha_terminacion', { ascending: false });

    if (filtroCliente) {
      query = query.ilike('cliente_nombre', `%${filtroCliente}%`);
    }
    if (filtroNumero) {
      query = query.ilike('numero_renta', `%${filtroNumero}%`);
    }
    if (filtroDesde) {
      query = query.gte('fecha_terminacion', filtroDesde);
    }
    if (filtroHasta) {
      query = query.lte('fecha_terminacion', filtroHasta);
    }

    const desde = (paginaActualTerm - 1) * POR_PAGINA_TERM;
    const hasta = desde + POR_PAGINA_TERM - 1;
    query = query.range(desde, hasta);

    const { data, error, count } = await query;

    if (error) throw error;

    rentasTermCache = data || [];
    renderizarTablaTerm(count || 0);

    const totalSpan = document.getElementById('totalTerminadas');
    if (totalSpan) totalSpan.textContent = count || 0;

  } catch (err) {
    console.error('Error al buscar rentas terminadas:', err);
    mostrarMensajeTerm('Error al buscar: ' + err.message, 'error');
  }
}

// ==========================================
// RENDERIZAR TABLA
// ==========================================
function renderizarTablaTerm(totalRegistros) {
  const tbody = document.getElementById('tbodyTerminadas');
  const totalSpan = document.getElementById('totalTerminadas');
  if (!tbody) return;

  if (totalSpan) totalSpan.textContent = totalRegistros;

  if (rentasTermCache.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px; color: #6b7280;">
          <div style="font-size: 40px; margin-bottom: 10px;">📭</div>
          <div>No se encontraron rentas terminadas con los filtros aplicados</div>
        </td>
      </tr>`;
    document.getElementById('paginacionTerm').innerHTML = '';
    return;
  }

  tbody.innerHTML = rentasTermCache.map((renta, index) => {
    const globalIndex = (paginaActualTerm - 1) * POR_PAGINA_TERM + index + 1;
    const fechaInicio = new Date(renta.fecha_renta + 'T12:00:00').toLocaleDateString('es-ES');
    const fechaProg = new Date(renta.fecha_devolucion_programada + 'T12:00:00').toLocaleDateString('es-ES');
    const fechaReal = renta.fecha_devolucion_real ? new Date(renta.fecha_devolucion_real + 'T12:00:00').toLocaleDateString('es-ES') : 'N/A';
    
    let estadoEntrega = '';
    let estadoClass = '';
    
    if (renta.dias_anticipados && renta.dias_anticipados > 0) {
      estadoEntrega = `${renta.dias_anticipados}d antes`;
      estadoClass = 'anticipada';
    } else if (renta.dias_retraso && renta.dias_retraso > 0) {
      estadoEntrega = `${renta.dias_retraso}d tarde`;
      estadoClass = 'retrasada';
    } else {
      estadoEntrega = 'A tiempo';
      estadoClass = 'a-tiempo';
    }

    return `
      <tr>
        <td>${globalIndex}</td>
        <td style="font-family: monospace; font-weight: 600; color: #1e3a8a;">${renta.numero_renta}</td>
        <td><strong>${renta.cliente_nombre}</strong></td>
        <td>${fechaInicio}</td>
        <td>${fechaProg}</td>
        <td>${fechaReal}</td>
        <td style="text-align: center;">
          <span class="${estadoClass}">${estadoEntrega}</span>
        </td>
        <td style="text-align: right; font-weight: 600;">$${parseFloat(renta.total).toFixed(2)}</td>
        <td style="text-align: center;">
          <button type="button" onclick="imprimirRentaTerminada('${renta.numero_renta}')" 
                  title="Imprimir comprobante" 
                  style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.3s; box-shadow: 0 2px 4px rgba(30,58,138,0.2);"
                  onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(30,58,138,0.3)';"
                  onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(30,58,138,0.2)';">
            🖨️ Imprimir
          </button>
        </td>
      </tr>
    `;
  }).join('');

  renderizarPaginacionTerm(totalRegistros);
}

// ==========================================
// PAGINACIÓN
// ==========================================
function renderizarPaginacionTerm(totalRegistros) {
  const cont = document.getElementById('paginacionTerm');
  if (!cont) return;

  const totalPaginas = Math.ceil(totalRegistros / POR_PAGINA_TERM);
  
  if (totalPaginas <= 1) {
    cont.innerHTML = `<span style="color: #6b7280; font-size: 13px;">Total: ${totalRegistros} renta(s)</span>`;
    return;
  }

  let html = '';
  html += `<button type="button" onclick="cambiarPaginaTerm(${paginaActualTerm - 1})" 
           style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px;"
           ${paginaActualTerm === 1 ? 'style="opacity: 0.4; cursor: not-allowed;"' : ''}>‹ Anterior</button>`;
  
  html += `<span style="color: #374151; font-size: 13px; font-weight: 600;">Página ${paginaActualTerm} de ${totalPaginas}</span>`;
  
  html += `<button type="button" onclick="cambiarPaginaTerm(${paginaActualTerm + 1})" 
           style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px;"
           ${paginaActualTerm === totalPaginas ? 'style="opacity: 0.4; cursor: not-allowed;"' : ''}>Siguiente ›</button>`;
  
  html += `<span style="color: #6b7280; font-size: 13px;">Total: ${totalRegistros} renta(s)</span>`;

  cont.innerHTML = html;
}

async function cambiarPaginaTerm(nuevaPagina) {
  const totalRegistros = rentasTermCache.length;
  const totalPaginas = Math.ceil(totalRegistros / POR_PAGINA_TERM);
  
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
  
  paginaActualTerm = nuevaPagina;
  await buscarRentasTerminadas();
  
  document.getElementById('fieldsetListaTerm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// LIMPIAR FILTROS
// ==========================================
function limpiarFiltrosTerminadas() {
  document.getElementById('filtroClienteTerm').value = '';
  document.getElementById('filtroNumeroTerm').value = '';
  document.getElementById('filtroFechaDesdeTerm').value = '';
  document.getElementById('filtroFechaHastaTerm').value = '';
  paginaActualTerm = 1;
  buscarRentasTerminadas();
}

// ==========================================
// VOLVER AL HISTORIAL
// ==========================================
function volverAlHistorial() {
  // Simular navegación al historial
  const btnHist = document.querySelector('[data-action="rentar-historial"]');
  if (btnHist) {
    btnHist.click();
  }
}

// ==========================================
// IMPRIMIR RENTA TERMINADA
// ==========================================
async function imprimirRentaTerminada(numeroRenta) {
  try {
    const { data: renta, error } = await supabaseClient
      .from('rentas_terminadas')
      .select('*')
      .eq('numero_renta', numeroRenta)
      .single();

    if (error || !renta) {
      mostrarMensajeTerm('No se pudo cargar la renta', 'error');
      return;
    }

    const { data: items, error: errorItems } = await supabaseClient
      .from('rentas_items_terminadas')
      .select('*')
      .eq('renta_terminada_id', renta.id)
      .order('id', { ascending: true });

    if (errorItems) throw errorItems;

    const clienteNombre = renta.cliente_nombre || 'N/A';
    const clienteTel = renta.cliente_telefono || 'N/A';
    const clienteEmail = renta.cliente_email || 'N/A';
    const clienteDir = renta.cliente_direccion || 'N/A';
    const fechaRenta = renta.fecha_renta || '';
    const fechaDevProg = renta.fecha_devolucion_programada || '';
    const fechaDevReal = renta.fecha_devolucion_real || '';
    const ingenieroNombre = renta.ingeniero_nombre || 'N/A';
    const ingenieroContacto = renta.ingeniero_contacto || 'N/A';
    const observaciones = renta.observaciones || '';
    const subtotal = `$${parseFloat(renta.subtotal || 0).toFixed(2)}`;
    const descuento = `$${parseFloat(renta.descuento || 0).toFixed(2)}`;
    const total = `$${parseFloat(renta.total || 0).toFixed(2)}`;

    const logoUrl = new URL('img/logo.png', window.location.href).href;

    const itemsHTML = (items || []).map((item, i) => `
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

    let estadoEntregaTexto = 'A tiempo';
    if (renta.dias_anticipados && renta.dias_anticipados > 0) {
      estadoEntregaTexto = `${renta.dias_anticipados} día(s) antes`;
    } else if (renta.dias_retraso && renta.dias_retraso > 0) {
      estadoEntregaTexto = `${renta.dias_retraso} día(s) tarde`;
    }

    const ventana = window.open('', '_blank', 'width=900,height=1100');
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Comprobante de Renta Terminada #${numeroRenta}</title>
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
    .firmas { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; text-align: center; }
    .firma-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; }
    .firma-line p { margin: 3px 0; font-size: 12px; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    .terminada-aviso { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 8px 12px; border-radius: 6px; font-size: 11px; color: #1e40af; margin-bottom: 15px; text-align: center; font-weight: 600; }
    @media print { .no-print { display: none !important; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-container">
      <img src="${logoUrl}" alt="Logo" class="logo-img" onerror="this.style.display='none'">
    </div>
    <div class="brand">
      <h1>Eventos D' Primera</h1>
      <p>Sistema de Inventario y Rentas</p>
    </div>
    <div class="numero-renta-box">
      <div class="label">Comprobante de Renta Terminada N°</div>
      <div class="valor">${numeroRenta}</div>
    </div>
  </div>

  <div class="terminada-aviso">
    ✅ RENTA TERMINADA - Entregada ${estadoEntregaTexto} | Documento generado el ${new Date().toLocaleString('es-ES')}
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
      <p><strong>Fecha Programada:</strong> ${fechaDevProg ? new Date(fechaDevProg + 'T12:00:00').toLocaleDateString('es-ES') : 'N/A'}</p>
      <p><strong>Fecha Real Devolución:</strong> ${fechaDevReal ? new Date(fechaDevReal + 'T12:00:00').toLocaleDateString('es-ES') : 'N/A'}</p>
      <p><strong>Ingeniero:</strong> ${ingenieroNombre}</p>
      <p><strong>Contacto Ing.:</strong> ${ingenieroContacto}</p>
      <p><strong>Recibido por:</strong> ${renta.recibido_por_email || 'N/A'}</p>
    </div>
  </div>

  <h3 style="margin: 20px 0 10px 0; color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px;">📦 Equipos Rentados (${(items || []).length})</h3>
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
    <p>Descuento: <strong>${descuento}</strong></p>
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
        <p><strong>${renta.recibido_por_email || 'Administrador'}</strong></p>
        <p>Recibido por</p>
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

  } catch (err) {
    console.error('Error al imprimir:', err);
    mostrarMensajeTerm('Error al generar comprobante: ' + err.message, 'error');
  }
}

// ==========================================
// MOSTRAR MENSAJE
// ==========================================
function mostrarMensajeTerm(texto, tipo) {
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
  console.log(' Rentas Terminadas DOM cargado');
  inicializarRentasTerminadas();
});
