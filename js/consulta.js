// ==========================================
// VARIABLES GLOBALES
// ==========================================
let equipoSeleccionadoConsulta = null;
let paginaActualConsulta = 1;
const POR_PAGINA_CONSULTA = 20;
let totalEquiposConsulta = 0;
let usuarioActualConsulta = null;
let equiposCache = [];

// ==========================================
// SISTEMA TOAST
// ==========================================
function mostrarToastConsulta(texto, tipo) {
  let toastContainer = document.getElementById('toastContainerConsulta');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainerConsulta';
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

if (!document.getElementById('toastStylesConsulta')) {
  const style = document.createElement('style');
  style.id = 'toastStylesConsulta';
  style.textContent = `@keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes toastSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }`;
  document.head.appendChild(style);
}

// ==========================================
// ZOOM INFALIBLE
// ==========================================
function abrirZoomInfalibleConsulta(url) {
  const modal = document.createElement('div');
  modal.id = 'modalZoomDinamicoConsulta';
  modal.style.cssText = `position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background-color: rgba(0, 0, 0, 0.95) !important; z-index: 999999 !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: zoom-out;`;
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = `position: absolute !important; top: 20px !important; right: 30px !important; color: #fff !important; font-size: 40px !important; font-weight: bold !important; cursor: pointer !important; background: none !important; border: none !important; z-index: 1000000 !important;`;
  closeBtn.onclick = function(e) { e.stopPropagation(); cerrarZoomInfalibleConsulta(); };
  
  const img = document.createElement('img');
  img.src = url;
  img.style.cssText = `max-width: 90% !important; max-height: 90vh !important; border-radius: 8px; box-shadow: 0 0 30px rgba(0,0,0,0.8);`;
  
  modal.appendChild(closeBtn);
  modal.appendChild(img);
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  modal.addEventListener('click', function(e) { if (e.target === modal) cerrarZoomInfalibleConsulta(); });
}

function cerrarZoomInfalibleConsulta() {
  const modal = document.getElementById('modalZoomDinamicoConsulta');
  if (modal) { modal.remove(); document.body.style.overflow = ''; }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarConsulta() {
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }

  if (typeof supabaseClient === 'undefined') {
    mostrarToastConsulta('Error: Supabase no está disponible', 'error');
    return;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    const { data } = await supabaseClient.from('usuarios').select('*').eq('email', session.user.email).maybeSingle();
    usuarioActualConsulta = data || { email: session.user.email, id: session.user.id };
  }

  const inputBusqueda = document.getElementById('buscarConsulta');
  if (inputBusqueda) {
    inputBusqueda.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); buscarEquipoConsulta(); }
    });
  }

  await cargarListaEquipos();
}

// ==========================================
// DETERMINAR ESTATUS REAL DEL EQUIPO
// ==========================================
async function determinarEstatus(codigoBarras) {
  let estatus = 'operativo';
  let infoAdicional = null;

  // 1. Verificar si está en rentas activas
  const { data: rentaActiva } = await supabaseClient
    .from('rentas')
    .select('*, clientes(nombre, apellido)')
    .eq('codigo_barras_equipo', codigoBarras)
    .eq('estado', 'activa')
    .maybeSingle();

  if (rentaActiva) {
    estatus = 'rentado';
    const cliente = `${rentaActiva.clientes?.nombre || ''} ${rentaActiva.clientes?.apellido || ''}`.trim();
    infoAdicional = {
      tipo: 'renta',
      titulo: '📋 Información de Renta Activa',
      datos: [
        { label: 'Cliente', valor: cliente || 'N/A' },
        { label: 'Fecha Inicio', valor: rentaActiva.fecha_inicio ? new Date(rentaActiva.fecha_inicio).toLocaleDateString('es-ES') : '-' },
        { label: 'Fecha Devolución', valor: rentaActiva.fecha_devolucion ? new Date(rentaActiva.fecha_devolucion).toLocaleDateString('es-ES') : '-' },
        { label: 'Costo Renta', valor: rentaActiva.costo ? `$${parseFloat(rentaActiva.costo).toFixed(2)}` : '$0.00' }
      ]
    };
    return { estatus, infoAdicional };
  }

  // 2. Verificar si está en averías activas
  const { data: averiaActiva } = await supabaseClient
    .from('equipos_averiados')
    .select('*')
    .eq('codigo_barras', codigoBarras)
    .neq('estado_reparacion', 'reintegrado')
    .maybeSingle();

  if (averiaActiva) {
    estatus = 'averiado';
    infoAdicional = {
      tipo: 'averia',
      titulo: '🔧 Información de Avería',
      datos: [
        { label: 'Reportante', valor: `${averiaActiva.reportante_nombre || ''} ${averiaActiva.reportante_apellidos || ''}`.trim() || 'N/A' },
        { label: 'Fecha Avería', valor: averiaActiva.fecha_averia ? new Date(averiaActiva.fecha_averia + 'T12:00:00').toLocaleDateString('es-ES') : '-' },
        { label: 'Detalles', valor: averiaActiva.detalles_averia || 'Sin detalles' },
        { label: 'Estado Reparación', valor: averiaActiva.estado_reparacion || 'pendiente' }
      ]
    };
    return { estatus, infoAdicional };
  }

  // 3. Verificar estatus en tabla equipos
  const { data: equipo } = await supabaseClient
    .from('equipos')
    .select('estatus')
    .eq('codigo_barras', codigoBarras)
    .maybeSingle();

  if (equipo) {
    estatus = equipo.estatus || 'operativo';
  }

  return { estatus, infoAdicional };
}

