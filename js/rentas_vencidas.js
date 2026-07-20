// ==========================================
// VARIABLES GLOBALES
// ==========================================
let rentasVencidasCache = [];
let usuarioActualVencidas = null;

// ==========================================
// INYECTAR ESTILOS ESPECÍFICOS
// ==========================================
function inyectarEstilosVencidas() {
  if (document.getElementById('estilos-rentas-vencidas')) return;
  
  const style = document.createElement('style');
  style.id = 'estilos-rentas-vencidas';
  style.textContent = `
    .btn-recibida {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important;
      color: white !important;
      padding: 6px 12px !important;
      border: none !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      transition: all 0.3s !important;
      white-space: nowrap !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
    }
    .btn-recibida:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 4px 12px rgba(5,150,105,0.3) !important;
    }
    .btn-imprimir-vencida {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%) !important;
      color: white !important;
      padding: 6px 12px !important;
      border: none !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      transition: all 0.3s !important;
      margin-right: 5px !important;
      white-space: nowrap !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
    }
    .btn-imprimir-vencida:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 4px 12px rgba(30,58,138,0.3) !important;
    }
    .vencida-badge {
      background: #ef4444 !important;
      color: white !important;
      padding: 4px 10px !important;
      border-radius: 12px !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      display: inline-block !important;
      letter-spacing: 0.5px !important;
    }
  `;
  document.head.appendChild(style);
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarRentasVencidas() {
  console.log('⚠️ === INICIANDO RENTAS VENCIDAS ===');

  inyectarEstilosVencidas();

  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }

  if (typeof supabaseClient === 'undefined') {
    mostrarMensajeVencidas('Error: Supabase no está disponible', 'error');
    return;
  }

  await cargarUsuarioVencidas();
  await cargarRentasVencidas();

  console.log('✅ === RENTAS VENCIDAS INICIALIZADO ===');
}

// ==========================================
// CARGAR USUARIO
// ==========================================
async function cargarUsuarioVencidas() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data, error } = await supabaseClient
      .from('usuarios')
      .select('*')
      .eq('email', session.user.email)
      .maybeSingle();

    if (data && !error) {
      usuarioActualVencidas = data;
    } else {
      usuarioActualVencidas = { email: session.user.email, id: session.user.id };
    }
  } catch (err) {
    console.error('Error al cargar usuario:', err);
  }
}

// ==========================================
// CARGAR RENTAS VENCIDAS
// ==========================================
async function cargarRentasVencidas() {
  try {
    // Usamos la fecha de Caracas para consistencia
    const hoy = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Caracas"})).toISOString().split('T')[0];

    const { data, error } = await supabaseClient
      .from('rentas')
      .select('*')
      .lte('fecha_devolucion', hoy)
      .neq('estado', 'devuelta')
      .neq('estado', 'cancelada')
      .order('fecha_devolucion', { ascending: true });

    if (error) throw error;

    rentasVencidasCache = data || [];
    renderizarTablaVencidas();

  } catch (err) {
    console.error('Error al cargar rentas vencidas:', err);
    mostrarMensajeVencidas('Error al cargar rentas vencidas: ' + err.message, 'error');
  }
}

