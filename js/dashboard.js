const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let heartbeatInterval = null;
let currentUserRol = 'consultor';
let currentUserData = null;
let relojInterval = null;

async function iniciarDashboard() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    
    await cargarDatosUsuario(session.user.email);
    iniciarHeartbeat(session.user.email);
    configurarMenu();
    aplicarPermisosPorRol();
    iniciarReloj();
    
    // Mostrar mensaje de bienvenida al cargar
    mostrarBienvenida();
}

// Mostrar mensaje de bienvenida
function mostrarBienvenida() {
    document.querySelector('.welcome-card').style.display = 'block';
}

// Ocultar mensaje de bienvenida
function ocultarBienvenida() {
    document.querySelector('.welcome-card').style.display = 'none';
}

async function cargarDatosUsuario(email) {
    try {
        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();
        
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

function aplicarPermisosPorRol() {
    document.querySelectorAll('.menu-item').forEach(item => {
        const menuName = item.querySelector('.menu-btn').dataset.menu;
        const submenuBtns = item.querySelectorAll('.submenu-btn');
        
        submenuBtns.forEach(btn => {
            const operacion = btn.dataset.action.split('-')[1];
            let permitido = false;
            
            if (currentUserRol === 'administrador') {
                permitido = true;
            } else if (currentUserRol === 'moderador') {
                if (operacion === 'registrar' || operacion === 'modificar') permitido = true;
                if (operacion === 'eliminar' && menuName === 'consulta') permitido = true;
            } else if (currentUserRol === 'consultor') {
                if (menuName === 'consulta' && operacion === 'modificar') permitido = true;
            }
            
            btn.style.display = permitido ? 'block' : 'none';
        });
        
        const allHidden = Array.from(submenuBtns).every(btn => btn.style.display === 'none');
        item.style.display = (allHidden && currentUserRol !== 'administrador') ? 'none' : 'block';
    });
}

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
            submenu.classList.toggle('open');
        });
    });
    
    document.querySelectorAll('.submenu-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.submenu-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Ocultar mensaje de bienvenida al seleccionar un módulo
            ocultarBienvenida();
            
            cargarContenido(btn.dataset.action);
        });
    });
}

function cargarContenido(action) {
    const [modulo, operacion] = action.split('-');
    const contenidoDiv = document.getElementById('contenidoDinamico');
    
    switch(modulo) {
        case 'consulta': contenidoDiv.innerHTML = generarFormularioConsulta(operacion); break;
        case 'productos': contenidoDiv.innerHTML = generarFormularioProductos(operacion); break;
        case 'eventos': contenidoDiv.innerHTML = generarFormularioEventos(operacion); break;
        case 'usuarios': contenidoDiv.innerHTML = generarFormularioUsuarios(operacion); break;
        case 'reportes': contenidoDiv.innerHTML = generarFormularioReportes(operacion); break;
    }
}

function generarFormularioConsulta(operacion) {
    if (operacion === 'registrar') {
        return `<fieldset><legend>Registrar Consulta</legend>
            <div class="form-grid">
                <div class="form-group"><label>Tipo de Consulta</label><select><option>General</option><option>Específica</option><option>Urgente</option></select></div>
                <div class="form-group"><label>Fecha</label><input type="date"></div>
            </div>
            <div class="form-group"><label>Descripción</label><textarea rows="4" placeholder="Describe la consulta..."></textarea></div>
            <br><button class="btn-action btn-primary">Guardar</button><button class="btn-action btn-secondary">Cancelar</button></fieldset>`;
    } else if (operacion === 'modificar') {
        return `<fieldset><legend>Modificar Consulta</legend>
            <div class="form-group"><label>Seleccionar Consulta</label><select><option>Consulta #001</option><option>Consulta #002</option></select></div>
            <div class="form-grid">
                <div class="form-group"><label>Tipo</label><select><option>General</option><option>Específica</option><option>Urgente</option></select></div>
                <div class="form-group"><label>Fecha</label><input type="date"></div>
            </div>
            <br><button class="btn-action btn-primary">Actualizar</button><button class="btn-action btn-secondary">Cancelar</button></fieldset>`;
    } else {
        return `<fieldset><legend>Eliminar Consulta</legend>
            <div class="table-container"><table><thead><tr><th>ID</th><th>Tipo</th><th>Fecha</th><th>Descripción</th></tr></thead>
            <tbody><tr><td>001</td><td>General</td><td>2026-01-15</td><td>Consulta sobre inventario</td></tr></tbody></table></div>
            <br><button class="btn-action btn-danger">Eliminar Seleccionado</button></fieldset>`;
    }
}

