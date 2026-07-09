// Inicializar Supabase usando las credenciales de config.js
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Manejar el envío del formulario
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const mensajeDiv = document.getElementById('mensaje');
    
    // Limpiar mensaje anterior
    mensajeDiv.className = 'mensaje';
    mensajeDiv.textContent = '';
    
    try {
        // Intentar iniciar sesión con Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            mostrarMensaje('Error: Usuario o contraseña incorrectos', 'error');
            console.error('Error de login:', error);
            return;
        }
        
        if (data.session) {
            mostrarMensaje('¡Inicio de sesión exitoso!', 'exito');
            
            // Guardar sesión en localStorage
            localStorage.setItem('session', JSON.stringify(data.session));
            
            // Redirigir después de 1 segundo
            setTimeout(() => {
                window.location.href = '../html/dashboard.html'; // Cambia esto a tu página principal
            }, 1000);
        }
        
    } catch (err) {
        mostrarMensaje('Error de conexión. Intenta nuevamente.', 'error');
        console.error('Error:', err);
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
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        window.location.href = '../html/dashboard.html';
    }
}

// Verificar sesión al cargar la página
verificarSesion();
