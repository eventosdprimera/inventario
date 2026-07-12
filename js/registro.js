// Inicializar Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let codigoBarrasActual = null;
let fotoSeleccionada = null;
let usuarioActual = null;

// Iniciar página
async function iniciarRegistro() {
    // Verificar sesión
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    
    // Cargar datos del usuario
    await cargarUsuario(session.user.email);
    
    // Generar código de barras automáticamente
    await generarCodigoBarras();
}

// Cargar datos del usuario actual
async function cargarUsuario(email) {
    try {
        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();
        
        if (data && !error) {
            usuarioActual = data;
        } else {
            usuarioActual = { email: email, id: null, nombre: email.split('@')[0] };
        }
    } catch (err) {
        console.error('Error al cargar usuario:', err);
        usuarioActual = { email: email, id: null, nombre: email.split('@')[0] };
    }
}

// Generar código de barras único
async function generarCodigoBarras() {
    try {
        const { data, error } = await supabaseClient.rpc('generar_codigo_barras');
        
        if (error) throw error;
        
        codigoBarrasActual = data;
        document.getElementById('codigoBarrasValor').textContent = data;
        
        // Generar código de barras visual
        JsBarcode("#barcode", data, {
            format: "CODE128",
            width: 2,
            height: 60,
            displayValue: true,
            fontSize: 14,
            margin: 5,
            font: "Courier New",
            fontOptions: "bold"
        });
        
    } catch (err) {
        console.error('Error al generar código:', err);
        document.getElementById('codigoBarrasValor').textContent = 'Error al generar';
        mostrarMensaje('Error al generar el código de barras', 'error');
    }
}

// Previsualizar foto
function previsualizarFoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB');
        event.target.value = '';
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        event.target.value = '';
        return;
    }
    
    fotoSeleccionada = file;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const container = document.getElementById('fotoPreviewContainer');
        container.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
}

// Guardar equipo
async function guardarEquipo() {
    const nombre = document.getElementById('nombreEquipo').value.trim();
    const marca = document.getElementById('marcaEquipo').value.trim();
    const modelo = document.getElementById('modeloEquipo').value.trim();
    const serial = document.getElementById('serialEquipo').value.trim();
    const metros = document.getElementById('metrosEquipo').value;
    const costo = document.getElementById('costoEquipo').value;
    const observacion = document.getElementById('observacionEquipo').value.trim();
    const estatus = document.getElementById('estatusEquipo').value;
    
    // Validaciones
    if (!nombre || !marca || !costo || !estatus) {
        mostrarMensaje('Por favor completa todos los campos obligatorios (*)', 'error');
        return;
    }
    
    if (!codigoBarrasActual) {
        mostrarMensaje('Error: No hay código de barras generado', 'error');
        return;
    }
    
    const btnGuardar = document.getElementById('btnGuardar');
    btnGuardar.disabled = true;
    btnGuardar.textContent = '💾 Guardando...';
    
    try {
        let fotoUrl = null;
        
        // Subir foto si existe
        if (fotoSeleccionada) {
            const fileExt = fotoSeleccionada.name.split('.').pop();
            const fileName = `${codigoBarrasActual}_${Date.now()}.${fileExt}`;
            const filePath = `equipos/${fileName}`;
            
            const { error: uploadError } = await supabaseClient.storage
                .from('equipos-fotos')
                .upload(filePath, fotoSeleccionada);
            
            if (uploadError) throw uploadError;
            fotoUrl = filePath;
        }
        
        // Insertar equipo en la base de datos
        const { data, error } = await supabaseClient
            .from('equipos')
            .insert({
                codigo_barras: codigoBarrasActual,
                nombre_equipo: nombre,
                marca: marca,
                modelo: modelo || null,
                serial: serial || null,
                metros: metros || 0,
                costo: costo,
                observacion: observacion || null,
                estatus: estatus,
                foto_url: fotoUrl,
                usuario_registro: usuarioActual?.email || 'unknown',
                usuario_registro_id: usuarioActual?.id || null
            })
            .select()
            .single();
        
        if (error) throw error;
        
        mostrarMensaje('✅ Equipo registrado exitosamente con código: ' + codigoBarrasActual, 'exito');
        
        // Habilitar botón de imprimir
        document.getElementById('btnImprimir').disabled = false;
        
        // Guardar datos para imprimir
        window.equipoRegistrado = {
            codigo_barras: codigoBarrasActual,
            nombre_equipo: nombre,
            marca: marca,
            modelo: modelo,
            serial: serial,
            estatus: estatus,
            fecha_registro: data.fecha_registro
        };
        
    } catch (err) {
        console.error('Error al guardar:', err);
        mostrarMensaje('Error al guardar el equipo: ' + err.message, 'error');
        btnGuardar.disabled = false;
        btnGuardar.textContent = '💾 Guardar Equipo';
    }
}

