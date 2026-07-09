// Inicializar Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let heartbeatInterval = null;
let currentUserRol = 'consultor';

// Verificar sesión al cargar
async function iniciarDashboard() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    
    // Mostrar información del usuario
    document.getElementById('usuarioNombre').textContent = session.user.email.split('@')[0];
    document.getElementById('usuarioEmail').textContent = session.user.email;
    
    // Obtener rol del usuario
    await cargarRolUsuario(session.user.email);
    
    // Iniciar heartbeat
    iniciarHeartbeat(session.user.email);
    
    // Configurar menú
    configurarMenu();
}

// Cargar rol del usuario
async function cargarRolUsuario(email) {
    try {
        const { data, error } = await supabaseClient
            .from('roles_usuario')
            .select('rol')
            .eq('email', email)
            .single();
        
        if (data && !error) {
            currentUserRol = data.rol;
        } else {
            currentUserRol = 'consultor';
        }
        
        // Mostrar rol con estilo
        const rolElement = document.getElementById('usuarioRol');
        rolElement.textContent = currentUserRol;
        rolElement.className = `usuario-rol rol-${currentUserRol}`;
        
    } catch (err) {
        console.error('Error al cargar rol:', err);
        currentUserRol = 'consultor';
        const rolElement = document.getElementById('usuarioRol');
        rolElement.textContent = 'consultor';
        rolElement.className = 'usuario-rol rol-consultor';
    }
}

// Configurar menú lateral
function configurarMenu() {
    const menuBtns = document.querySelectorAll('.menu-btn');
    
    menuBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const menuName = btn.dataset.menu;
            const submenu = document.getElementById(`submenu-${menuName}`);
            
            // Cerrar otros submenús
            document.querySelectorAll('.submenu').forEach(sm => {
                if (sm.id !== `submenu-${menuName}`) {
                    sm.classList.remove('open');
                }
            });
            
            document.querySelectorAll('.menu-btn').forEach(mb => {
                if (mb !== btn) {
                    mb.classList.remove('active');
                }
            });
            
            // Toggle menú actual
            btn.classList.toggle('active');
            submenu.classList.toggle('open');
        });
    });
    
    // Configurar botones de submenú
    const submenuBtns = document.querySelectorAll('.submenu-btn');
    submenuBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover active de todos
            submenuBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Cargar contenido
            const action = btn.dataset.action;
            cargarContenido(action);
        });
    });
}

// Cargar contenido dinámico
function cargarContenido(action) {
    const [modulo, operacion] = action.split('-');
    const contenidoDiv = document.getElementById('contenidoDinamico');
    
    let html = '';
    
    switch(modulo) {
        case 'consulta':
            html = generarFormularioConsulta(operacion);
            break;
        case 'productos':
            html = generarFormularioProductos(operacion);
            break;
        case 'eventos':
            html = generarFormularioEventos(operacion);
            break;
        case 'usuarios':
            html = generarFormularioUsuarios(operacion);
            break;
        case 'reportes':
            html = generarFormularioReportes(operacion);
            break;
    }
    
    contenidoDiv.innerHTML = html;
}

// Generar formularios para cada módulo
function generarFormularioConsulta(operacion) {
    if (operacion === 'registrar') {
        return `
            <fieldset>
                <legend>Registrar Consulta</legend>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Tipo de Consulta</label>
                        <select>
                            <option>General</option>
                            <option>Específica</option>
                            <option>Urgente</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Fecha</label>
                        <input type="date">
                    </div>
                </div>
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea rows="4" placeholder="Describe la consulta..."></textarea>
                </div>
                <br>
                <button class="btn-action btn-primary">Guardar</button>
                <button class="btn-action btn-secondary">Cancelar</button>
            </fieldset>
        `;
    } else if (operacion === 'modificar') {
        return `
            <fieldset>
                <legend>Modificar Consulta</legend>
                <div class="form-group">
                    <label>Seleccionar Consulta</label>
                    <select>
                        <option>Consulta #001</option>
                        <option>Consulta #002</option>
                        <option>Consulta #003</option>
                    </select>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Tipo de Consulta</label>
                        <select>
                            <option>General</option>
                            <option>Específica</option>
                            <option>Urgente</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Fecha</label>
                        <input type="date">
                    </div>
                </div>
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea rows="4"></textarea>
                </div>
                <br>
                <button class="btn-action btn-primary">Actualizar</button>
                <button class="btn-action btn-secondary">Cancelar</button>
            </fieldset>
        `;
    } else {
        return `
            <fieldset>
                <legend>Eliminar Consulta</legend>
                <div class="form-group">
                    <label>Seleccionar Consulta a Eliminar</label>
                    <select>
                        <option>Consulta #001</option>
                        <option>Consulta #002</option>
                        <option>Consulta #003</option>
                    </select>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tipo</th>
                                <th>Fecha</th>
                                <th>Descripción</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>001</td>
                                <td>General</td>
                                <td>2026-01-15</td>
                                <td>Consulta sobre inventario</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <br>
                <button class="btn-action btn-danger">Eliminar Seleccionado</button>
            </fieldset>
        `;
    }
}

