// js/dashboard.js
// NO declarar supabaseClient aquí - ya viene de config.js
let heartbeatInterval = null;
let currentUserRol = 'consultor';
let currentUserData = null;
let currentUserEmail = null;
let relojInterval = null;

// ============================================
// CONFIGURACIÓN DE PERMISOS POR ROL
// ============================================
const PERMISOS_POR_ROL = {
  administrador: [
    'consulta-ver',
    'inventario-registrar', 'inventario-modificar', 'inventario-eliminar',
    'rentar-crear', 'rentar-modificar', 'rentar-eliminar', 'rentar-vencidas', 'rentar-historial',
    'averias-registrar', 'averias-modificar', 'averias-reintegrar',
    'ventas-crear', 'ventas-modificar', 'ventas-eliminar',
    'reportes-ver',
    'usuarios-crear', 'usuarios-modificar', 'usuarios-eliminar',
    'logs-ver'
  ],
  moderador: [
    'consulta-ver',
    'inventario-registrar',
    'rentar-crear', 'rentar-vencidas',
    'averias-registrar'
  ],
  consultor: [
    'consulta-ver'
  ]
};

// ============================================
// INICIO DEL DASHBOARD
// ============================================
async function iniciarDashboard() {
  console.log('🚀 Iniciando dashboard...');
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }
  currentUserEmail = session.user.email;
  await cargarDatosUsuario(session.user.email);
  iniciarHeartbeat(session.user.email);
  configurarMenu();
  aplicarPermisosPorRol();
  iniciarReloj();
  mostrarBienvenida();
  // ✅ Cargar contador de rentas vencidas
  await cargarContadorRentasVencidas();
  
  // Actualizar cada 2 minutos
  setInterval(cargarContadorRentasVencidas, 120000);
  
  console.log('✅ Dashboard iniciado correctamente');
}

function mostrarBienvenida() {
  const w = document.querySelector('.welcome-card');
  if (w) w.style.display = 'block';
}

function ocultarBienvenida() {
  const w = document.querySelector('.welcome-card');
  if (w) w.style.display = 'none';
}

// ============================================
// CARGAR DATOS DEL USUARIO
// ============================================
async function cargarDatosUsuario(email) {
  try {
    const { data, error } = await supabaseClient
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    document.getElementById('usuarioCorreo').textContent = email;

    if (data && !error) {
      currentUserData = data;
      currentUserRol = data.rol || 'consultor';
      const nombreCompleto = data.nombre || email.split('@')[0];
      document.getElementById('perfilNombre').textContent = nombreCompleto.toUpperCase();

      if (data.foto_url) {
        const { data: urlData } = supabaseClient.storage
          .from('avatars')
          .getPublicUrl(data.foto_url);
        document.getElementById('perfilFoto').innerHTML =
          `<img src="${urlData.publicUrl}" alt="Foto de perfil">`;
      } else {
        document.getElementById('perfilFoto').textContent = generarIniciales(nombreCompleto);
      }
    } else {
      currentUserRol = 'consultor';
      const nombre = email.split('@')[0];
      document.getElementById('perfilNombre').textContent = nombre.toUpperCase();
      document.getElementById('perfilFoto').textContent = generarIniciales(nombre);
    }

    const rolElement = document.getElementById('perfilRol');
    rolElement.textContent = currentUserRol.toUpperCase();
    rolElement.className = `perfil-rol rol-${currentUserRol}`;
  } catch (err) {
    console.error('Error al cargar datos del usuario:', err);
  }
}

function generarIniciales(nombre) {
  const palabras = nombre.trim().split(/\s+/);
  if (palabras.length === 1) return palabras[0].substring(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
}

// ============================================
// APLICAR PERMISOS POR ROL
// ============================================
function aplicarPermisosPorRol() {
  const permitidos = PERMISOS_POR_ROL[currentUserRol] || [];

  document.querySelectorAll('.submenu-btn').forEach(btn => {
    const action = btn.dataset.action;
    btn.style.display = permitidos.includes(action) ? 'block' : 'none';
  });

  document.querySelectorAll('.menu-item').forEach(item => {
    const submenuBtns = item.querySelectorAll('.submenu-btn');
    const visibles = Array.from(submenuBtns).filter(btn => btn.style.display !== 'none');
    item.style.display = visibles.length > 0 ? 'block' : 'none';
  });
}

// ============================================
// CONFIGURAR MENÚ
// ============================================
function configurarMenu() {
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const menuName = btn.dataset.menu;
      const submenu = document.getElementById(`submenu-${menuName}`);

      document.querySelectorAll('.submenu').forEach(sm => {
        if (sm.id !== `submenu-${menuName}`) sm.classList.remove('open');
      });
      document.querySelectorAll('.menu-btn').forEach(mb => {
        if (mb !== btn) mb.classList.remove('active');
      });

      btn.classList.toggle('active');
      if (submenu) submenu.classList.toggle('open');
    });
  });

  document.querySelectorAll('.submenu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.submenu-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ocultarBienvenida();
      cargarContenido(btn.dataset.action);
    });
  });
}