function generarFormularioProductos(operacion) {
    if (operacion === 'registrar') {
        return `<fieldset><legend>Registrar Producto</legend>
            <div class="form-grid">
                <div class="form-group"><label>Nombre</label><input type="text" placeholder="Nombre del producto"></div>
                <div class="form-group"><label>Código</label><input type="text" placeholder="Código único"></div>
                <div class="form-group"><label>Cantidad</label><input type="number" placeholder="0"></div>
                <div class="form-group"><label>Precio</label><input type="number" step="0.01" placeholder="0.00"></div>
            </div>
            <br><button class="btn-action btn-primary">Guardar</button><button class="btn-action btn-secondary">Cancelar</button></fieldset>`;
    } else if (operacion === 'modificar') {
        return `<fieldset><legend>Modificar Producto</legend>
            <div class="form-group"><label>Seleccionar Producto</label><select><option>Producto #001</option></select></div>
            <div class="form-grid">
                <div class="form-group"><label>Nombre</label><input type="text"></div>
                <div class="form-group"><label>Código</label><input type="text"></div>
            </div>
            <br><button class="btn-action btn-primary">Actualizar</button><button class="btn-action btn-secondary">Cancelar</button></fieldset>`;
    } else {
        return `<fieldset><legend>Eliminar Producto</legend>
            <div class="table-container"><table><thead><tr><th>Código</th><th>Nombre</th><th>Cantidad</th><th>Precio</th></tr></thead>
            <tbody><tr><td>P001</td><td>Producto Ejemplo</td><td>10</td><td>$50.00</td></tr></tbody></table></div>
            <br><button class="btn-action btn-danger">Eliminar Seleccionado</button></fieldset>`;
    }
}

function generarFormularioEventos(operacion) {
    if (operacion === 'registrar') {
        return `<fieldset><legend>Registrar Evento</legend>
            <div class="form-grid">
                <div class="form-group"><label>Nombre</label><input type="text" placeholder="Nombre del evento"></div>
                <div class="form-group"><label>Fecha</label><input type="date"></div>
                <div class="form-group"><label>Lugar</label><input type="text" placeholder="Ubicación"></div>
                <div class="form-group"><label>Capacidad</label><input type="number" placeholder="0"></div>
            </div>
            <br><button class="btn-action btn-primary">Guardar</button><button class="btn-action btn-secondary">Cancelar</button></fieldset>`;
    } else if (operacion === 'modificar') {
        return `<fieldset><legend>Modificar Evento</legend>
            <div class="form-group"><label>Seleccionar Evento</label><select><option>Evento #001</option></select></div>
            <div class="form-grid">
                <div class="form-group"><label>Nombre</label><input type="text"></div>
                <div class="form-group"><label>Fecha</label><input type="date"></div>
            </div>
            <br><button class="btn-action btn-primary">Actualizar</button><button class="btn-action btn-secondary">Cancelar</button></fieldset>`;
    } else {
        return `<fieldset><legend>Eliminar Evento</legend>
            <div class="table-container"><table><thead><tr><th>ID</th><th>Nombre</th><th>Fecha</th><th>Lugar</th></tr></thead>
            <tbody><tr><td>E001</td><td>Evento Ejemplo</td><td>2026-02-20</td><td>Salón Principal</td></tr></tbody></table></div>
            <br><button class="btn-action btn-danger">Eliminar Seleccionado</button></fieldset>`;
    }
}