// ==========================================
// BUSCAR EQUIPO
// ==========================================
async function buscarEquipoConsulta() {
  const input = document.getElementById('buscarConsulta');
  if (!input) return;

  let codigo = input.value.trim();
  if (!codigo) {
    mostrarToastConsulta('Por favor ingrese un código de barras o serial', 'error');
    return;
  }

  codigo = codigo.replace(/'/g, '-').replace(/"/g, '-').replace(/`/g, '-').trim();

  try {
    // Buscar en tabla equipos
    const { data: equipo, error } = await supabaseClient
      .from('equipos')
      .select('*')
      .or(`codigo_barras.eq.${codigo},serial.eq.${codigo}`)
      .maybeSingle();

    if (error || !equipo) {
      mostrarToastConsulta('Equipo no encontrado', 'error');
      input.value = '';
      input.focus();
      return;
    }

    equipoSeleccionadoConsulta = equipo;

    // Determinar estatus real
    const { estatus, infoAdicional } = await determinarEstatus(equipo.codigo_barras);

    // Mostrar ficha
    document.getElementById('consultaCodigo').textContent = equipo.codigo_barras || '-';
    document.getElementById('consultaNombre').textContent = equipo.nombre_equipo || '-';
    document.getElementById('consultaMarca').textContent = equipo.marca || '-';
    document.getElementById('consultaModelo').textContent = equipo.modelo || '-';
    document.getElementById('consultaSerial').textContent = equipo.serial || '-';
    document.getElementById('consultaCosto').textContent = equipo.costo ? `$${parseFloat(equipo.costo).toFixed(2)}` : '$0.00';
    document.getElementById('consultaMedida').textContent = equipo.medida_valor ? `${equipo.medida_valor} ${equipo.medida_unidad || ''}` : '-';
    
    const estatusBadge = `<span class="badge badge-${estatus}">${estatus.toUpperCase()}</span>`;
    document.getElementById('consultaEstatus').innerHTML = estatusBadge;

    // Mostrar información adicional si existe
    const infoDiv = document.getElementById('infoAdicional');
    if (infoAdicional) {
      infoDiv.innerHTML = `
        <h4 style="color: #1e40af; margin: 0 0 15px 0; font-size: 14px;">${infoAdicional.titulo}</h4>
        <div class="ficha-grid">
          ${infoAdicional.datos.map(d => `
            <div class="ficha-item">
              <label>${d.label}</label>
              <strong style="color: #374151; font-size: 14px;">${d.valor}</strong>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      infoDiv.innerHTML = '';
    }

    // Cargar fotos
    await cargarFotosConsulta(equipo);

    document.getElementById('fieldsetFichaConsulta').style.display = 'block';
    document.getElementById('fieldsetFichaConsulta').scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Registrar en logs
    if (typeof registrarLog === 'function') {
      await registrarLog('consulta', 'Equipo consultado', `Código: ${equipo.codigo_barras} (${equipo.nombre_equipo}) | Estatus: ${estatus} | Consultado por: ${usuarioActualConsulta?.email || 'Desconocido'}`, 'info');
    }

  } catch (err) {
    console.error('Error al buscar:', err);
    mostrarToastConsulta('Error al buscar: ' + err.message, 'error');
  }
}

// ==========================================
// CARGAR FOTOS
// ==========================================
async function cargarFotosConsulta(equipo) {
  const contenedor = document.getElementById('consultaFotos');
  contenedor.innerHTML = '';

  let fotos = [];
  
  // Fotos individuales
  if (equipo.foto_url) fotos.push(equipo.foto_url);
  if (equipo.foto2_url) fotos.push(equipo.foto2_url);
  if (equipo.foto3_url) fotos.push(equipo.foto3_url);
  if (equipo.foto4_url) fotos.push(equipo.foto4_url);

  if (fotos.length === 0) {
    contenedor.innerHTML = `<div class="foto-preview-placeholder"><div class="foto-preview-placeholder-icon">📷</div><div>Sin fotos registradas</div></div>`;
    return;
  }

  fotos.forEach((fotoUrl, index) => {
    const div = document.createElement('div');
    div.className = 'foto-preview';
    
    const img = document.createElement('img');
    img.src = fotoUrl;
    img.alt = `Foto ${index + 1}`;
    img.style.cursor = 'pointer';
    img.onclick = function() { abrirZoomInfalibleConsulta(fotoUrl); };
    img.onerror = function() { this.parentElement.innerHTML = '<div style="color: #ef4444; font-size: 11px; text-align: center; padding: 10px;">❌ Error</div>'; };
    
    div.appendChild(img);
    contenedor.appendChild(div);
  });
}

// ==========================================
// CARGAR LISTA DE EQUIPOS
// ==========================================
async function cargarListaEquipos() {
  const tbody = document.getElementById('tbodyEquipos');
  if (!tbody) return;

  try {
    const desde = (paginaActualConsulta - 1) * POR_PAGINA_CONSULTA;
    const hasta = desde + POR_PAGINA_CONSULTA - 1;

    // Cargar equipos con su estatus
    const { data: equipos, count, error } = await supabaseClient
      .from('equipos')
      .select('*', { count: 'exact' })
      .order('fecha_registro', { ascending: false })
      .range(desde, hasta);

    if (error) throw error;

    totalEquiposConsulta = count || 0;

    // Enriquecer con estatus real
    const equiposEnriquecidos = [];
    for (const equipo of equipos) {
      const { estatus } = await determinarEstatus(equipo.codigo_barras);
      equiposEnriquecidos.push({ ...equipo, estatus_real: estatus });
    }

    if (equiposEnriquecidos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;"><div style="font-size: 40px; margin-bottom: 10px;">📭</div><div>No hay equipos registrados</div></td></tr>`;
      document.getElementById('paginacionConsulta').innerHTML = '';
      return;
    }

    tbody.innerHTML = equiposEnriquecidos.map((equipo, index) => {
      const globalIndex = desde + index + 1;
      const fechaFormateada = equipo.fecha_registro ? new Date(equipo.fecha_registro).toLocaleDateString('es-ES') : '-';
      const marcaModelo = `${equipo.marca || ''} ${equipo.modelo || ''}`.trim() || '-';

      return `
        <tr onclick="seleccionarEquipoLista('${equipo.codigo_barras}')" id="fila-equipo-${equipo.id}">
          <td>${globalIndex}</td>
          <td style="font-family: monospace; font-weight: 600; color: #1e3a8a;">${equipo.codigo_barras}</td>
          <td><strong>${equipo.nombre_equipo}</strong></td>
          <td>${marcaModelo}</td>
          <td>${equipo.serial || '-'}</td>
          <td>${equipo.costo ? `$${parseFloat(equipo.costo).toFixed(2)}` : '$0.00'}</td>
          <td>${fechaFormateada}</td>
          <td><span class="badge badge-${equipo.estatus_real}">${equipo.estatus_real.toUpperCase()}</span></td>
        </tr>
      `;
    }).join('');

    renderizarPaginacionConsulta();

  } catch (err) {
    console.error('Error al cargar equipos:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: #ef4444;">Error al cargar: ${err.message}</td></tr>`;
  }
}

// ==========================================
// SELECCIONAR EQUIPO DE LA LISTA
// ==========================================
async function seleccionarEquipoLista(codigoBarras) {
  document.getElementById('buscarConsulta').value = codigoBarras;
  await buscarEquipoConsulta();
}

// ==========================================
// PAGINACIÓN
// ==========================================
function renderizarPaginacionConsulta() {
  const cont = document.getElementById('paginacionConsulta');
  if (!cont) return;

  const totalPaginas = Math.ceil(totalEquiposConsulta / POR_PAGINA_CONSULTA);
  
  if (totalPaginas <= 1) {
    cont.innerHTML = `<span style="color: #6b7280; font-size: 13px;">Total: ${totalEquiposConsulta} equipo(s)</span>`;
    return;
  }

  let html = '';
  html += `<button type="button" onclick="cambiarPaginaConsulta(${paginaActualConsulta - 1})" style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px;" ${paginaActualConsulta === 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>‹ Anterior</button>`;
  html += `<span style="color: #374151; font-size: 13px; font-weight: 600;">Página ${paginaActualConsulta} de ${totalPaginas}</span>`;
  html += `<button type="button" onclick="cambiarPaginaConsulta(${paginaActualConsulta + 1})" style="padding: 6px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 13px;" ${paginaActualConsulta === totalPaginas ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>Siguiente ›</button>`;
  html += `<span style="color: #6b7280; font-size: 13px;">Total: ${totalEquiposConsulta}</span>`;

  cont.innerHTML = html;
}

async function cambiarPaginaConsulta(nuevaPagina) {
  const totalPaginas = Math.ceil(totalEquiposConsulta / POR_PAGINA_CONSULTA);
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
  
  paginaActualConsulta = nuevaPagina;
  await cargarListaEquipos();
}

// ==========================================
// FILTROS
// ==========================================
async function aplicarFiltros() {
  const estatus = document.getElementById('filtroEstatus').value;
  const fechaInicio = document.getElementById('filtroFechaInicio').value;
  const fechaFin = document.getElementById('filtroFechaFin').value;

  // Recargar lista con filtros (implementación básica)
  mostrarToastConsulta('Filtros aplicados', 'exito');
  paginaActualConsulta = 1;
  await cargarListaEquipos();
}

function limpiarFiltros() {
  document.getElementById('filtroEstatus').value = '';
  document.getElementById('filtroFechaInicio').value = '';
  document.getElementById('filtroFechaFin').value = '';
  paginaActualConsulta = 1;
  cargarListaEquipos();
}

// ==========================================
// IMPRIMIR FICHA
// ==========================================
function imprimirFichaConsulta() {
  if (!equipoSeleccionadoConsulta) {
    mostrarToastConsulta('No hay equipo seleccionado', 'error');
    return;
  }

  const equipo = equipoSeleccionadoConsulta;
  const estatus = document.getElementById('consultaEstatus').textContent;
  
  // Recopilar fotos
  let fotos = [];
  if (equipo.foto_url) fotos.push(equipo.foto_url);
  if (equipo.foto2_url) fotos.push(equipo.foto2_url);
  if (equipo.foto3_url) fotos.push(equipo.foto3_url);
  if (equipo.foto4_url) fotos.push(equipo.foto4_url);

  const fotosHTML = fotos.map((fotoUrl, i) => `
    <div style="display: inline-block; width: 48%; margin: 1%; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <img src="${fotoUrl}" style="width: 100%; height: 200px; object-fit: cover;">
      <div style="padding: 8px; text-align: center; font-size: 11px; color: #6b7280;">Foto ${i + 1}</div>
    </div>
  `).join('');

  const infoAdicionalHTML = document.getElementById('infoAdicional').innerHTML;

  const ventana = window.open('', '_blank', 'width=900,height=1100');
  ventana.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Ficha del Equipo - ${equipo.codigo_barras}</title>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:wght@400;700&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: letter; margin: 15mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #333; max-width: 216mm; margin: 0 auto; padding: 10mm; }
    .header { text-align: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; }
    .logo-img { max-width: 120px; max-height: 120px; }
    .brand h1 { color: #1e3a8a; margin: 10px 0 5px 0; font-size: 28px; font-family: 'Libre Caslon Text', serif; font-weight: 700; }
    .brand p { margin: 3px 0 0 0; color: #666; font-size: 12px; }
    .ficha-titulo { background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 20px; }
    .ficha-titulo h2 { color: #1e40af; margin: 0; font-size: 20px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .info-box { background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; }
    .info-box h3 { margin: 0 0 10px 0; color: #1e3a8a; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
    .info-box p { margin: 5px 0; font-size: 12px; }
    .info-box p strong { color: #374151; }
    .estatus-badge { display: inline-block; padding: 6px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .estatus-operativo { background: #d1fae5; color: #065f46; }
    .estatus-inoperativo { background: #fee2e2; color: #991b1b; }
    .estatus-rentado { background: #dbeafe; color: #1e40af; }
    .estatus-averiado { background: #fef3c7; color: #92400e; }
    .fotos-section { margin-top: 20px; }
    .fotos-section h3 { color: #1e3a8a; font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    @media print { .no-print { display: none !important; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <img src="${new URL('img/logo.png', window.location.href).href}" class="logo-img" onerror="this.style.display='none'">
    <div class="brand">
      <h1>Eventos D' Primera</h1>
      <p>Sistema de Inventario y Rentas</p>
    </div>
  </div>

  <div class="ficha-titulo">
    <h2>📋 FICHA DEL EQUIPO</h2>
    <p style="margin: 10px 0 0 0; font-size: 14px;">Código: <strong>${equipo.codigo_barras}</strong></p>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>📦 Información del Equipo</h3>
      <p><strong>Nombre:</strong> ${equipo.nombre_equipo}</p>
      <p><strong>Marca:</strong> ${equipo.marca || 'N/A'}</p>
      <p><strong>Modelo:</strong> ${equipo.modelo || 'N/A'}</p>
      <p><strong>Serial:</strong> ${equipo.serial || 'N/A'}</p>
      <p><strong>Costo:</strong> ${equipo.costo ? `$${parseFloat(equipo.costo).toFixed(2)}` : '$0.00'}</p>
      <p><strong>Medida:</strong> ${equipo.medida_valor ? `${equipo.medida_valor} ${equipo.medida_unidad || ''}` : 'N/A'}</p>
    </div>
    <div class="info-box">
      <h3> Estatus Actual</h3>
      <p><span class="estatus-badge estatus-${estatus.toLowerCase()}">${estatus}</span></p>
      <p><strong>Fecha Registro:</strong> ${equipo.fecha_registro ? new Date(equipo.fecha_registro).toLocaleDateString('es-ES') : 'N/A'}</p>
      <p><strong>Registrado por:</strong> ${equipo.usuario_registro || 'N/A'}</p>
    </div>
  </div>

  ${infoAdicionalHTML ? `<div class="info-box" style="margin-bottom: 20px;">${infoAdicionalHTML}</div>` : ''}

  ${fotosHTML ? `
  <div class="fotos-section">
    <h3>📸 Fotos del Equipo</h3>
    <div style="display: flex; flex-wrap: wrap;">
      ${fotosHTML}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p>©copyright Eventos de Primera | 2026-2027 | Ficha generada el ${new Date().toLocaleString('es-ES')}</p>
  </div>

  <div class="no-print" style="margin-top: 30px; text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
    <button onclick="window.print()" style="padding: 12px 30px; background: #1e3a8a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-right: 10px;">️ Imprimir Ficha</button>
    <button onclick="window.close()" style="padding: 12px 30px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">❌ Cerrar</button>
  </div>
</body>
</html>`);
  ventana.document.close();
}

// ==========================================
// LIMPIAR CONSULTA
// ==========================================
function limpiarConsulta() {
  equipoSeleccionadoConsulta = null;
  document.getElementById('buscarConsulta').value = '';
  document.getElementById('fieldsetFichaConsulta').style.display = 'none';
  document.getElementById('buscarConsulta').focus();
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  inicializarConsulta();
});
