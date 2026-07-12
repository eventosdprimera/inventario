// js/registro.js
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let codigoBarrasActual = null;
let fotoSeleccionada = null;
let usuarioActual = null;

// Inicializar el formulario de registro
async function inicializarRegistroEquipo() {
    await generarCodigoBarras();
}

// Generar código de barras único
async function generarCodigoBarras() {
    try {
        // Verificar si ya existe un código en sessionStorage (para no perderlo al recargar)
        const codigoGuardado = sessionStorage.getItem('codigoBarrasPendiente');
        
        if (codigoGuardado) {
            // Usar el código guardado
            codigoBarrasActual = codigoGuardado;
            document.getElementById('codigoBarrasValor').textContent = codigoBarrasActual;
            
            JsBarcode("#barcode", codigoBarrasActual, {
                format: "CODE128",
                width: 2,
                height: 60,
                displayValue: true,
                fontSize: 14,
                margin: 5,
                font: "Courier New",
                fontOptions: "bold"
            });
            
            document.getElementById('btnImprimir').disabled = false;
            return;
        }
        
        // Generar nuevo código único
        let nuevoCodigo;
        let existe = true;
        let intentos = 0;
        const maxIntentos = 10;
        
        while (existe && intentos < maxIntentos) {
            // Formato: EP-YYYYMMDD-HHMMSS-XXXXXX
            const ahora = new Date();
            const fechaParte = ahora.toISOString().slice(0,10).replace(/-/g,'');
            const horaParte = ahora.toTimeString().slice(0,8).replace(/:/g,'');
            const randomParte = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
            
            nuevoCodigo = `EP-${fechaParte}-${horaParte}-${randomParte}`;
            
            // Verificar si ya existe en la base de datos
            const { data, error } = await supabaseClient
                .from('equipos')
                .select('codigo_barras')
                .eq('codigo_barras', nuevoCodigo)
                .single();
            
            if (error || !data) {
                existe = false;
            } else {
                intentos++;
            }
        }
        
        if (existe) {
            throw new Error('No se pudo generar un código único después de múltiples intentos');
        }
        
        codigoBarrasActual = nuevoCodigo;
        
        // Guardar en sessionStorage para que no se pierda
        sessionStorage.setItem('codigoBarrasPendiente', codigoBarrasActual);
        
        // Mostrar el código
        document.getElementById('codigoBarrasValor').textContent = codigoBarrasActual;
        
        // Generar código de barras visual
        JsBarcode("#barcode", codigoBarrasActual, {
            format: "CODE128",
            width: 2,
            height: 60,
            displayValue: true,
            fontSize: 14,
            margin: 5,
            font: "Courier New",
            fontOptions: "bold"
        });
        
        // Habilitar botón de imprimir
        document.getElementById('btnImprimir').disabled = false;
        
    } catch (err) {
        console.error('Error al generar código:', err);
        document.getElementById('codigoBarrasValor').textContent = 'Error al generar';
        mostrarMensaje('Error al generar el código de barras: ' + err.message, 'error');
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
        document.getElementById('fotoPreviewContainer').innerHTML = 
            `<img src="${e.target.result}" alt="Preview">`;
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
        
        // Limpiar sessionStorage del código
        sessionStorage.removeItem('codigoBarrasPendiente');
        
        // Deshabilitar botón de imprimir
        document.getElementById('btnImprimir').disabled = true;
        
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
        
        btnGuardar.textContent = '✅ Guardado';
        
        // Preguntar si quiere imprimir
        setTimeout(() => {
            if (confirm('¿Deseas imprimir el sticker del código de barras?')) {
                imprimirSticker();
            }
        }, 500);
        
    } catch (err) {
        console.error('Error al guardar:', err);
        mostrarMensaje('Error al guardar el equipo: ' + err.message, 'error');
        btnGuardar.disabled = false;
        btnGuardar.textContent = '💾 Guardar Equipo';
    }
}

// Imprimir sticker
function imprimirSticker() {
    if (!codigoBarrasActual) {
        alert('No hay código de barras generado');
        return;
    }
    
    const nombre = document.getElementById('nombreEquipo').value.trim() || 'Sin asignar';
    const marca = document.getElementById('marcaEquipo').value.trim() || '';
    const modelo = document.getElementById('modeloEquipo').value.trim() || '';
    const serial = document.getElementById('serialEquipo').value.trim() || '';
    
    // Generar código de barras en SVG
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = '<svg id="stickerBarcode"></svg>';
    document.body.appendChild(tempDiv);
    
    try {
        JsBarcode("#stickerBarcode", codigoBarrasActual, {
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
                <title>Sticker - ${codigoBarrasActual}</title>
                <style>
                    @page { size: 4in 2.5in; margin: 0.1in; }
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; padding: 5px; }
                    .sticker { border: 2px solid #000; padding: 8px; text-align: center; width: 100%; }
                    .empresa { font-size: 10px; font-weight: bold; color: #1e3a8a; margin-bottom: 4px; text-transform: uppercase; }
                    .nombre { font-size: 11px; font-weight: bold; margin: 4px 0; word-break: break-word; }
                    .barcode { margin: 6px 0; }
                    .barcode svg { max-width: 100%; height: auto; }
                    .info { font-size: 8px; color: #333; margin-top: 4px; line-height: 1.3; }
                    .codigo { font-size: 10px; font-weight: bold; margin-top: 4px; font-family: 'Courier New', monospace; }
                </style>
            </head>
            <body>
                <div class="sticker">
                    <div class="empresa">Eventos D' Primera</div>
                    <div class="nombre">${nombre}</div>
                    <div class="barcode">${barcodeSVG}</div>
                    <div class="codigo">${codigoBarrasActual}</div>
                    <div class="info">
                        ${marca}${modelo ? ' - ' + modelo : ''}<br>
                        ${serial ? 'S/N: ' + serial + '<br>' : ''}
                    </div>
                </div>
                <script>
                    window.onload = function() { setTimeout(function() { window.print(); }, 300); };
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
    if (!confirm('¿Estás seguro de limpiar el formulario? Se generará un NUEVO código de barras único.')) {
        return;
    }
    
    document.getElementById('formRegistro').reset();
    document.getElementById('fotoPreviewContainer').innerHTML = `
        <div class="foto-placeholder">
            <div class="foto-placeholder-icon"></div>
            <div>Sin foto</div>
        </div>
    `;
    fotoSeleccionada = null;
    window.equipoRegistrado = null;
    document.getElementById('mensaje').className = 'mensaje';
    document.getElementById('btnGuardar').disabled = false;
    document.getElementById('btnGuardar').textContent = '💾 Guardar Equipo';
    
    // Limpiar código anterior y generar nuevo
    sessionStorage.removeItem('codigoBarrasPendiente');
    codigoBarrasActual = null;
    document.getElementById('btnImprimir').disabled = true;
    
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
iniciarRegistroEquipo();