// ==========================================
// RENDERIZAR TABLA
// ==========================================
function renderizarTablaVencidas() {
  const tbody = document.getElementById('tbodyVencidas');
  const totalSpan = document.getElementById('totalVencidas');
  if (!tbody) return;

  if (totalSpan) totalSpan.textContent = rentasVencidasCache.length;

  if (rentasVencidasCache.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px; color: #10b981;">
          <div style="font-size: 40px; margin-bottom: 10px;">✅</div>
          <div style="font-weight: 600;">¡No hay rentas vencidas!</div>
          <div style="font-size: 13px; margin-top: 5px;">Todas las rentas están al día</div>
        </td>
      </tr>`;
    return;
  }

  const hoy = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Caracas"}));

  tbody.innerHTML = rentasVencidasCache.map((renta, index) => {
    const fechaInicio = new Date(renta.fecha_renta + 'T12:00:00').toLocaleDateString('es-ES');
    const fechaDev = new Date(renta.fecha_devolucion + 'T12:00:00').toLocaleDateString('es-ES');
    
    const fechaDevDate = new Date(renta.fecha_devolucion + 'T12:00:00');
    const diffTime = Math.abs(hoy - fechaDevDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return `
      <tr>
        <td>${index + 1}</td>
        <td style="font-family: monospace; font-weight: 600; color: #1e3a8a;">${renta.numero_renta}</td>
        <td><strong>${renta.cliente_nombre}</strong></td>
        <td>${renta.cliente_telefono || 'N/A'}</td>
        <td>${fechaInicio}</td>
        <td>${fechaDev}</td>
        <td style="text-align: center;">
          <span class="vencida-badge">${diffDays} día${diffDays !== 1 ? 's' : ''}</span>
        </td>
        <td style="text-align: right; font-weight: 600;">$${parseFloat(renta.total).toFixed(2)}</td>
        <td style="text-align: center;">
          <button type="button" class="btn-imprimir-vencida" onclick="imprimirRentaVencida('${renta.numero_renta}')" title="Imprimir comprobante">
            🖨️ Imprimir
          </button>
          <button type="button" class="btn-recibida" onclick="marcarComoRecibida('${renta.numero_renta}')" title="Marcar como recibida">
            ✅ Recibida
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================
// ✅ MARCAR COMO RECIBIDA (MUEVE A TERMINADAS Y ELIMINA DE ACTIVA)
// ==========================================
async function marcarComoRecibida(numeroRenta) {
  const confirmacion = confirm(`¿Confirmar que la renta #${numeroRenta} ha sido recibida?\n\nEsta acción moverá la renta a "Terminadas" y la eliminará de la lista de vencidas.`);
  if (!confirmacion) return;

  try {
    // 1. Obtener datos completos de la renta
    const { data: renta, error: errorFetch } = await supabaseClient
      .from('rentas')
      .select('*')
      .eq('numero_renta', numeroRenta)
      .single();

    if (errorFetch || !renta) throw new Error('No se pudo obtener los datos de la renta');

    // 2. Calcular días de retraso (Zona Horaria Caracas)
    const hoyCaracas = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Caracas"}));
    const fechaHoyStr = hoyCaracas.toISOString().split('T')[0];
    const fechaDevolucion = new Date(renta.fecha_devolucion + 'T12:00:00');
    const diffTime = hoyCaracas - fechaDevolucion;
    const diasRetraso = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // 3. Insertar en rentas_terminadas
    const { data: rentaTerminada, error: errorTerminada } = await supabaseClient
      .from('rentas_terminadas')
      .insert({
        numero_renta: renta.numero_renta,
        serie: renta.serie || 'RENT',
        fecha_creacion: renta.fecha_creacion,
        fecha_renta: renta.fecha_renta,
        fecha_devolucion_programada: renta.fecha_devolucion,
        fecha_devolucion_real: fechaHoyStr,
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
        fecha_terminacion: new Date().toISOString(),
        recibido_por_email: usuarioActualVencidas?.email || 'unknown',
        recibido_por_id: usuarioActualVencidas?.id || null,
        dias_anticipados: 0,
        dias_retraso: diasRetraso,
        observaciones_terminacion: `Recibida con ${diasRetraso} día(s) de retraso.`
      })
      .select()
      .single();

    if (errorTerminada) throw new Error('Error al guardar en rentas_terminadas: ' + errorTerminada.message);

    // 4. Cargar y mover items a terminadas
    const { data: items, error: errorItems } = await supabaseClient
      .from('rentas_items')
      .select('*')
      .eq('renta_id', renta.id);

    if (errorItems) throw errorItems;

    if (items && items.length > 0) {
      for (const item of items) {
        await supabaseClient.from('rentas_items_terminadas').insert({
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
      }
    }

    // 5. ✅ ELIMINAR items de rentas_items
    const { error: errorDeleteItems } = await supabaseClient
      .from('rentas_items')
      .delete()
      .eq('renta_id', renta.id);

    if (errorDeleteItems) throw new Error('Error al eliminar items: ' + errorDeleteItems.message);

    // 6. ✅ ELIMINAR renta de rentas
    const { error: errorDeleteRenta } = await supabaseClient
      .from('rentas')
      .delete()
      .eq('id', renta.id);

    if (errorDeleteRenta) throw new Error('Error al eliminar renta: ' + errorDeleteRenta.message);

    // 7. Registrar en logs
    if (typeof registrarLog === 'function') {
      const descripcion = `Marcó como recibida la Renta #${numeroRenta} | Cliente: ${renta.cliente_nombre} | Retraso: ${diasRetraso} días | Recibido por: ${usuarioActualVencidas?.email || 'Desconocido'}`;
      await registrarLog('rentar', 'Renta recibida (terminada)', descripcion, 'success');
    }

    mostrarMensajeVencidas(`✅ Renta #${numeroRenta} movida a terminadas`, 'exito');

    setTimeout(() => {
      cargarRentasVencidas();
    }, 1000);

  } catch (err) {
    console.error('Error al marcar como recibida:', err);
    mostrarMensajeVencidas('Error al actualizar: ' + err.message, 'error');
  }
}

// ==========================================
// IMPRIMIR RENTA VENCIDA
// ==========================================
async function imprimirRentaVencida(numeroRenta) {
  try {
    const { data: renta, error } = await supabaseClient
      .from('rentas')
      .select('*')
      .eq('numero_renta', numeroRenta)
      .single();

    if (error || !renta) {
      mostrarMensajeVencidas('No se pudo cargar la renta', 'error');
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
    .vencida-aviso { background: #fee2e2; border-left: 4px solid #dc2626; padding: 8px 12px; border-radius: 6px; font-size: 11px; color: #991b1b; margin-bottom: 15px; text-align: center; font-weight: 600; }
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
      <div class="valor">${numeroRenta}</div>
    </div>
  </div>

  <div class="vencida-aviso">
    ⚠️ RENTA VENCIDA - Documento impreso el ${new Date().toLocaleString('es-ES')}
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
        <p><strong>${usuarioActualVencidas?.email || 'Administrador'}</strong></p>
        <p>Entregado por</p>
        <p style="font-size: 10px; color: #666;">Firma del responsable</p>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>©copyright Eventos de Primera | 2026-2027 | Documento generado el ${new Date().toLocaleString('es-ES')}</p>
  </div>

  <div class="no-print" style="margin-top: 30px; text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
    <button onclick="window.print()" style="padding: 12px 30px; background: #1e3a8a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-right: 10px;">🖨️ Imprimir Comprobante</button>
    <button onclick="window.close()" style="padding: 12px 30px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">❌ Cerrar</button>
  </div>
</body>
</html>`;

    ventana.document.write(html);
    ventana.document.close();

  } catch (err) {
    console.error('Error al imprimir:', err);
    mostrarMensajeVencidas('Error al generar comprobante: ' + err.message, 'error');
  }
}

// ==========================================
// MOSTRAR MENSAJE
// ==========================================
function mostrarMensajeVencidas(texto, tipo) {
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
  console.log('📄 Rentas Vencidas DOM cargado');
  inicializarRentasVencidas();
});
