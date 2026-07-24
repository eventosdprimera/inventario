// ==========================================
// VARIABLES GLOBALES
// ==========================================
let equipoSeleccionadoVenta = null;
let fotosEquipoVenta = [];
let usuarioActualVenta = null;
let paginaActualVentas = 1;
const POR_PAGINA_VENTAS = 20;

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarVentas() {
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }
  if (typeof supabaseClient === 'undefined') {
    mostrarMensajeVenta('Error: Supabase no está disponible', 'error');
    return;
  }
  
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    const { data } = await supabaseClient.from('usuarios').select('*').eq('email', session.user.email).maybeSingle();
    usuarioActualVenta = data || { email: session.user.email, id: session.user.id };
  }
  
  await cargarHistorialVentas();
  
  const inputBusqueda = document.getElementById('buscarEquipoVenta');
  if (inputBusqueda) {
    inputBusqueda.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); buscarEquipoParaVenta(); }
    });
  }
}

// ==========================================
// BUSCAR EQUIPO
// ==========================================
async function buscarEquipoParaVenta() {
  const input = document.getElementById('buscarEquipoVenta');
  let codigo = input.value.trim().replace(/'/g, '-').replace(/"/g, '-').trim();
  
  if (!codigo) {
    mostrarMensajeVenta('Ingrese un código de barras o serial', 'error');
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('equipos')
      .select('*')
      .or(`codigo_barras.eq.${codigo},serial.eq.${codigo}`)
      .maybeSingle();

    if (error || !data) {
      mostrarMensajeVenta('Equipo no encontrado en el inventario', 'error');
      input.value = '';
      input.focus();
      return;
    }

    equipoSeleccionadoVenta = data;
    fotosEquipoVenta = [data.foto_url, data.foto2_url, data.foto3_url, data.foto4_url].filter(url => url && url.trim() !== '');

    // Llenar ficha
    document.getElementById('ventaCodigo').textContent = data.codigo_barras;
    document.getElementById('ventaNombre').textContent = data.nombre_equipo;
    document.getElementById('ventaMarcaModelo').textContent = `${data.marca || ''} ${data.modelo || ''}`.trim() || '-';
    document.getElementById('ventaSerial').textContent = data.serial || '-';
    document.getElementById('ventaCosto').textContent = data.costo ? `$${parseFloat(data.costo).toFixed(2)}` : '$0.00';
    document.getElementById('precioVenta').value = data.costo || '';

    // Mostrar fotos
    const contenedorFotos = document.getElementById('fotosEquipoVenta');
    contenedorFotos.innerHTML = '';
    if (fotosEquipoVenta.length === 0) {
      contenedorFotos.innerHTML = `<div class="foto-preview-placeholder"><div class="foto-preview-placeholder-icon">📷</div><div>Sin fotos</div></div>`;
    } else {
      fotosEquipoVenta.forEach((url, i) => {
        const div = document.createElement('div');
        div.className = 'foto-preview';
        div.innerHTML = `<img src="${url}" alt="Foto ${i+1}" onclick="abrirZoomInfalibleVenta('${url}')">`;
        contenedorFotos.appendChild(div);
      });
    }

    document.getElementById('fieldsetEquipoVenta').style.display = 'block';
    document.getElementById('fieldsetComprador').style.display = 'block';
    document.getElementById('botonesVenta').style.display = 'flex';
    document.getElementById('compradorNombre').focus();

  } catch (err) {
    mostrarMensajeVenta('Error al buscar: ' + err.message, 'error');
  }
}

// ==========================================
// PROCESAR VENTA
// ==========================================
async function procesarVenta() {
  if (!equipoSeleccionadoVenta) return;

  const nombre = document.getElementById('compradorNombre').value.trim();
  const apellido = document.getElementById('compradorApellido').value.trim();
  const cedula = document.getElementById('compradorCedula').value.trim();
  const telefono = document.getElementById('compradorTelefono').value.trim();
  const email = document.getElementById('compradorEmail').value.trim();
  const direccion = document.getElementById('compradorDireccion').value.trim();
  const precioVenta = document.getElementById('precioVenta').value;

  // Validaciones estrictas
  if (!nombre || !apellido || !cedula || !telefono || !precioVenta) {
    mostrarMensajeVenta('Complete todos los campos obligatorios (*)', 'error');
    return;
  }
  if (!/^\d{7,8}$/.test(cedula)) {
    mostrarMensajeVenta('La cédula debe tener exactamente 7 u 8 dígitos numéricos', 'error');
    return;
  }
  if (!/^\d{11}$/.test(telefono)) {
    mostrarMensajeVenta('El teléfono debe tener exactamente 11 dígitos numéricos', 'error');
    return;
  }

  const btnVender = document.getElementById('btnVender');
  btnVender.disabled = true;
  btnVender.textContent = '⏳ Procesando...';

  try {
    // 1. Generar número de venta único
    const numeroVenta = await generarNumeroVentaUnico();

    // 2. Insertar en tabla ventas
    const ventaData = {
      numero_venta: numeroVenta,
      codigo_barras: equipoSeleccionadoVenta.codigo_barras,
      nombre_equipo: equipoSeleccionadoVenta.nombre_equipo,
      marca: equipoSeleccionadoVenta.marca,
      modelo: equipoSeleccionadoVenta.modelo,
      serial: equipoSeleccionadoVenta.serial,
      costo_original: equipoSeleccionadoVenta.costo || 0,
      precio_venta: parseFloat(precioVenta),
      comprador_nombre: nombre,
      comprador_apellido: apellido,
      comprador_cedula: cedula,
      comprador_direccion: direccion,
      comprador_telefono: telefono,
      comprador_email: email,
      fotos_equipo: fotosEquipoVenta,
      usuario_venta: usuarioActualVenta?.email || 'Desconocido'
    };

    const { error: errorInsert } = await supabaseClient.from('ventas').insert(ventaData);
    if (errorInsert) throw errorInsert;

    // 3. ELIMINAR del inventario (equipos)
    const { error: errorDelete } = await supabaseClient
      .from('equipos')
      .delete()
      .eq('codigo_barras', equipoSeleccionadoVenta.codigo_barras);
    
    if (errorDelete) {
      console.warn('No se pudo eliminar del inventario, pero la venta se registró.');
    }

    // 4. Registrar Log
    if (typeof registrarLog === 'function') {
      await registrarLog('ventas', 'Equipo Vendido', 
        `Venta ${numeroVenta} | Equipo: ${equipoSeleccionadoVenta.nombre_equipo} (${equipoSeleccionadoVenta.codigo_barras}) | Comprador: ${nombre} ${apellido} (C.I: ${cedula}) | Precio: $${parseFloat(precioVenta).toFixed(2)} | Vendedor: ${usuarioActualVenta?.email}`, 'success');
    }

    mostrarMensajeVenta(`✅ Venta ${numeroVenta} registrada exitosamente`, 'exito');
    
    // 5. Generar Nota de Entrega
    setTimeout(() => {
      generarNotaDeEntrega(ventaData, numeroVenta);
      limpiarFormularioVenta();
      cargarHistorialVentas();
    }, 1000);

  } catch (err) {
    console.error('Error al procesar venta:', err);
    mostrarMensajeVenta('Error al vender: ' + err.message, 'error');
  } finally {
    btnVender.disabled = false;
    btnVender.textContent = '✅ Confirmar Venta y Generar Nota';
  }
}

// ==========================================
// GENERAR NÚMERO DE VENTA ÚNICO
// ==========================================
async function generarNumeroVentaUnico() {
  const { data, error } = await supabaseClient
    .from('ventas')
    .select('numero_venta')
    .order('numero_venta', { ascending: false })
    .limit(1);
  
  let nuevoNumero = 1;
  if (data && data.length > 0 && data[0].numero_venta) {
    const partes = data[0].numero_venta.split('-');
    nuevoNumero = parseInt(partes[1]) + 1;
  }
  return `VENTA-${String(nuevoNumero).padStart(6, '0')}`;
}

// ==========================================
// GENERAR NOTA DE ENTREGA (IMPRESIÓN)
// ==========================================
function generarNotaDeEntrega(venta, numeroVenta) {
  const logoUrl = new URL('../img/logo.png', window.location.href).href; // Ajusta la ruta de tu logo
  const fecha = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const fotosHTML = venta.fotos_equipo.map((url, i) => 
    `<img src="${url}" style="width: 100px; height: 100px; object-fit: cover; border: 1px solid #ccc; border-radius: 4px; margin: 5px;">`
  ).join('');

  const ventana = window.open('', '_blank', 'width=800,height=900');
  ventana.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Nota de Entrega - ${numeroVenta}</title>
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
        <div style="margin-top: 10px; font-size: 18px; font-weight: bold; color: #dc2626;">N° ${numeroVenta}</div>
        <div style="font-size: 12px; color: #666;">Fecha: ${fecha}</div>
      </div>

      <div class="seccion">
        <h3>👤 Datos del Comprador</h3>
        <div class="grid">
          <div class="dato"><strong>Nombre:</strong> ${venta.comprador_nombre} ${venta.comprador_apellido}</div>
          <div class="dato"><strong>Cédula:</strong> ${venta.comprador_cedula}</div>
          <div class="dato"><strong>Teléfono:</strong> ${venta.comprador_telefono}</div>
          <div class="dato"><strong>Correo:</strong> ${venta.comprador_email || 'N/A'}</div>
          <div class="dato" style="grid-column: 1 / -1;"><strong>Dirección:</strong> ${venta.comprador_direccion || 'N/A'}</div>
        </div>
      </div>

      <div class="seccion">
        <h3>📦 Equipo Vendido</h3>
        <div class="grid">
          <div class="dato"><strong>Equipo:</strong> ${venta.nombre_equipo}</div>
          <div class="dato"><strong>Marca/Modelo:</strong> ${venta.marca || ''} ${venta.modelo || ''}</div>
          <div class="dato"><strong>Código:</strong> ${venta.codigo_barras}</div>
          <div class="dato"><strong>Serial:</strong> ${venta.serial || 'N/A'}</div>
        </div>
        ${fotosHTML ? `<div style="margin-top: 15px;"><strong>Fotos del equipo:</strong><br>${fotosHTML}</div>` : ''}
      </div>

      <div class="total">TOTAL PAGADO: $${parseFloat(venta.precio_venta).toFixed(2)}</div>

      <div class="firmas">
        <div class="firma">Firma del Comprador<br>C.I: ${venta.comprador_cedula}</div>
        <div class="firma">Firma de Eventos D' Primera<br>${venta.usuario_venta}</div>
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
// HISTORIAL Y PAGINACIÓN
// ==========================================
async function cargarHistorialVentas() {
  const tbody = document.getElementById('tbodyVentas');
  try {
    const desde = (paginaActualVentas - 1) * POR_PAGINA_VENTAS;
    const hasta = desde + POR_PAGINA_VENTAS - 1;
    
    const { data, count, error } = await supabaseClient
      .from('ventas')
      .select('*', { count: 'exact' })
      .order('fecha_venta', { ascending: false })
      .range(desde, hasta);

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px;">No hay ventas registradas</td></tr>`;
      document.getElementById('paginacionVentas').innerHTML = '';
      return;
    }

    tbody.innerHTML = data.map(v => {
      const fecha = new Date(v.fecha_venta).toLocaleDateString('es-ES');
      return `
        <tr>
          <td><strong>${v.numero_venta}</strong></td>
          <td>${fecha}</td>
          <td>${v.nombre_equipo}</td>
          <td>${v.serial || '-'}</td>
          <td>${v.comprador_nombre} ${v.comprador_apellido}</td>
          <td>${v.comprador_cedula}</td>
          <td style="color: #047857; font-weight: 600;">$${parseFloat(v.precio_venta).toFixed(2)}</td>
          <td><button class="btn-action btn-primary" style="padding: 4px 8px; font-size: 11px;" onclick='verFichaVenta(${JSON.stringify(v).replace(/'/g, "&#39;")})'>📄 Ver Ficha</button></td>
        </tr>
      `;
    }).join('');

    renderizarPaginacionVentas(count);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Error al cargar</td></tr>`;
  }
}

function renderizarPaginacionVentas(total) {
  const cont = document.getElementById('paginacionVentas');
  const totalPaginas = Math.ceil(total / POR_PAGINA_VENTAS);
  if (totalPaginas <= 1) { cont.innerHTML = ''; return; }
  
  let html = `<button onclick="cambiarPaginaVentas(${paginaActualVentas - 1})" ${paginaActualVentas === 1 ? 'disabled' : ''}>‹ Anterior</button>`;
  html += `<span>Página ${paginaActualVentas} de ${totalPaginas}</span>`;
  html += `<button onclick="cambiarPaginaVentas(${paginaActualVentas + 1})" ${paginaActualVentas === totalPaginas ? 'disabled' : ''}>Siguiente ›</button>`;
  cont.innerHTML = html;
}

async function cambiarPaginaVentas(nueva) {
  const total = (await supabaseClient.from('ventas').select('*', { count: 'exact', head: true })).count || 0;
  const totalPaginas = Math.ceil(total / POR_PAGINA_VENTAS);
  if (nueva < 1 || nueva > totalPaginas) return;
  paginaActualVentas = nueva;
  await cargarHistorialVentas();
}

function verFichaVenta(venta) {
  generarNotaDeEntrega(venta, venta.numero_venta);
}

// ==========================================
// UTILIDADES
// ==========================================
function limpiarFormularioVenta() {
  equipoSeleccionadoVenta = null;
  fotosEquipoVenta = [];
  document.getElementById('buscarEquipoVenta').value = '';
  ['compradorNombre', 'compradorApellido', 'compradorCedula', 'compradorTelefono', 'compradorEmail', 'compradorDireccion', 'precioVenta'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('fieldsetEquipoVenta').style.display = 'none';
  document.getElementById('fieldsetComprador').style.display = 'none';
  document.getElementById('botonesVenta').style.display = 'none';
  document.getElementById('buscarEquipoVenta').focus();
}

function mostrarMensajeVenta(texto, tipo) {
  const msg = document.getElementById('mensaje');
  if (msg) {
    msg.textContent = texto;
    msg.className = `mensaje ${tipo}`;
    
    // ✅ Hace que la página suba automáticamente para mostrar el mensaje
    msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    setTimeout(() => { msg.className = 'mensaje'; }, 4000);
  }
}
function abrirZoomInfalibleVenta(url) {
  const modal = document.createElement('div');
  modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.9); z-index: 999999; display: flex; align-items: center; justify-content: center; cursor: zoom-out;`;
  modal.innerHTML = `<img src="${url}" style="max-width: 90%; max-height: 90vh; border-radius: 8px;">`;
  modal.onclick = () => modal.remove();
  document.body.appendChild(modal);
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', inicializarVentas);
