// ==========================================
// VARIABLES GLOBALES
// ==========================================
let rentasHistCache = [];
let paginaActualHist = 1;
const POR_PAGINA_HIST = 20;
let usuarioActualHist = null;

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarHistorialRentas() {
  console.log('📜 === INICIANDO HISTORIAL DE RENTAS ===');

  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }

  if (typeof supabaseClient === 'undefined') {
    mostrarMensajeHist('Error: Supabase no está disponible', 'error');
    return;
  }

  await cargarUsuarioHist();
  
  // ✅ Cargar automáticamente todas las rentas activas y vencidas al iniciar
  await buscarRentasHistorial();

  console.log('✅ === HISTORIAL DE RENTAS INICIALIZADO ===');
}

// ==========================================
// CARGAR USUARIO
// ==========================================
async function cargarUsuarioHist() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data, error } = await supabaseClient
      .from('usuarios')
      .select('*')
      .eq('email', session.user.email)
      .maybeSingle();

    if (data && !error) {
      usuarioActualHist = data;
    } else {
      usuarioActualHist = { email: session.user.email, id: session.user.id };
    }
  } catch (err) {
    console.error('Error al cargar usuario:', err);
  }
}

// ==========================================
// BUSCAR RENTAS (Activas y Vencidas)
// ==========================================
async function buscarRentasHistorial() {
  const filtroCliente = document.getElementById('filtroClienteHist')?.value.trim() || '';
  const filtroNumero = document.getElementById('filtroNumeroHist')?.value.trim() || '';
  const filtroDesde = document.getElementById('filtroFechaDesdeHist')?.value || '';
  const filtroHasta = document.getElementById('filtroFechaHastaHist')?.value || '';

  try {
    const hoy = new Date().toISOString().split('T')[0];

    // Consulta base: solo rentas activas o vencidas (excluye devueltas y canceladas)
    let query = supabaseClient
      .from('rentas')
      .select('*', { count: 'exact' })
      .neq('estado', 'devuelta')
      .neq('estado', 'cancelada')
      .order('fecha_renta', { ascending: false });

    // Aplicar filtros
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
    const desde = (paginaActualHist - 1) * POR_PAGINA_HIST;
    const hasta = desde + POR_PAGINA_HIST - 1;
    query = query.range(desde, hasta);

    const { data, error, count } = await query;

    if (error) throw error;

    rentasHistCache = data || [];
    renderizarTablaHist(count || 0);

  } catch (err) {
    console.error('Error al buscar rentas:', err);
    mostrarMensajeHist('Error al buscar rentas: ' + err.message, 'error');
  }
}