function generarFormularioProductos(operacion) {
    if (operacion === 'registrar') {
        return `
            <fieldset>
                <legend>Registrar Producto</legend>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Nombre del Producto</label>
                        <input type="text" placeholder="Nombre del producto">
                    </div>
                    <div class="form-group">
                        <label>Código</label>
                        <input type="text" placeholder="Código único">
                    </div>
                    <div class="form-group">
                        <label>Cantidad</label>
                        <input type="number" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label>Precio</label>
                        <input type="number" step="0.01" placeholder="0.00">
                    </div>
                </div>
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea rows="3" placeholder="Descripción del producto..."></textarea>
                </div>
                <br>
                <button class="btn-action btn-primary">Guardar</button>
                <button class="btn-action btn-secondary">Cancelar</button>
            </fieldset>
        `;
    } else if (operacion === 'modificar') {
        return `
            <fieldset>
                <legend>Modificar Producto</legend>
                <div class="form-group">
                    <label>Seleccionar Producto</label>
                    <select>
                        <option>Producto #001</option>
                        <option>Producto #002</option>
                    </select>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Nombre del Producto</label>
                        <input type="text">
                    </div>
                    <div class="form-group">
                        <label>Código</label>
                        <input type="text">
                    </div>
                    <div class="form-group">
                        <label>Cantidad</label>
                        <input type="number">
                    </div>
                    <div class="form-group">
                        <label>Precio</label>
                        <input type="number" step="0.01">
                    </div>
                </div>
                <br>
                <button class="btn-action btn-primary">Actualizar</button>
                <button class="btn-action btn-secondary">Cancelar</button>
            </fieldset>
        `;
    } else {
        return `
            <fieldset>
                <legend>Eliminar Producto</legend>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Nombre</th>
                                <th>Cantidad</th>
                                <th>Precio</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>P001</td>
                                <td>Producto Ejemplo</td>
                                <td>10</td>
                                <td>$50.00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <br>
                <button class="btn-action btn-danger">Eliminar Seleccionado</button>
            </fieldset>
        `;
    }
}

function generarFormularioEventos(operacion) {
    if (operacion === 'registrar') {
        return `
            <fieldset>
                <legend>Registrar Evento</legend>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Nombre del Evento</label>
                        <input type="text" placeholder="Nombre del evento">
                    </div>
                    <div class="form-group">
                        <label>Fecha</label>
                        <input type="date">
                    </div>
                    <div class="form-group">
                        <label>Lugar</label>
                        <input type="text" placeholder="Ubicación">
                    </div>
                    <div class="form-group">
                        <label>Capacidad</label>
                        <input type="number" placeholder="0">
                    </div>
                </div>
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea rows="3" placeholder="Descripción del evento..."></textarea>
                </div>
                <br>
                <button class="btn-action btn-primary">Guardar</button>
                <button class="btn-action btn-secondary">Cancelar</button>
            </fieldset>
        `;
    } else if (operacion === 'modificar') {
        return `
            <fieldset>
                <legend>Modificar Evento</legend>
                <div class="form-group">
                    <label>Seleccionar Evento</label>
                    <select>
                        <option>Evento #001</option>
                        <option>Evento #002</option>
                    </select>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Nombre del Evento</label>
                        <input type="text">
                    </div>
                    <div class="form-group">
                        <label>Fecha</label>
                        <input type="date">
                    </div>
                </div>
                <br>
                <button class="btn-action btn-primary">Actualizar</button>
                <button class="btn-action btn-secondary">Cancelar</button>
            </fieldset>
        `;
    } else {
        return `
            <fieldset>
                <legend>Eliminar Evento</legend>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Fecha</th>
                                <th>Lugar</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>E001</td>
                                <td>Evento Ejemplo</td>
                                <td>2026-02-20</td>
                                <td>Salón Principal</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <br>
                <button class="btn-action btn-danger">Eliminar Seleccionado</button>
            </fieldset>
        `;
    }
}

