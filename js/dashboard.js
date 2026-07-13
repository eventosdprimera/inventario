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
// APLICAR PERMISOS POR ROL (NUEVA LÓGICA)
// ============================================
function aplicarPermisosPorRol() {
  const permitidos = PERMISOS_POR_ROL[currentUserRol] || [];

  // Ocultar/mostrar cada submenú según permisos
  document.querySelectorAll('.submenu-btn').forEach(btn => {
    const action = btn.dataset.action;
    btn.style.display = permitidos.includes(action) ? 'block' : 'none';
  });

  // Ocultar el menú completo si no tiene ningún submenú visible
  document.querySelectorAll('.menu-item').forEach(item => {
    const submenuBtns = item.querySelectorAll('.submenu-btn');
    const visibles = Array.from(submenuBtns).filter(btn => btn.style.display !== 'none');
    item.style.display = visibles.length > 0 ? 'block' : 'none';
  });
}

// ============================================
// CONFIGURAR MENÚ (eventos de clic)
// ============================================
function configurarMenu() {
  // Toggle de menús principales
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

  // Acciones de submenús
  document.querySelectorAll('.submenu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.submenu-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ocultarBienvenida();
      cargarContenido(btn.dataset.action);
    });
  });
}

async function cargarContenido(action) {
  const [modulo, operacion] = action.split('-');
  const contenidoDiv = document.getElementById('contenidoDinamico');
  ocultarBienvenida();

  // 📝 REGISTRAR LA ACTIVIDAD EN LOGS (automático para todos los módulos)
  await registrarLog(modulo, operacion, `Acción '${operacion}' en módulo '${modulo}'`);

  // ============================================
  // CASO ESPECIAL: MÓDULO LOGS (carga archivos separados)
  // ============================================
  if (modulo === 'logs') {
    try {
      // Cargar logs.js si no está disponible
      if (typeof inicializarModuloLogs === 'undefined') {
        await cargarScript('js/logs.js');
      }
      // Cargar el HTML del módulo
      const response = await fetch('html/logs.html');
      if (!response.ok) throw new Error('No se pudo cargar html/logs.html');
      const htmlText = await response.text();
      contenidoDiv.innerHTML = htmlText;

      // Esperar a que el DOM esté listo e inicializar
      await new Promise(resolve => setTimeout(resolve, 200));
      if (typeof inicializarModuloLogs === 'function') {
        await inicializarModuloLogs();
      }
    } catch (err) {
      console.error('Error al cargar módulo de logs:', err);
      contenidoDiv.innerHTML = `<fieldset><legend>Error</legend>
        <p>No se pudo cargar el módulo de logs: ${err.message}</p>
      </fieldset>`;
    }
    return;
  }

  // ============================================
  // CASO ESPECIAL: INVENTARIO → REGISTRAR (usa registro.html)
  // ============================================
 // Caso: Inventario → Registrar
if (modulo === 'inventario' && operacion === 'registrar') {
  try {
    if (typeof JsBarcode === 'undefined') {
      await cargarScript('https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js');
    }
    if (typeof inicializarRegistroEquipo === 'undefined') {
      await cargarScript('js/registro.js');
    }

    const response = await fetch('html/registro.html');
    if (!response.ok) throw new Error('No se pudo cargar');
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    // ✅ SOLO extraer el contenido del .container (sin modales)
    const container = doc.querySelector('.container');
    if (!container) throw new Error('No se encontró .container');
    contenidoDiv.innerHTML = container.innerHTML;

    // ✅ NO clonar modales - registro.js los crea dinámicamente

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
  // ============================================
  // OTROS MÓDULOS (placeholders)
  // ============================================
  let html = '';
  switch (modulo) {
    case 'consulta':    html = generarFormularioConsulta(operacion); break;
    case 'inventario':  html = generarFormularioInventario(operacion); break;
    case 'rentar':      html = generarFormularioRentar(operacion); break;
    case 'averias':     html = generarFormularioAverias(operacion); break;
    case 'ventas':      html = generarFormularioVentas(operacion); break;
    case 'reportes':    html = generarFormularioReportes(operacion); break;
    case 'usuarios':    html = generarFormularioUsuarios(operacion); break;
    default:            html = '<fieldset><legend>Módulo no disponible</legend><p>Próximamente.</p></fieldset>';
  }
  contenidoDiv.innerHTML = html;
}

function cargarScript(url) {
  return new Promise((resolve, reject) => {
    const scripts = document.querySelectorAll('script[src]');
    for (let script of scripts) {
      if (script.src === url) { resolve(); return; }
    }
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ============================================
// FORMULARIOS POR MÓDULO
// ============================================
function generarFormularioConsulta(operacion) {
  return `<fieldset><legend>🔍 Consulta de Inventario</legend>
    <div class="form-grid">
      <div class="form-group">
        <label>Buscar por</label>
        <select>
          <option>Código de Barras</option>
          <option>Nombre del Equipo</option>
          <option>Categoría</option>
          <option>Estado</option>
        </select>
      </div>
      <div class="form-group">
        <label>Término de búsqueda</label>
        <input type="text" placeholder="Ingrese el valor a buscar...">
      </div>
    </div>
    <br>
    <button class="btn-action btn-primary">🔎 Buscar</button>
    <button class="btn-action btn-secondary">Limpiar</button>
    <div class="table-container" style="margin-top:20px;">
      <table>
        <thead><tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Estado</th><th>Ubicación</th></tr></thead>
        <tbody><tr><td colspan="5" style="text-align:center; color:#6b7280;">Realice una búsqueda para ver resultados</td></tr></tbody>
      </table>
    </div>
  </fieldset>`;
}

function generarFormularioInventario(operacion) {
  if (operacion === 'modificar') {
    return `<fieldset><legend>📦 Modificar Equipo</legend>
      <p>Próximamente: formulario de modificación de equipos.</p>
    </fieldset>`;
  } else if (operacion === 'eliminar') {
    return `<fieldset><legend>📦 Eliminar Equipo</legend>
      <div class="table-container">
        <table>
          <thead><tr><th>Código</th><th>Nombre</th><th>Marca</th><th>Serial</th><th>Estatus</th><th>Fecha</th><th>Acción</th></tr></thead>
          <tbody><tr><td colspan="7" style="text-align:center;">Próximamente: listado de equipos</td></tr></tbody>
        </table>
      </div>
    </fieldset>`;
  }
  return '';
}

function generarFormularioRentar(operacion) {
  switch (operacion) {
    case 'crear':
      return `<fieldset><legend>🤝 Crear Nueva Renta</legend>
        <div class="form-grid">
          <div class="form-group"><label>Cliente</label><input type="text" placeholder="Nombre del cliente"></div>
          <div class="form-group"><label>Teléfono</label><input type="tel" placeholder="Teléfono de contacto"></div>
          <div class="form-group"><label>Fecha de Inicio</label><input type="date"></div>
          <div class="form-group"><label>Fecha de Devolución</label><input type="date"></div>
          <div class="form-group"><label>Equipo a Rentar</label><select><option>Seleccionar equipo...</option></select></div>
          <div class="form-group"><label>Precio Total ($)</label><input type="number" placeholder="0.00"></div>
        </div>
        <div class="form-group" style="margin-top:15px;">
          <label>Observaciones</label>
          <textarea rows="3" placeholder="Detalles adicionales de la renta..."></textarea>
        </div>
        <br>
        <button class="btn-action btn-primary">💾 Guardar Renta</button>
        <button class="btn-action btn-secondary">Cancelar</button>
      </fieldset>`;
    case 'modificar':
      return `<fieldset><legend>🤝 Modificar Renta</legend>
        <div class="form-group"><label>Seleccionar Renta</label><select><option>Seleccionar renta...</option></select></div>
        <p style="margin-top:15px; color:#6b7280;">Los datos de la renta se cargarán aquí para su edición.</p>
      </fieldset>`;
    case 'eliminar':
      return `<fieldset><legend>🤝 Eliminar Renta</legend>
        <div class="table-container">
          <table>
            <thead><tr><th>ID</th><th>Cliente</th><th>Equipo</th><th>Inicio</th><th>Devolución</th><th>Total</th><th>Acción</th></tr></thead>
            <tbody><tr><td colspan="7" style="text-align:center;">Próximamente: listado de rentas</td></tr></tbody>
          </table>
        </div>
      </fieldset>`;
    case 'vencidas':
      return `<fieldset><legend>⚠️ Rentas Vencidas</legend>
        <div class="table-container">
          <table>
            <thead><tr><th>ID</th><th>Cliente</th><th>Equipo</th><th>Fecha Vencimiento</th><th>Días Vencida</th><th>Contacto</th><th>Acción</th></tr></thead>
            <tbody><tr><td colspan="7" style="text-align:center;">No hay rentas vencidas actualmente</td></tr></tbody>
          </table>
        </div>
      </fieldset>`;
    case 'historial':
      return `<fieldset><legend>📜 Historial de Rentas</legend>
        <div class="form-grid">
          <div class="form-group"><label>Desde</label><input type="date"></div>
          <div class="form-group"><label>Hasta</label><input type="date"></div>
        </div>
        <br>
        <button class="btn-action btn-primary">🔎 Filtrar</button>
        <div class="table-container" style="margin-top:20px;">
          <table>
            <thead><tr><th>ID</th><th>Cliente</th><th>Equipo</th><th>Inicio</th><th>Devolución</th><th>Total</th><th>Estado</th></tr></thead>
            <tbody><tr><td colspan="7" style="text-align:center;">Seleccione un rango de fechas</td></tr></tbody>
          </table>
        </div>
      </fieldset>`;
  }
  return '';
}

function generarFormularioAverias(operacion) {
  switch (operacion) {
    case 'registrar':
      return `<fieldset><legend>🔧 Registrar Avería</legend>
        <div class="form-grid">
          <div class="form-group"><label>Equipo Afectado</label><select><option>Seleccionar equipo...</option></select></div>
          <div class="form-group"><label>Tipo de Avería</label>
            <select>
              <option>Daño físico</option>
              <option>Falla eléctrica</option>
              <option>Componente faltante</option>
              <option>Otro</option>
            </select>
          </div>
          <div class="form-group"><label>Fecha del Incidente</label><input type="date"></div>
          <div class="form-group"><label>Gravedad</label>
            <select>
              <option>Leve</option>
              <option>Moderada</option>
              <option>Grave</option>
              <option>Crítica</option>
            </select>
          </div>
        </div>
        <div class="form-group" style="margin-top:15px;">
          <label>Descripción de la Avería</label>
          <textarea rows="4" placeholder="Describa detalladamente la avería..."></textarea>
        </div>
        <br>
        <button class="btn-action btn-primary">💾 Registrar Avería</button>
        <button class="btn-action btn-secondary">Cancelar</button>
      </fieldset>`;
    case 'modificar':
      return `<fieldset><legend>🔧 Modificar Avería</legend>
        <div class="form-group"><label>Seleccionar Avería</label><select><option>Seleccionar avería...</option></select></div>
        <p style="margin-top:15px; color:#6b7280;">Los datos de la avería se cargarán aquí para su edición.</p>
      </fieldset>`;
    case 'reintegrar':
      return `<fieldset><legend>✅ Reintegrar Equipo</legend>
        <div class="form-group"><label>Equipo en Reparación</label><select><option>Seleccionar equipo...</option></select></div>
        <div class="form-group" style="margin-top:15px;">
          <label>Estado Final</label>
          <select>
            <option>Operativo - Disponible</option>
            <option>Operativo - En observación</option>
            <option>No reparable - Dar de baja</option>
          </select>
        </div>
        <div class="form-group" style="margin-top:15px;">
          <label>Observaciones del Reintegro</label>
          <textarea rows="3" placeholder="Detalles del reintegro..."></textarea>
        </div>
        <br>
        <button class="btn-action btn-primary">✅ Reintegrar al Inventario</button>
      </fieldset>`;
  }
  return '';
}

function generarFormularioVentas(operacion) {
  switch (operacion) {
    case 'crear':
      return `<fieldset><legend>💰 Crear Venta</legend>
        <div class="form-grid">
          <div class="form-group"><label>Cliente</label><input type="text" placeholder="Nombre del cliente"></div>
          <div class="form-group"><label>Fecha</label><input type="date"></div>
          <div class="form-group"><label>Método de Pago</label>
            <select><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select>
          </div>
          <div class="form-group"><label>Total ($)</label><input type="number" placeholder="0.00"></div>
        </div>
        <br>
        <button class="btn-action btn-primary">💾 Registrar Venta</button>
        <button class="btn-action btn-secondary">Cancelar</button>
      </fieldset>`;
    case 'modificar':
      return `<fieldset><legend>💰 Modificar Venta</legend>
        <div class="form-group"><label>Seleccionar Venta</label><select><option>Seleccionar venta...</option></select></div>
      </fieldset>`;
    case 'eliminar':
      return `<fieldset><legend>💰 Eliminar Venta</legend>
        <div class="table-container">
          <table>
            <thead><tr><th>ID</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Acción</th></tr></thead>
            <tbody><tr><td colspan="5" style="text-align:center;">Próximamente</td></tr></tbody>
          </table>
        </div>
      </fieldset>`;
  }
  return '';
}

function generarFormularioReportes(operacion) {
  return `<fieldset><legend>📊 Ver Reportes</legend>
    <div class="form-grid">
      <div class="form-group"><label>Tipo de Reporte</label>
        <select>
          <option>Inventario General</option>
          <option>Rentas del Mes</option>
          <option>Ventas</option>
          <option>Averías</option>
          <option>Actividad de Usuarios</option>
        </select>
      </div>
      <div class="form-group"><label>Periodo</label><input type="month"></div>
    </div>
    <br>
    <button class="btn-action btn-primary">📄 Generar Reporte</button>
    <button class="btn-action btn-secondary">📥 Exportar PDF</button>
  </fieldset>`;
}

function generarFormularioUsuarios(operacion) {
  switch (operacion) {
    case 'crear':
      return `<fieldset><legend>👥 Crear Usuario</legend>
        <div class="form-grid">
          <div class="form-group"><label>Nombre Completo</label><input type="text" placeholder="Nombre completo"></div>
          <div class="form-group"><label>Email</label><input type="email" placeholder="correo@ejemplo.com"></div>
          <div class="form-group"><label>Rol</label>
            <select>
              <option value="administrador">Administrador</option>
              <option value="moderador">Moderador</option>
              <option value="consultor" selected>Consultor</option>
            </select>
          </div>
          <div class="form-group"><label>Contraseña</label><input type="password" placeholder="••••••••"></div>
        </div>
        <br>
        <button class="btn-action btn-primary">💾 Crear Usuario</button>
        <button class="btn-action btn-secondary">Cancelar</button>
      </fieldset>`;
    case 'modificar':
      return `<fieldset><legend>👥 Modificar Usuario</legend>
        <div class="form-group"><label>Seleccionar Usuario</label><select><option>Seleccionar usuario...</option></select></div>
      </fieldset>`;
    case 'eliminar':
      return `<fieldset><legend>👥 Eliminar Usuario</legend>
        <div class="table-container">
          <table>
            <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Acción</th></tr></thead>
            <tbody><tr><td colspan="5" style="text-align:center;">Próximamente</td></tr></tbody>
          </table>
        </div>
      </fieldset>`;
  }
  return '';
}

function generarFormularioLogs(operacion) {
  return `<fieldset><legend>📜 Logs del Sistema</legend>
    <div class="form-grid">
      <div class="form-group"><label>Módulo</label>
        <select>
          <option value="">Todos</option>
          <option value="inventario">Inventario</option>
          <option value="rentar">Rentar</option>
          <option value="averias">Averías</option>
          <option value="ventas">Ventas</option>
          <option value="usuarios">Usuarios</option>
        </select>
      </div>
      <div class="form-group"><label>Usuario</label><input type="text" placeholder="Filtrar por email..."></div>
      <div class="form-group"><label>Desde</label><input type="date"></div>
      <div class="form-group"><label>Hasta</label><input type="date"></div>
    </div>
    <br>
    <button class="btn-action btn-primary">🔎 Filtrar Logs</button>
    <div class="table-container" style="margin-top:20px;">
      <table>
        <thead><tr><th>Fecha/Hora</th><th>Usuario</th><th>Módulo</th><th>Acción</th><th>Detalles</th></tr></thead>
        <tbody><tr><td colspan="5" style="text-align:center;">Los registros de actividad aparecerán aquí</td></tr></tbody>
      </table>
    </div>
  </fieldset>`;
}

// ============================================
// REGISTRO DE LOGS (NUEVO)
// ============================================
async function registrarLog(modulo, operacion) {
  try {
    await supabaseClient.from('logs_actividad').insert({
      usuario_email: currentUserEmail,
      modulo: modulo,
      accion: operacion,
      fecha: new Date().toISOString(),
      detalles: `Acción '${operacion}' en módulo '${modulo}'`
    });
  } catch (err) {
    // Si la tabla no existe, solo lo mostramos en consola (no bloquea el sistema)
    console.warn('⚠️ No se pudo registrar log (¿existe la tabla logs_actividad?):', err.message);
  }
}

// ============================================
// RELOJ
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

// ============================================
// HEARTBEAT
// ============================================
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

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 Dashboard DOM cargado');
  iniciarDashboard();
});
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
  
  // 📝 Registrar que el usuario entró al dashboard
  await registrarLog('auth', 'login_dashboard', 'Usuario accedió al dashboard');
  
  console.log('✅ Dashboard iniciado correctamente');
}
