// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let heartbeatInterval = null;

// Verificar sesión al cargar
async function iniciarDashboard() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    
    // Mostrar información del usuario
    document.getElementById('usuarioNombre').textContent = session.user.email.split('@')[0];
    document.getElementById('usuarioEmail').textContent = session.user.email;
    document.getElementById('userId').textContent = session.user.id;
    document.getElementById('userEmailDetail').textContent = session.user.email;
    
    // Formatear fecha de último login
    if (session.user.last_sign_in_at) {
        const fecha = new Date(session.user.last_sign_in_at);
        document.getElementById('lastSignIn').textContent = fecha.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Iniciar heartbeat para mantener la sesión activa
    iniciarHeartbeat(session.user.email);
}

// Heartbeat: actualizar last_activity cada 2 minutos
function iniciarHeartbeat(email) {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    
    heartbeatInterval = setInterval(async () => {
        try {
            await supabase
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
        // Obtener sesión actual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            // Eliminar registro de sesión activa
            await supabase
                .from('sesiones_activas')
                .delete()
                .eq('email', session.user.email);
        }
        
        // Detener heartbeat
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
        }
        
        // Cerrar sesión de Supabase Auth
        await supabase.auth.signOut();
        
        // Limpiar localStorage
        localStorage.removeItem('session');
        
        // Redirigir al login
        window.location.href = 'index.html';
        
    } catch (err) {
        console.error('Error al cerrar sesión:', err);
        btn.disabled = false;
        btn.textContent = 'Cerrar Sesión';
    }
});

// Detectar cierre de navegador/pestaña
window.addEventListener('beforeunload', async () => {
    const sessionStr = localStorage.getItem('session');
    if (sessionStr) {
        try {
            const session = JSON.parse(sessionStr);
            const email = session.user?.email;
            if (email) {
                await supabase
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
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
        window.location.href = 'index.html';
    }
});

// Iniciar dashboard
iniciarDashboard();