// ============================================
// CARGAR CONTENIDO DINÁMICO (CORREGIDO Y COMPLETO)
// ============================================
async function cargarContenido(action) {
  const [modulo, operacion] = action.split('-');
  const contenidoDiv = document.getElementById('contenidoDinamico');
  ocultarBienvenida();

  // ==========================================
  // 1. MÓDULO LOGS
  // ==========================================
  if (modulo === 'logs' && operacion === 'ver') {
    try {
      if (typeof inicializarModuloLogs === 'undefined') {
        await cargarScript('js/logs.js');
      }
      const response = await fetch('html/logs.html');
      if (!response.ok) throw new Error('No se pudo cargar html/logs.html');
      contenidoDiv.innerHTML = await response.text();

      await new Promise(resolve => setTimeout(resolve, 200));
      if (typeof inicializarModuloLogs === 'function') {
        await inicializarModuloLogs();
      }
    } catch (err) {
      console.error('Error al cargar logs:', err);
      contenidoDiv.innerHTML = `<fieldset><legend>Error</legend><p>No se pudo cargar el módulo de logs: ${err.message}</p></fieldset>`;
    }
    return;
  }

  // ==========================================
  // 2. INVENTARIO → REGISTRAR
  // ==========================================
  if (modulo === 'inventario' && operacion === 'registrar') {
    try {
      if (typeof JsBarcode === 'undefined') {
        await cargarScript('https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js');
      }
      if (typeof inicializarRegistroEquipo === 'undefined') {
        await cargarScript('js/registro.js');
      }

      const response = await fetch('html/registro.html');
      if (!response.ok) throw new Error('No se pudo cargar html/registro.html');
      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      const container = doc.querySelector('.container');
      if (!container) throw new Error('No se encontró .container');
      contenidoDiv.innerHTML = container.innerHTML;

      await new Promise(resolve => setTimeout(resolve, 300));
      if (typeof inicializarRegistroEquipo === 'function') {
        await inicializarRegistroEquipo();
      }
    } catch (err) {
      console.error('Error:', err);
      contenidoDiv.innerHTML = `<fieldset><legend>Error</legend><p>${err.message}</p></fieldset>`;
    }
    return;
  }

// ==========================================
// 3. INVENTARIO → MODIFICAR
// ==========================================
if (modulo === 'inventario' && operacion === 'modificar') {
  try {
    // ✅ CARGAR logs.js PRIMERO (para que registrarLog esté disponible)
    if (typeof registrarLog === 'undefined') {
      await cargarScript('js/logs.js');
    }
    
    // Cargar modificar.js si no está disponible
    if (typeof inicializarModificacion === 'undefined') {
      await cargarScript('js/modificar.js');
    }

    const response = await fetch('html/modificar.html');
    if (!response.ok) throw new Error('No se pudo cargar html/modificar.html');
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const container = doc.querySelector('.container');
    if (!container) throw new Error('No se encontró .container en modificar.html');
    contenidoDiv.innerHTML = container.innerHTML;

    await new Promise(resolve => setTimeout(resolve, 300));
    if (typeof inicializarModificacion === 'function') {
      await inicializarModificacion();
    }
  } catch (err) {
    console.error('Error cargando modificar:', err);
    contenidoDiv.innerHTML = `<fieldset><legend>Error</legend><p>No se pudo cargar el formulario de modificación: ${err.message}</p></fieldset>`;
  }
  return;
}
// ==========================================
// 4. INVENTARIO → ELIMINAR
// ==========================================
if (modulo === 'inventario' && operacion === 'eliminar') {
  try {
    // Cargar logs.js primero (para registrarLog)
    if (typeof registrarLog === 'undefined') {
      await cargarScript('js/logs.js');
    }
    
    // Cargar eliminar.js
    if (typeof inicializarEliminacion === 'undefined') {
      await cargarScript('js/eliminar.js');
    }

    const response = await fetch('html/eliminar.html');
    if (!response.ok) throw new Error('No se pudo cargar html/eliminar.html');
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const container = doc.querySelector('.container');
    if (!container) throw new Error('No se encontró .container');
    contenidoDiv.innerHTML = container.innerHTML;

    await new Promise(resolve => setTimeout(resolve, 300));
    if (typeof inicializarEliminacion === 'function') {
      await inicializarEliminacion();
    }
  } catch (err) {
    console.error('Error cargando eliminar:', err);
    contenidoDiv.innerHTML = `<fieldset><legend>Error</legend><p>No se pudo cargar: ${err.message}</p></fieldset>`;
  }
  return;
}
  // ==========================================
// 5. RENTAR → CREAR (NUEVA RENTA)
// ==========================================
if (modulo === 'rentar' && operacion === 'crear') {
  try {
    // Cargar logs.js primero
    if (typeof registrarLog === 'undefined') {
      await cargarScript('js/logs.js');
    }
    
    // Cargar nueva_renta.js
    if (typeof inicializarNuevaRenta === 'undefined') {
      await cargarScript('js/nueva_renta.js');
    }

    const response = await fetch('html/nueva_renta.html');
    if (!response.ok) throw new Error('No se pudo cargar html/nueva_renta.html');
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const container = doc.querySelector('.container');
    if (!container) throw new Error('No se encontró .container');
    contenidoDiv.innerHTML = container.innerHTML;

    await new Promise(resolve => setTimeout(resolve, 300));
    if (typeof inicializarNuevaRenta === 'function') {
      await inicializarNuevaRenta();
    }
  } catch (err) {
    console.error('Error cargando nueva renta:', err);
    contenidoDiv.innerHTML = `<fieldset><legend>Error</legend><p>No se pudo cargar: ${err.message}</p></fieldset>`;
  }
  return;
}

  // ==========================================
// CASO: RENTAR → MODIFICAR
// ==========================================
if (modulo === 'rentar' && operacion === 'modificar') {
  try {
    if (typeof registrarLog === 'undefined') {
      await cargarScript('js/logs.js');
    }
    
    if (typeof inicializarModificarRenta === 'undefined') {
      await cargarScript('js/modificar_renta.js');
    }

    const response = await fetch('html/modificar_renta.html');
    if (!response.ok) throw new Error('No se pudo cargar html/modificar_renta.html');
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const container = doc.querySelector('.container');
    if (!container) throw new Error('No se encontró .container');
    contenidoDiv.innerHTML = container.innerHTML;

    await new Promise(resolve => setTimeout(resolve, 300));
    if (typeof inicializarModificarRenta === 'function') {
      await inicializarModificarRenta();
    }
  } catch (err) {
    console.error('Error cargando modificar renta:', err);
    contenidoDiv.innerHTML = `<fieldset><legend>Error</legend><p>No se pudo cargar: ${err.message}</p></fieldset>`;
  }
  return;
}

  // ==========================================
// CASO: RENTAR → ELIMINAR
// ==========================================
if (modulo === 'rentar' && operacion === 'eliminar') {
  try {
    if (typeof registrarLog === 'undefined') {
      await cargarScript('js/logs.js');
    }
    
    if (typeof inicializarEliminarRenta === 'undefined') {
      await cargarScript('js/eliminar_renta.js');
    }

    const response = await fetch('html/eliminar_renta.html');
    if (!response.ok) throw new Error('No se pudo cargar html/eliminar_renta.html');
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const container = doc.querySelector('.container');
    if (!container) throw new Error('No se encontró .container');
    contenidoDiv.innerHTML = container.innerHTML;

    await new Promise(resolve => setTimeout(resolve, 300));
    if (typeof inicializarEliminarRenta === 'function') {
      await inicializarEliminarRenta();
    }
  } catch (err) {
    console.error('Error cargando eliminar renta:', err);
    contenidoDiv.innerHTML = `<fieldset><legend>Error</legend><p>No se pudo cargar: ${err.message}</p></fieldset>`;
  }
  return;
}

  // ==========================================
// CASO: RENTAR → VENCIDAS
// ==========================================
if (modulo === 'rentar' && operacion === 'vencidas') {
  try {
    if (typeof registrarLog === 'undefined') {
      await cargarScript('js/logs.js');
    }
    
    if (typeof inicializarRentasVencidas === 'undefined') {
      await cargarScript('js/rentas_vencidas.js');
    }

    const response = await fetch('html/rentas_vencidas.html');
    if (!response.ok) throw new Error('No se pudo cargar html/rentas_vencidas.html');
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const container = doc.querySelector('.container');
    if (!container) throw new Error('No se encontró .container');
    contenidoDiv.innerHTML = container.innerHTML;

    await new Promise(resolve => setTimeout(resolve, 300));
    if (typeof inicializarRentasVencidas === 'function') {
      await inicializarRentasVencidas();
    }
  } catch (err) {
    console.error('Error cargando rentas vencidas:', err);
    contenidoDiv.innerHTML = `<fieldset><legend>Error</legend><p>No se pudo cargar: ${err.message}</p></fieldset>`;
  }
  return;
}
  // ==========================================
// CASO: RENTAR → HISTORIAL
// ==========================================
if (modulo === 'rentar' && operacion === 'historial') {
  try {
    if (typeof registrarLog === 'undefined') {
      await cargarScript('js/logs.js');
    }
    
    if (typeof inicializarHistorialRentas === 'undefined') {
      await cargarScript('js/historial_rentas.js');
    }

    const response = await fetch('html/historial_rentas.html');
    if (!response.ok) throw new Error('No se pudo cargar html/historial_rentas.html');
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const container = doc.querySelector('.container');
    if (!container) throw new Error('No se encontró .container');
    contenidoDiv.innerHTML = container.innerHTML;

    await new Promise(resolve => setTimeout(resolve, 300));
    if (typeof inicializarHistorialRentas === 'function') {
      await inicializarHistorialRentas();
    }
  } catch (err) {
    console.error('Error cargando historial rentas:', err);
    contenidoDiv.innerHTML = `<fieldset><legend>Error</legend><p>No se pudo cargar: ${err.message}</p></fieldset>`;
  }
  return;
}

// ==========================================
// CASO: RENTAR → TERMINADAS
// ==========================================
if (modulo === 'rentar' && operacion === 'terminadas') {
  try {
    if (typeof inicializarRentasTerminadas === 'undefined') {
      await cargarScript('js/rentas_terminadas.js');
    }

    const response = await fetch('html/rentas_terminadas.html');
    if (!response.ok) throw new Error('No se pudo cargar html/rentas_terminadas.html');
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const container = doc.querySelector('.container');
    if (!container) throw new Error('No se encontró .container');
    contenidoDiv.innerHTML = container.innerHTML;

    await new Promise(resolve => setTimeout(resolve, 300));
    if (typeof inicializarRentasTerminadas === 'function') {
      await inicializarRentasTerminadas();
    }
  } catch (err) {
    console.error('Error cargando rentas terminadas:', err);
    contenidoDiv.innerHTML = `<fieldset><legend>Error</legend><p>No se pudo cargar: ${err.message}</p></fieldset>`;
  }
  return;
}

  // ==========================================
// CASO: AVERÍAS → REGISTRAR
// ==========================================
if (modulo === 'averias' && operacion === 'registrar') {
  try {
    if (typeof registrarLog === 'undefined') {
      await cargarScript('js/logs.js');
    }
    
    if (typeof inicializarRegistrarAveria === 'undefined') {
      await cargarScript('js/registrar_averia.js');
    }

    const response = await fetch('html/registrar_averia.html');
    if (!response.ok) throw new Error('No se pudo cargar html/registrar_averia.html');
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const container = doc.querySelector('.container');
    if (!container) throw new Error('No se encontró .container');
    contenidoDiv.innerHTML = container.innerHTML;

    await new Promise(resolve => setTimeout(resolve, 300));
    if (typeof inicializarRegistrarAveria === 'function') {
      await inicializarRegistrarAveria();
    }
  } catch (err) {
    console.error('Error cargando registrar avería:', err);
    contenidoDiv.innerHTML = `<fieldset><legend>Error</legend><p>No se pudo cargar: ${err.message}</p></fieldset>`;
  }
  return;
}
  // ==========================================
// CASO: AVERÍAS → MODIFICAR
// ==========================================
if (modulo === 'averias' && operacion === 'modificar') {
  try {
    if (typeof registrarLog === 'undefined') {
      await cargarScript('js/logs.js');
    }
    
    if (typeof inicializarModificarAveria === 'undefined') {
      await cargarScript('js/modificar_averia.js');
    }

    const response = await fetch('html/modificar_averia.html');
    if (!response.ok) throw new Error('No se pudo cargar html/modificar_averia.html');
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const container = doc.querySelector('.container');
    if (!container) throw new Error('No se encontró .container');
    contenidoDiv.innerHTML = container.innerHTML;

    await new Promise(resolve => setTimeout(resolve, 300));
    if (typeof inicializarModificarAveria === 'function') {
      await inicializarModificarAveria();
    }
  } catch (err) {
    console.error('Error cargando modificar avería:', err);
    contenidoDiv.innerHTML = `<fieldset><legend>Error</legend><p>No se pudo cargar: ${err.message}</p></fieldset>`;
  }
  return;
}
  // ==========================================
// CASO: AVERÍAS → REINTEGRAR
// ==========================================
if (modulo === 'averias' && operacion === 'reintegrar') {
  try {
    if (typeof registrarLog === 'undefined') {
      await cargarScript('js/logs.js');
    }
    
    if (typeof inicializarReintegrarAveria === 'undefined') {
      await cargarScript('js/reintegrar_averia.js');
    }

    const response = await fetch('html/reintegrar_averia.html');
    if (!response.ok) throw new Error('No se pudo cargar html/reintegrar_averia.html');
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const container = doc.querySelector('.container');
    if (!container) throw new Error('No se encontró .container');
    contenidoDiv.innerHTML = container.innerHTML;

    await new Promise(resolve => setTimeout(resolve, 300));
    if (typeof inicializarReintegrarAveria === 'function') {
      await inicializarReintegrarAveria();
    }
  } catch (err) {
    console.error('Error cargando reintegrar avería:', err);
    contenidoDiv.innerHTML = `<fieldset><legend>Error</legend><p>No se pudo cargar: ${err.message}</p></fieldset>`;
  }
  return;
}
  // ==========================================
  // 4. OTROS MÓDULOS (Placeholders organizados)
  // ==========================================
  let html = '';
  switch (modulo) {
    case 'consulta':    html = generarFormularioConsulta(operacion); break;
    case 'inventario':  html = generarFormularioInventario(operacion); break;
    case 'rentar':      html = generarFormularioRentar(operacion); break;
    case 'averias':     html = generarFormularioAverias(operacion); break;
    case 'ventas':      html = generarFormularioVentas(operacion); break;
    case 'reportes':    html = generarFormularioReportes(operacion); break;
    case 'usuarios':    html = generarFormularioUsuarios(operacion); break;
    default:            html = `<fieldset><legend>Módulo no disponible</legend><p>Próximamente: ${modulo} - ${operacion}</p></fieldset>`;
  }
  contenidoDiv.innerHTML = html;
}