function generarFormularioUsuarios(operacion) {
    if (operacion === 'registrar') {
        return `<fieldset><legend>Registrar Usuario</legend>
            <div class="form-grid">
                <div class="form-group"><label>Nombre Completo</label><input type="text" placeholder="Nombre completo"></div>
                <div class="form-group"><label>Email</label><input type="email" placeholder="correo@ejemplo.com"></div>
                <div class="form-group"><label>Rol</label><select><option value="administrador">Administrador</option><option value="moderador">Moderador</option><option value="consultor" selected>Consultor</option></select></div>
                <div class="form-group"><label>Contraseña</label><input type="password" placeholder="••••••••"></div>
            </div>
            <br><button class="btn-action btn-primary">Guardar</button><button class="btn-action btn-secondary">Cancelar</button></fieldset>`;
    } else if (operacion === 'modificar') {
        return `<fieldset><legend>Modificar Usuario</legend>
            <div class="form-grid">
                <div class="form-group"><label>Nombre</label><input type="text" value="eventos de primera"></div>
                <div class="form-group"><label>Email</label><input type="email" value="eventosdprimera@gmail.com"></div>
                <div class="form-group"><label>Rol</label><select><option value="administrador" selected>Administrador</option><option value="moderador">Moderador</option><option value="consultor">Consultor</option></select></div>
            </div>
            <br><button class="btn-action btn-primary">Actualizar</button><button class="btn-action btn-secondary">Cancelar</button></fieldset>`;
    } else {
        return `<fieldset><legend>Eliminar Usuario</legend>
            <div class="table-container"><table><thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th></tr></thead>
            <tbody><tr><td>06b7b932...</td><td>eventos de primera</td><td>eventosdprimera@gmail.com</td><td>administrador</td></tr></tbody></table></div>
            <br><button class="btn-action btn-danger">Eliminar Seleccionado</button></fieldset>`;
    }
}

function generarFormularioReportes(operacion) {
    if (operacion === 'registrar') {
        return `<fieldset><legend>Registrar Reporte</legend>
            <div class="form-grid">
                <div class="form-group"><label>Tipo</label><select><option>Inventario</option><option>Ventas</option><option>Eventos</option></select></div>
                <div class="form-group"><label>Periodo</label><input type="month"></div>
            </div>
            <div class="form-group"><label>Descripción</label><textarea rows="3" placeholder="Detalles del reporte..."></textarea></div>
            <br><button class="btn-action btn-primary">Generar</button><button class="btn-action btn-secondary">Cancelar</button></fieldset>`;
    } else if (operacion === 'modificar') {
        return `<fieldset><legend>Modificar Reporte</legend>
            <div class="form-group"><label>Seleccionar Reporte</label><select><option>Reporte #001</option></select></div>
            <div class="form-grid">
                <div class="form-group"><label>Tipo</label><select><option>Inventario</option><option>Ventas</option><option>Eventos</option></select></div>
                <div class="form-group"><label>Periodo</label><input type="month"></div>
            </div>
            <br><button class="btn-action btn-primary">Actualizar</button><button class="btn-action btn-secondary">Cancelar</button></fieldset>`;
    } else {
        return `<fieldset><legend>Eliminar Reporte</legend>
            <div class="table-container"><table><thead><tr><th>ID</th><th>Tipo</th><th>Periodo</th><th>Fecha</th></tr></thead>
            <tbody><tr><td>R001</td><td>Inventario</td><td>Enero 2026</td><td>2026-01-31</td></tr></tbody></table></div>
            <br><button class="btn-action btn-danger">Eliminar Seleccionado</button></fieldset>`;
    }
}

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
            await supabaseClient.from('sesiones_activas').update({ last_activity: new Date().toISOString() }).eq('email', email);
        } catch (err) { console.error('Error en heartbeat:', err); }
    }, 120000);
}

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

iniciarDashboard();
