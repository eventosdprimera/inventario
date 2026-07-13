// Inicializar Supabase usando las credenciales de config.js
let heartbeatInterval = null;

// Manejar el envío del formulario
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btnLogin = document.querySelector('.btn-login');
    
    // Deshabilitar botón mientras procesa
    btnLogin.disabled = true;
    btnLogin.textContent = 'Verificando...';
    
    try {
        // PASO 1: Verificar si ya existe una sesión activa para este email
        const { data: sesionExistente, error: errorVerificacion } = await supabaseClient
            .from('sesiones_activas')
            .select('*')
            .eq('email', email)
            .single();
        
        if (sesionExistente && !errorVerificacion) {
            // Verificar si la sesión está expirada (más de 30 minutos sin actividad)
            const ultimaActividad = new Date(sesionExistente.last_activity);
            const ahora = new Date();
            const diferenciaMinutos = (ahora - ultimaActividad) / 1000 / 60;
            
            if (diferenciaMinutos < 30) {
                mostrarMensaje('⚠️ Este usuario ya tiene una sesión activa. Cierra la otra sesión o espera 30 minutos.', 'error');
                btnLogin.disabled = false;
                btnLogin.textContent = 'Iniciar Sesión';
                return;
            } else {
                // Sesión expirada, eliminarla
                await supabaseClient
                    .from('sesiones_activas')
                    .delete()
                    .eq('email', email);
            }
        }
        
        // PASO 2: Intentar iniciar sesión con Supabase Auth
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            mostrarMensaje('Error: Usuario o contraseña incorrectos', 'error');
            btnLogin.disabled = false;
            btnLogin.textContent = 'Iniciar Sesión';
            return;
        }
        
        if (data.session) {
            // PASO 3: Registrar la nueva sesión activa
            await supabaseClient
                .from('sesiones_activas')
                .upsert({
                    user_id: data.session.user.id,
                    email: email,
                    session_token: data.session.access_token,
                    last_activity: new Date().toISOString()
                });
            
            // Guardar sesión en localStorage
            localStorage.setItem('session', JSON.stringify(data.session));
            
            mostrarMensaje('¡Inicio de sesión exitoso!', 'exito');
            
            // Iniciar heartbeat
            iniciarHeartbeat(email);
            
            // Redirigir después de 1 segundo
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
        
    } catch (err) {
        mostrarMensaje('Error de conexión. Intenta nuevamente.', 'error');
        console.error('Error:', err);
        btnLogin.disabled = false;
        btnLogin.textContent = 'Iniciar Sesión';
    }
});

// Heartbeat: actualizar last_activity cada 2 minutos
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
    }, 120000); // Cada 2 minutos
}

// Detectar cierre de navegador/pestaña
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

// Función para mostrar mensajes
function mostrarMensaje(texto, tipo) {
    const mensajeDiv = document.getElementById('mensaje');
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `mensaje ${tipo}`;
}

// Verificar si ya hay una sesión activa
async function verificarSesion() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        window.location.href = 'dashboard.html';
    }
}

// Verificar sesión al cargar la página
verificarSesion();
