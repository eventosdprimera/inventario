// js/registro.js
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let codigoBarrasActual = null;
let fotosSeleccionadas = [null, null, null, null]; // Array para 4 fotos
let usuarioActual = null;

// Inicializar el formulario de registro
async function inicializarRegistroEquipo() {
    await cargarUsuario();
    await generarCodigoBarras();
}

// Cargar datos del usuario actual
async function cargarUsuario() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            window.location.href = '../index.html';
            return;
        }
        
        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('email', session.user.email)
            .single();
        
        if (data && !error) {
            usuarioActual = data;
        } else {
            usuarioActual = { email: session.user.email, id: session.user.id, nombre: session.user.email.split('@')[0] };
        }
    } catch (err) {
        console.error('Error al cargar usuario:', err);
    }
}

// Generar código de barras único
async function generarCodigoBarras() {
    try {
        const codigoGuardado = sessionStorage.getItem('codigoBarrasPendiente');
        
        if (codigoGuardado) {
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
        
        let nuevoCodigo;
        let existe = true;
        let intentos = 0;
        const maxIntentos = 10;
        
        while (existe && intentos < maxIntentos) {
            const ahora = new Date();
            const fechaParte = ahora.toISOString().slice(0,10).replace(/-/g,'');
            const horaParte = ahora.toTimeString().slice(0,8).replace(/:/g,'');
            const randomParte = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
            
            nuevoCodigo = `EP-${fechaParte}-${horaParte}-${randomParte}`;
            
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
        sessionStorage.setItem('codigoBarrasPendiente', codigoBarrasActual);
        
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
        
    } catch (err) {
        console.error('Error al generar código:', err);
        document.getElementById('codigoBarrasValor').textContent = 'Error al generar';
        mostrarMensaje('Error al generar el código de barras: ' + err.message, 'error');
    }
}

// Previsualizar foto (1-4)
function previsualizarFoto(numero, event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        alert(`La foto ${numero} no debe superar los 5MB`);
        event.target.value = '';
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        alert(`Por favor selecciona un archivo de imagen válido para la foto ${numero}`);
        event.target.value = '';
        return;
    }
    
    fotosSeleccionadas[numero - 1] = file;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById(`preview${numero}`);
        const placeholder = document.getElementById(`preview${numero}-placeholder`);
        const removeBtn = document.getElementById(`remove${numero}`);
        
        preview.src = e.target.result;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        removeBtn.style.display = 'flex';
    };
    reader.readAsDataURL(file);
}

// Remover foto
function removerFoto(numero) {
    fotosSeleccionadas[numero - 1] = null;
    
    const preview = document.getElementById(`preview${numero}`);
    const placeholder = document.getElementById(`preview${numero}-placeholder`);
    const removeBtn = document.getElementById(`remove${numero}`);
    const input = document.getElementById(`foto${numero}`);
    
    preview.style.display = 'none';
    preview.src = '';
    placeholder.style.display = 'block';
    removeBtn.style.display = 'none';
    input.value = '';
}

// Verificar si el serial ya existe
async function verificarSerial(serial) {
    try {
        const { data, error } = await supabaseClient
            .from('equipos')
            .select('serial')
            .eq('serial', serial)
            .single();
        
        if (data && !error) {
            return true; // Ya existe
        }
        return false; // No existe
    } catch (err) {
        return false;
    }
}

// Guardar equipo
async function guardarEquipo() {
    const nombre = document.getElementById('nombreEquipo').value.trim();
    const marca = document.getElementById('marcaEquipo').value.trim();
    const modelo = document.getElementById('modeloEquipo').value.trim();
    const serial = document.getElementById('serialEquipo').value.trim();
    const medidaValor = document.getElementById('medidaValor').value;
    const medidaUnidad = document.getElementById('medidaUnidad').value;
    const costo = document.getElementById('costoEquipo').value;
    const observacion = document.getElementById('observacionEquipo').value.trim();
    const estatus = document.getElementById('estatusEquipo').value;
    
    // Validaciones
    if (!nombre || !marca || !serial || !costo || !estatus) {
        mostrarMensaje('Por favor completa todos los campos obligatorios (*)', 'error');
        return;
    }
    
    if (!codigoBarrasActual) {
        mostrarMensaje('Error: No hay código de barras generado', 'error');
        return;
    }
    
    // Verificar que al menos la foto 1 esté seleccionada
    if (!fotosSeleccionadas[0]) {
        mostrarMensaje('La Foto Principal es obligatoria', 'error');
        return;
    }
    
    // Verificar que el serial no exista
    const serialExiste = await verificarSerial(serial);
    if (serialExiste) {
        mostrarMensaje('El serial ya está registrado en el sistema. No se pueden repetir seriales.', 'error');
        return;
    }
    
    const btnGuardar = document.getElementById('btnGuardar');
    btnGuardar.disabled = true;
    btnGuardar.textContent = '💾 Guardando...';
    
    try {
        let fotoUrls = [null, null, null, null];
        
        // Subir fotos
        for (let i = 0; i < 4; i++) {
            if (fotosSeleccionadas[i]) {
                const fileExt = fotosSeleccionadas[i].name.split('.').pop();
                const fileName = `${codigoBarrasActual}_foto${i+1}_${Date.now()}.${fileExt}`;
                const filePath = `equipos/${fileName}`;
                
                const { error: uploadError } = await supabaseClient.storage
                    .from('equipos-fotos')
                    .upload(filePath, fotosSeleccionadas[i]);
                
                if (uploadError) throw uploadError;
                fotoUrls[i] = filePath;
            }
        }
        
        // Insertar equipo
        const { data, error } = await supabaseClient
            .from('equipos')
            .insert({
                codigo_barras: codigoBarrasActual,
                nombre_equipo: nombre,
                marca: marca,
                modelo: modelo || null,
                serial: serial,
                medida_valor: medidaValor || 0,
                medida_unidad: medidaUnidad,
                costo: costo,
                observacion: observacion || null,
                estatus: estatus,
                foto_url: fotoUrls[0],
                foto2_url: fotoUrls[1],
                foto3_url: fotoUrls[2],
                foto4_url: fotoUrls[3],
                usuario_registro: usuarioActual?.email || 'unknown',
                usuario_registro_id: usuarioActual?.id || null
            })
            .select()
            .single();
        
        if (error) {
            if (error.code === '23505') {
                throw new Error('El serial ya está registrado en el sistema');
            }
            throw error;
        }
        
        mostrarMensaje('✅ Equipo registrado exitosamente con código: ' + codigoBarrasActual, 'exito');
        
        sessionStorage.removeItem('codigoBarrasPendiente');
        document.getElementById('btnImprimir').disabled = true;
        
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
    
    // Limpiar fotos
    for (let i = 1; i <= 4; i++) {
        fotosSeleccionadas[i - 1] = null;
        const preview = document.getElementById(`preview${i}`);
        const placeholder = document.getElementById(`preview${i}-placeholder`);
        const removeBtn = document.getElementById(`remove${i}`);
        const input = document.getElementById(`foto${i}`);
        
        preview.style.display = 'none';
        preview.src = '';
        placeholder.style.display = 'block';
        removeBtn.style.display = 'none';
        input.value = '';
    }
    
    window.equipoRegistrado = null;
    document.getElementById('mensaje').className = 'mensaje';
    document.getElementById('btnGuardar').disabled = false;
    document.getElementById('btnGuardar').textContent = '💾 Guardar Equipo';
    
    sessionStorage.removeItem('codigoBarrasPendiente');
    codigoBarrasActual = null;
    document.getElementById('btnImprimir').disabled = true;
    
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
inicializarRegistroEquipo();