// Imprimir sticker
function imprimirSticker() {
    if (!window.equipoRegistrado) {
        alert('Primero debes guardar un equipo');
        return;
    }
    
    const eq = window.equipoRegistrado;
    const fecha = new Date(eq.fecha_registro).toLocaleDateString('es-ES');
    
    // Generar código de barras en SVG
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = '<svg id="stickerBarcode"></svg>';
    document.body.appendChild(tempDiv);
    
    try {
        JsBarcode("#stickerBarcode", eq.codigo_barras, {
            format: "CODE128",
            width: 1.5,
            height: 40,
            displayValue: true,
            fontSize: 12,
            margin: 2,
            font: "Courier New"
        });
        
        const barcodeSVG = tempDiv.querySelector('svg').outerHTML;
        document.body.removeChild(tempDiv);
        
        // Crear ventana de impresión
        const ventana = window.open('', '_blank', 'width=600,height=500');
        
        ventana.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Sticker - ${eq.codigo_barras}</title>
                <style>
                    @page { 
                        size: 4in 2.5in; 
                        margin: 0.1in; 
                    }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 5px;
                    }
                    .sticker {
                        border: 2px solid #000;
                        padding: 8px;
                        text-align: center;
                        width: 100%;
                    }
                    .empresa {
                        font-size: 10px;
                        font-weight: bold;
                        color: #1e3a8a;
                        margin-bottom: 4px;
                        text-transform: uppercase;
                    }
                    .nombre {
                        font-size: 11px;
                        font-weight: bold;
                        margin: 4px 0;
                        word-break: break-word;
                    }
                    .barcode {
                        margin: 6px 0;
                    }
                    .barcode svg {
                        max-width: 100%;
                        height: auto;
                    }
                    .info {
                        font-size: 8px;
                        color: #333;
                        margin-top: 4px;
                        line-height: 1.3;
                    }
                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="sticker">
                    <div class="empresa">Eventos D' Primera</div>
                    <div class="nombre">${eq.nombre_equipo}</div>
                    <div class="barcode">${barcodeSVG}</div>
                    <div class="info">
                        ${eq.marca}${eq.modelo ? ' - ' + eq.modelo : ''}<br>
                        ${eq.serial ? 'S/N: ' + eq.serial + '<br>' : ''}
                        Reg: ${fecha}
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() { window.print(); }, 300);
                    };
                <\/script>
            </body>
            </html>
        `);
        
        ventana.document.close();
        
    } catch (err) {
        console.error('Error al generar sticker:', err);
        alert('Error al generar el sticker');
        if (document.body.contains(tempDiv)) {
            document.body.removeChild(tempDiv);
        }
    }
}

// Limpiar formulario
function limpiarFormulario() {
    if (!confirm('¿Estás seguro de limpiar el formulario? Se generará un nuevo código de barras.')) {
        return;
    }
    
    document.getElementById('formRegistro').reset();
    document.getElementById('fotoPreviewContainer').innerHTML = `
        <div class="foto-placeholder" id="fotoPlaceholder">
            <div class="foto-placeholder-icon">📷</div>
            <div>Sin foto</div>
        </div>
    `;
    fotoSeleccionada = null;
    window.equipoRegistrado = null;
    document.getElementById('btnImprimir').disabled = true;
    document.getElementById('mensaje').className = 'mensaje';
    document.getElementById('btnGuardar').disabled = false;
    document.getElementById('btnGuardar').textContent = '💾 Guardar Equipo';
    
    // Generar nuevo código
    generarCodigoBarras();
}

// Mostrar mensajes
function mostrarMensaje(texto, tipo) {
    const mensajeDiv = document.getElementById('mensaje');
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `mensaje ${tipo}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Iniciar al cargar
iniciarRegistro();