function generarFormularioUsuarios(operacion) {
    if (operacion === 'registrar') {
        return `
            <fieldset>
                <legend>Registrar Usuario</legend>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Nombre Completo</label>
                        <input type="text" placeholder="Nombre completo">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" placeholder="correo@ejemplo.com">
                    </div>
                    <div class="form-group">
                        <label>Rol</label>
                        <select>
                            <option value="administrador">Administrador</option>
                            <option value="moderador">Moderador</option>
                            <option value="consultor">Consultor</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Contraseña</label>
                        <input type="password" placeholder="••••••••">
                    </div>
                </div>
                <br>
                <button class="btn-action btn-primary">Guardar</button>
                <button class="btn-action btn-secondary">Cancelar</button>
            </fieldset>
        `;
    } else if (operacion === 'modificar') {
        return `
            <fieldset>
                <legend>Modificar Usuario</legend>
                <div class="form-group">
                    <label>Seleccionar Usuario</label>
                    <select>
                        <option>Usuario #001</option>
                        <option>Usuario #002</option>
                    </select>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Nombre Completo</label>
                        <input type="text">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email">
                    </div>
                    <div class="form-group">
                        <label>Rol</label>
                        <select>
                            <option value="administrador">Administrador</option>
                            <option value="moderador">Moderador</option>
                            <option value="consultor">Consultor</option>
                        </select>
                    </div>
                </div>
                <br>
                <button class="btn-action btn-primary">Actualizar</button>
                <button class="btn-action btn-secondary">Cancelar</button>
            </fieldset>
        `;
    } else {
        return `
            <fieldset>
                <legend>Eliminar Usuario</legend>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Rol</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>U001</td>
                                <td>Usuario Ejemplo</td>
                                <td>ejemplo@correo.com</td>
                                <td>Consultor</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <br>
                <button class="btn-action btn-danger">Eliminar Seleccionado</button>
            </fieldset>
        `;
    }
}

function generarFormularioReportes(operacion) {
    if (operacion === 'registrar') {
        return `
            <fieldset>
                <legend>Registrar Reporte</legend>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Tipo de Reporte</label>
                        <select>
                            <option>Inventario</option>
                            <option>Ventas</option>
                            <option>Eventos</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Periodo</label>
                        <input type="month">
                    </div>
                </div>
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea rows="3" placeholder="Detalles del reporte..."></textarea>
                </div>
                <br>
                <button class="btn-action btn-primary">Generar</button>
                <button class="btn-action btn-secondary">Cancelar</button>
            </fieldset>
        `;
    } else if (operacion === 'modificar') {
        return `
            <fieldset>
                <legend>Modificar Reporte</legend>
                <div class="form-group">
                    <label>Seleccionar Reporte</label>
                    <select>
                        <option>Reporte #001</option>
                        <option>Reporte #002</option>
                    </select>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Tipo de Reporte</label>
                        <select>
                            <option>Inventario</option>
                            <option>Ventas</option>
                            <option>Eventos</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Periodo</label>
                        <input type="month">
                    </div>
                </div>
                <br>
                <button class="btn-action btn-primary">Actualizar</button>
                <button class="btn-action btn-secondary">Cancelar</button>
            </fieldset>
        `;
    } else {
        return `
            <fieldset>
                <legend>Eliminar Reporte</legend>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tipo</th>
                                <th>Periodo</th>
                                <th>Fecha Generación</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>R001</td>
                                <td>Inventario</td>
                                <td>Enero 2026</td>
                                <td>2026-01-31</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <br>
                <button class="btn-action btn-danger">Eliminar Seleccionado</button>
            </fieldset>
        `;
    }
}

// Heartbeat
function iniciarHeartbeat(email) {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    
    heartbeatInterval = setInterval(async () => {
        try {
            await supabaseClient
                .from('sesiones_activas')
                .update({ last_activity: new Date().toISOString() })
                .eq('email', email);
        } catch (err) {
            console.error('Error en heartbeat:', err);
        }
    }, 120000);
}

// Cerrar sesión
document.getElementById('btnLogout').addEventListener('click', async () => {
    const btn = document.getElementById('btnLogout');
    btn.disabled = true;
    btn.textContent = 'Cerrando...';
    
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
            await supabaseClient
                .from('sesiones_activas')
                .delete()
                .eq('email', session.user.email);
        }
        
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
        }
        
        await supabaseClient.auth.signOut();
        localStorage.removeItem('session');
        window.location.href = 'index.html';
        
    } catch (err) {
        console.error('Error al cerrar sesión:', err);
        btn.disabled = false;
        btn.textContent = 'Cerrar Sesión';
    }
});

// Detectar cierre de navegador
window.addEventListener('beforeunload', async () => {
    const sessionStr = localStorage.getItem('session');
    if (sessionStr) {
        try {
            const session = JSON.parse(sessionStr);
            const email = session.user?.email;
            if (email) {
                await supabaseClient
                    .from('sesiones_activas')
                    .delete()
                    .eq('email', email);
            }
        } catch (err) {
            console.error('Error al cerrar sesión:', err);
        }
    }
});

// Escuchar cambios de autenticación
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
        window.location.href = 'index.html';
    }
});

// Iniciar dashboard
iniciarDashboard();