function cargarScript(url) {
  return new Promise((resolve, reject) => {
    const scripts = document.querySelectorAll('script[src]');
    for (let script of scripts) {
      if (script.src.includes(url)) { resolve(); return; }
    }
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ============================================
// GENERADORES DE FORMULARIOS (Placeholders)
// ============================================
function generarFormularioConsulta(operacion) {
  return `<fieldset><legend>🔍 Consulta de Inventario</legend>
    <div class="form-grid">
      <div class="form-group"><label>Buscar por</label>
        <select><option>Código de Barras</option><option>Nombre del Equipo</option><option>Serial</option></select>
      </div>
      <div class="form-group"><label>Término de búsqueda</label><input type="text" placeholder="Ingrese el valor..."></div>
    </div>
    <br><button class="btn-action btn-primary">🔎 Buscar</button>
    <div class="table-container" style="margin-top:20px;">
      <table><thead><tr><th>Código</th><th>Nombre</th><th>Marca</th><th>Serial</th><th>Estado</th></tr></thead>
      <tbody><tr><td colspan="5" style="text-align:center; color:#6b7280;">Realice una búsqueda para ver resultados</td></tr></tbody></table>
    </div>
  </fieldset>`;
}

function generarFormularioInventario(operacion) {
  if (operacion === 'eliminar') {
    return `<fieldset><legend>📦 Eliminar Equipo</legend>
      <div class="table-container"><table><thead><tr><th>Código</th><th>Nombre</th><th>Marca</th><th>Serial</th><th>Acción</th></tr></thead>
      <tbody><tr><td colspan="5" style="text-align:center;">Próximamente: listado de equipos para eliminar</td></tr></tbody></table></div>
    </fieldset>`;
  }
  return `<fieldset><legend>📦 Inventario</legend><p>Seleccione una opción del submenú.</p></fieldset>`;
}

function generarFormularioRentar(operacion) {
  return `<fieldset><legend>🤝 Módulo de Rentas</legend><p>Próximamente: Gestión de rentas (${operacion}).</p></fieldset>`;
}

function generarFormularioAverias(operacion) {
  return `<fieldset><legend>🔧 Módulo de Averías</legend><p>Próximamente: Gestión de averías (${operacion}).</p></fieldset>`;
}

function generarFormularioVentas(operacion) {
  return `<fieldset><legend>💰 Módulo de Ventas</legend><p>Próximamente: Gestión de ventas (${operacion}).</p></fieldset>`;
}

function generarFormularioReportes(operacion) {
  return `<fieldset><legend>📊 Reportes</legend><p>Próximamente: Generación de reportes.</p></fieldset>`;
}

function generarFormularioUsuarios(operacion) {
  return `<fieldset><legend>👥 Gestión de Usuarios</legend><p>Próximamente: Administración de usuarios (${operacion}).</p></fieldset>`;
}

// ============================================
// RELOJ Y HEARTBEAT
// ============================================
function iniciarReloj() {
  function actualizar() {
    const ahora = new Date();
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha = ahora.toLocaleDateString('es-ES', opciones);
    document.getElementById('fechaActual').textContent = fecha.charAt(0).toUpperCase() + fecha.slice(1);
    const h = String(ahora.getHours()).padStart(2, '0');
    const m = String(ahora.getMinutes()).padStart(2, '0');
    const s = String(ahora.getSeconds()).padStart(2, '0');
    document.getElementById('horaActual').textContent = `${h}:${m}:${s}`;
  }
  actualizar();
  relojInterval = setInterval(actualizar, 1000);
}

function iniciarHeartbeat(email) {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(async () => {
    try {
      await supabaseClient.from('sesiones_activas')
        .update({ last_activity: new Date().toISOString() })
        .eq('email', email);
    } catch (err) { console.error('Error en heartbeat:', err); }
  }, 120000);
}
// ============================================
// CONTADOR DE RENTAS VENCIDAS (CAMPANITA)
// ============================================
async function cargarContadorRentasVencidas() {
  try {
    const hoy = new Date().toISOString().split('T')[0];

    const { count, error } = await supabaseClient
      .from('rentas')
      .select('*', { count: 'exact', head: true })
      .lt('fecha_devolucion', hoy)
      .neq('estado', 'devuelta')
      .neq('estado', 'cancelada');

    if (error) throw error;

    const badge = document.getElementById('badgeVencidas');
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (err) {
    console.error('Error al cargar contador de rentas vencidas:', err);
  }
}
// ============================================
// LOGOUT
// ============================================
document.getElementById('btnLogout').addEventListener('click', async () => {
  const btn = document.getElementById('btnLogout');
  btn.disabled = true;
  btn.textContent = '🚪 Cerrando...';
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      await supabaseClient.from('sesiones_activas').delete().eq('email', session.user.email);
    }
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (relojInterval) clearInterval(relojInterval);
    await supabaseClient.auth.signOut();
    localStorage.removeItem('session');
    window.location.href = 'index.html';
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
    btn.disabled = false;
    btn.textContent = '🚪 Cerrar Sesión';
  }
});

window.addEventListener('beforeunload', async () => {
  const sessionStr = localStorage.getItem('session');
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      if (session.user?.email) {
        await supabaseClient.from('sesiones_activas').delete().eq('email', session.user.email);
      }
    } catch (err) { console.error('Error:', err); }
  }
});

supabaseClient.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') window.location.href = 'index.html';
});

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 Dashboard DOM cargado');
  iniciarDashboard();
});