// ==========================================
// RENDERIZAR TABLA
// ==========================================
function renderizarTablaHist(totalRegistros) {
  const tbody = document.getElementById('tbodyRentasHist');
  if (!tbody) return;

  if (rentasHistCache.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: #10b981;">
          <div style="font-size: 40px; margin-bottom: 10px;">✅</div>
          <div style="font-weight: 600;">¡No hay rentas activas o vencidas!</div>
          <div style="font-size: 13px; margin-top: 5px;">Todas las rentas han sido terminadas</div>
        </td>
      </tr>`;
    document.getElementById('paginacionHist').innerHTML = '';
    return;
  }

  tbody.innerHTML = rentasHistCache.map((renta, index) => {
    const globalIndex = (paginaActualHist - 1) * POR_PAGINA_HIST + index + 1;
    const fechaInicio = new Date(renta.fecha_renta + 'T12:00:00').toLocaleDateString('es-ES');
    const fechaDev = new Date(renta.fecha_devolucion + 'T12:00:00').toLocaleDateString('es-ES');
    
    // Determinar estado (activa o vencida)
    const hoy = new Date().toISOString().split('T')[0];
    const estadoReal = (renta.fecha_devolucion < hoy && renta.estado !== 'devuelta') ? 'vencida' : 'activa';
    
    const estadoColors = {
      'activa': '#10b981',
      'vencida': '#ef4444'
    };
    const colorEstado = estadoColors[estadoReal];
    const estadoDisplay = estadoReal === 'activa' ? 'Activa' : 'Vencida';

    return `
      <tr>
        <td>${globalIndex}</td>
        <td style="font-family: monospace; font-weight: 600; color: #1e3a8a;">${renta.numero_renta}</td>
        <td><strong>${renta.cliente_nombre}</strong></td>
        <td>${fechaInicio}</td>
        <td>${fechaDev}</td>
        <td style="text-align: center;">
          <span style="background: ${colorEstado}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 11px; text-transform: capitalize;">
            ${estadoDisplay}
          </span>
        </td>
        <td style="text-align: right; font-weight: 600;">$${parseFloat(renta.total).toFixed(2)}</td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
            <button type="button" class="btn-action btn-primary" onclick="imprimirRentaHist('${renta.numero_renta}')" 
                    title="Imprimir comprobante" style="padding: 6px 12px; font-size: 12px;">
              🖨️ Imprimir
            </button>
            <button type="button" class="btn-action btn-print" onclick="marcarRecibidaHist('${renta.numero_renta}')" 
                    title="Marcar como recibida y mover a terminadas" style="padding: 6px 12px; font-size: 12px;">
              ✅ Recibido
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  renderizarPaginacionHist(totalRegistros);
}

// ==========================================
// PAGINACIÓN
// ==========================================
function renderizarPaginacionHist(totalRegistros) {
  const cont = document.getElementById('paginacionHist');
  if (!cont) return;

  const totalPaginas = Math.ceil(totalRegistros / POR_PAGINA_HIST);
  
  if (totalPaginas <= 1) {
    cont.innerHTML = `<span style="color: #6b7280; font-size: 13px;">Total: ${totalRegistros} renta(s)</span>`;
    return;
  }

  let html = '';
  html += `<button type="button" onclick="cambiarPaginaHist(${paginaActualHist - 1})" 
           style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px;"
           ${paginaActualHist === 1 ? 'style="opacity: 0.4; cursor: not-allowed;"' : ''}>‹ Anterior</button>`;
  
  html += `<span style="color: #374151; font-size: 13px; font-weight: 600;">Página ${paginaActualHist} de ${totalPaginas}</span>`;
  
  html += `<button type="button" onclick="cambiarPaginaHist(${paginaActualHist + 1})" 
           style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px;"
           ${paginaActualHist === totalPaginas ? 'style="opacity: 0.4; cursor: not-allowed;"' : ''}>Siguiente ›</button>`;
  
  html += `<span style="color: #6b7280; font-size: 13px;">Total: ${totalRegistros} renta(s)</span>`;

  cont.innerHTML = html;
}

async function cambiarPaginaHist(nuevaPagina) {
  const totalRegistros = rentasHistCache.length;
  const totalPaginas = Math.ceil(totalRegistros / POR_PAGINA_HIST);
  
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
  
  paginaActualHist = nuevaPagina;
  await buscarRentasHistorial();
  
  document.getElementById('fieldsetListaHist')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==========================================
// LIMPIAR FILTROS
// ==========================================
function limpiarFiltrosHistorial() {
  document.getElementById('filtroClienteHist').value = '';
  document.getElementById('filtroNumeroHist').value = '';
  document.getElementById('filtroFechaDesdeHist').value = '';
  document.getElementById('filtroFechaHastaHist').value = '';
  paginaActualHist = 1;
  buscarRentasHistorial();
}

// ==========================================
// MARCAR COMO RECIBIDA (Mover a terminadas)
// ==========================================
async function marcarRecibidaHist(numeroRenta) {
  const confirmacion = confirm(`¿Confirmar que la renta #${numeroRenta} ha sido recibida?\n\nEsta acción:\n- Cambiará el estado a "Terminada"\n- Moverá la renta al historial de terminadas\n- Registrará la fecha real de devolución\n- Quedará fuera de esta lista`);
  
  if (!confirmacion) return;

  try {
    // 1. Cargar datos completos de la renta
    const { data: renta, error: errorRenta } = await supabaseClient
      .from('rentas')
      .select('*')
      .eq('numero_renta', numeroRenta)
      .single();

    if (errorRenta || !renta) {
      mostrarMensajeHist('No se pudo cargar la renta', 'error');
      return;
    }

    // 2. Cargar items de la renta
    const { data: items, error: errorItems } = await supabaseClient
      .from('rentas_items')
      .select('*')
      .eq('renta_id', renta.id);

    if (errorItems) throw errorItems;

    // 3. Calcular días de diferencia (anticipado o retraso)
    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0];
    const fechaDevProgramada = new Date(renta.fecha_devolucion + 'T12:00:00');
    const diffTime = fechaDevProgramada - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let diasAnticipados = null;
    let diasRetraso = null;
    
    if (diffDays > 0) {
      diasAnticipados = diffDays;
    } else if (diffDays < 0) {
      diasRetraso = Math.abs(diffDays);
    }

    // 4. Insertar en rentas_terminadas
    const { data: rentaTerminada, error: errorTerminada } = await supabaseClient
      .from('rentas_terminadas')
      .insert({
        numero_renta: renta.numero_renta,
        serie: renta.serie || 'RENT',
        fecha_renta: renta.fecha_renta,
        fecha_devolucion_programada: renta.fecha_devolucion,
        fecha_devolucion_real: fechaHoy,
        cliente_nombre: renta.cliente_nombre,
        cliente_telefono: renta.cliente_telefono,
        cliente_email: renta.cliente_email,
        cliente_direccion: renta.cliente_direccion,
        ingeniero_nombre: renta.ingeniero_nombre,
        ingeniero_contacto: renta.ingeniero_contacto,
        subtotal: renta.subtotal,
        descuento: renta.descuento,
        total: renta.total,
        estado: 'devuelta',
        observaciones: renta.observaciones,
        usuario_registro: renta.usuario_registro,
        usuario_registro_id: renta.usuario_registro_id,
        recibido_por_email: usuarioActualHist?.email || 'unknown',
        recibido_por_id: usuarioActualHist?.id || null,
        dias_anticipados: diasAnticipados,
        dias_retraso: diasRetraso,
        observaciones_terminacion: `Recibida el ${hoy.toLocaleDateString('es-ES')}${diasAnticipados ? ` (${diasAnticipados} días antes)` : ''}${diasRetraso ? ` (${diasRetraso} días tarde)` : ' (a tiempo)'}`
      })
      .select()
      .single();

    if (errorTerminada) throw new Error('Error al crear renta terminada: ' + errorTerminada.message);

    // 5. Insertar items en rentas_items_terminadas
    for (const item of items || []) {
      const { error: errorItem } = await supabaseClient
        .from('rentas_items_terminadas')
        .insert({
          renta_terminada_id: rentaTerminada.id,
          renta_id_original: item.renta_id,
          codigo_barras: item.codigo_barras,
          nombre_equipo: item.nombre_equipo,
          marca: item.marca,
          modelo: item.modelo,
          serial: item.serial,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal
        });

      if (errorItem) throw new Error('Error al crear item terminado: ' + errorItem.message);
    }

    // 6. Eliminar items de rentas_items
    const { error: errorDeleteItems } = await supabaseClient
      .from('rentas_items')
      .delete()
      .eq('renta_id', renta.id);

    if (errorDeleteItems) throw new Error('Error al eliminar items: ' + errorDeleteItems.message);

    // 7. Eliminar renta de rentas (ya está en terminadas)
    const { error: errorDeleteRenta } = await supabaseClient
      .from('rentas')
      .delete()
      .eq('id', renta.id);

    if (errorDeleteRenta) throw new Error('Error al eliminar renta: ' + errorDeleteRenta.message);

    // 8. Registrar en logs
    if (typeof registrarLog === 'function') {
      const descripcion = `Renta #${numeroRenta} marcada como recibida y terminada | Cliente: ${renta.cliente_nombre} | Total: $${parseFloat(renta.total).toFixed(2)} | ${diasAnticipados ? `${diasAnticipados} días antes` : diasRetraso ? `${diasRetraso} días tarde` : 'A tiempo'} | Recibido por: ${usuarioActualHist?.email || 'Desconocido'}`;
      await registrarLog('rentar', 'Renta terminada', descripcion, 'success');
    }

    mostrarMensajeHist(`✅ Renta #${numeroRenta} marcada como recibida y movida a terminadas`, 'exito');

    // 9. Recargar la lista automáticamente
    setTimeout(() => {
      buscarRentasHistorial();
    }, 1500);

  } catch (err) {
    console.error('Error al marcar como recibida:', err);
    mostrarMensajeHist('Error al procesar: ' + err.message, 'error');
  }
}

// ==========================================
// IMPRIMIR RENTA
// ==========================================
async function imprimirRentaHist(numeroRenta) {
  try {
    const { data: renta, error } = await supabaseClient
      .from('rentas')
      .select('*')
      .eq('numero_renta', numeroRenta)
      .single();

    if (error || !renta) {
      mostrarMensajeHist('No se pudo cargar la renta', 'error');
      return;
    }

    const { data: items, error: errorItems } = await supabaseClient
      .from('rentas_items')
      .select('*')
      .eq('renta_id', renta.id)
      .order('id', { ascending: true });

    if (errorItems) throw errorItems;

    const clienteNombre = renta.cliente_nombre || 'N/A';
    const clienteTel = renta.cliente_telefono || 'N/A';
    const clienteEmail = renta.cliente_email || 'N/A';
    const clienteDir = renta.cliente_direccion || 'N/A';
    const fechaRenta = renta.fecha_renta || '';
    const fechaDevolucion = renta.fecha_devolucion || '';
    const ingenieroNombre = renta.ingeniero_nombre || 'N/A';
    const ingenieroContacto = renta.ingeniero_contacto || 'N/A';
    const observaciones = renta.observaciones || '';
    const subtotal = `$${parseFloat(renta.subtotal || 0).toFixed(2)}`;
    const descuento = `$${parseFloat(renta.descuento || 0).toFixed(2)}`;
    const total = `$${parseFloat(renta.total || 0).toFixed(2)}`;
    const estado = renta.estado || 'activa';

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

    const ventana = window.open('', '_blank', 'width=900,height=1100');
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Comprobante de Renta #${numeroRenta}</title>
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
      <div class="label">Comprobante de Renta N°</div>
      <div class="valor">${numeroRenta}</div>
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
      <p><strong>Estado:</strong> 
        <span class="estado-badge" style="background: ${
          estado === 'activa' ? '#10b981' : 
          estado === 'devuelta' ? '#3b82f6' : 
          estado === 'vencida' ? '#ef4444' : '#6b7280'
        };">${estado}</span>
      </p>
    </div>
  </div>

  <h3 style="margin: 20px 0 10px 0; color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px;"> Equipos Rentados (${(items || []).length})</h3>
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
        <p><strong>${usuarioActualHist?.email || 'Administrador'}</strong></p>
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

  } catch (err) {
    console.error('Error al imprimir:', err);
    mostrarMensajeHist('Error al generar comprobante: ' + err.message, 'error');
  }
}

// ==========================================
// VER RENTAS TERMINADAS
// ==========================================
function verRentasTerminadas() {
  const submenuBtn = document.querySelector('[data-action="rentar-terminadas"]');
  if (submenuBtn) {
    submenuBtn.click();
  } else {
    if (typeof cargarContenido === 'function') {
      cargarContenido('rentar-terminadas');
    }
  }
}

// ==========================================
// MOSTRAR MENSAJE
// ==========================================
function mostrarMensajeHist(texto, tipo) {
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
  console.log('📄 Historial de Rentas DOM cargado');
  inicializarHistorialRentas();
});
