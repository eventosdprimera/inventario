// js/registro.js
// NO se ejecuta automáticamente. Las funciones se llaman desde dashboard.js

let codigoBarrasActual = null;
let fotosSeleccionadas = [null, null, null, null];
let usuarioActual = null;

// Función principal de inicialización (llamada desde dashboard.js)
async function inicializarRegistroEquipo() {
    console.log('Inicializando registro de equipo...');
    
    // Esperar a que JsBarcode esté disponible
    if (typeof JsBarcode === 'undefined') {
        console.log('Esperando JsBarcode...');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (typeof JsBarcode === 'undefined') {
            console.error('JsBarcode no está disponible');
            mostrarMensajeRegistro('Error: No se pudo cargar el generador de códigos de barras', 'error');
            return;
        }
    }
    
    await cargarUsuario();
    await generarCodigoBarras();
}

// Cargar datos del usuario
async function cargarUsuario() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;
        
        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('email', session.user.email)
            .single();
        
        if (data && !error) {
            usuarioActual = data;
        } else {
            usuarioActual = { email: session.user.email, id: session.user.id };
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
            
            const btnImprimir = document.getElementById('btnImprimir');
            if (btnImprimir) btnImprimir.disabled = false;
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
            throw new Error('No se pudo generar un código único');
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
        
        const btnImprimir = document.getElementById('btnImprimir');
        if (btnImprimir) btnImprimir.disabled = false;
        
    } catch (err) {
        console.error('Error al generar código:', err);
        document.getElementById('codigoBarrasValor').textContent = 'Error al generar';
        mostrarMensajeRegistro('Error al generar el código de barras: ' + err.message, 'error');
    }
}

// Previsualizar foto (llamada desde HTML con onclick)
window.previsualizarFoto = function(numero, event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        alert(`La foto ${numero} no debe superar los 5MB`);
        event.target.value = '';
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        alert(`Por favor selecciona un archivo de imagen válido`);
        event.target.value = '';
        return;
    }
    
    fotosSeleccionadas[numero - 1] = file;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById(`preview${numero}`);
        const placeholder = document.getElementById(`preview${numero}-placeholder`);
        const removeBtn = document.getElementById(`remove${numero}`);
        
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
        if (removeBtn) removeBtn.style.display = 'flex';
    };
    reader.readAsDataURL(file);
};

// Remover foto
window.removerFoto = function(numero) {
    fotosSeleccionadas[numero - 1] = null;
    
    const preview = document.getElementById(`preview${numero}`);
    const placeholder = document.getElementById(`preview${numero}-placeholder`);
    const removeBtn = document.getElementById(`remove${numero}`);
    const input = document.getElementById(`foto${numero}`);
    
    if (preview) { preview.style.display = 'none'; preview.src = ''; }
    if (placeholder) placeholder.style.display = 'block';
    if (removeBtn) removeBtn.style.display = 'none';
    if (input) input.value = '';
};

// Verificar serial único
async function verificarSerial(serial) {
    try {
        const { data, error } = await supabaseClient
            .from('equipos')
            .select('serial')
            .eq('serial', serial)
            .single();
        
        return data && !error;
    } catch (err) {
        return false;
    }
}

// Guardar equipo
window.guardarEquipo = async function() {
    const nombre = document.getElementById('nombreEquipo').value.trim();
    const marca = document.getElementById('marcaEquipo').value.trim();
    const modelo = document.getElementById('modeloEquipo').value.trim();
    const serial = document.getElementById('serialEquipo').value.trim();
    const medidaValor = document.getElementById('medidaValor').value;
    const medidaUnidad = document.getElementById('medidaUnidad').value;
    const costo = document.getElementById('costoEquipo').value;
    const observacion = document.getElementById('observacionEquipo').value.trim();
    const estatus = document.getElementById('estatusEquipo').value;
    
    if (!nombre || !marca || !serial || !costo || !estatus) {
        mostrarMensajeRegistro('Por favor completa todos los campos obligatorios (*)', 'error');
        return;
    }
    
    if (!codigoBarrasActual) {
        mostrarMensajeRegistro('Error: No hay código de barras generado', 'error');
        return;
    }
    
    if (!fotosSeleccionadas[0]) {
        mostrarMensajeRegistro('La Foto Principal es obligatoria', 'error');
        return;
    }
    
    const serialExiste = await verificarSerial(serial);
    if (serialExiste) {
        mostrarMensajeRegistro('El serial ya está registrado. No se pueden repetir seriales.', 'error');
        return;
    }
    
    const btnGuardar = document.getElementById('btnGuardar');
    btnGuardar.disabled = true;
    btnGuardar.textContent = '💾 Guardando...';
    
    try {
        let fotoUrls = [null, null, null, null];
        
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
                throw new Error('El serial ya está registrado');
            }
            throw error;
        }
        
        mostrarMensajeRegistro('✅ Equipo registrado con código: ' + codigoBarrasActual, 'exito');
        
        sessionStorage.removeItem('codigoBarrasPendiente');
        
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
            if (confirm('¿Imprimir el sticker del código de barras?')) {
                imprimirSticker();
            }
        }, 500);
        
    } catch (err) {
        console.error('Error al guardar:', err);
        mostrarMensajeRegistro('Error al guardar: ' + err.message, 'error');
        btnGuardar.disabled = false;
        btnGuardar.textContent = '💾 Guardar Equipo';
    }
};

// Imprimir sticker
window.imprimirSticker = function() {
    if (!codigoBarrasActual) {
        alert('No hay código de barras');
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
                    .empresa { font-size: 10px; font-weight: bold; color: #1e3a8a; margin-bottom: 4px; }
                    .nombre { font-size: 11px; font-weight: bold; margin: 4px 0; }
                    .barcode { margin: 6px 0; }
                    .barcode svg { max-width: 100%; height: auto; }
                    .info { font-size: 8px; color: #333; margin-top: 4px; }
                    .codigo { font-size: 10px; font-weight: bold; margin-top: 4px; font-family: monospace; }
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
                        ${serial ? 'S/N: ' + serial : ''}
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
        if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
    }
};

// Limpiar formulario
window.limpiarFormulario = function() {
    if (!confirm('¿Limpiar el formulario? Se generará un NUEVO código.')) return;
    
    document.getElementById('formRegistro').reset();
    
    for (let i = 1; i <= 4; i++) {
        fotosSeleccionadas[i - 1] = null;
        const preview = document.getElementById(`preview${i}`);
        const placeholder = document.getElementById(`preview${i}-placeholder`);
        const removeBtn = document.getElementById(`remove${i}`);
        const input = document.getElementById(`foto${i}`);
        
        if (preview) { preview.style.display = 'none'; preview.src = ''; }
        if (placeholder) placeholder.style.display = 'block';
        if (removeBtn) removeBtn.style.display = 'none';
        if (input) input.value = '';
    }
    
    window.equipoRegistrado = null;
    document.getElementById('mensaje').className = 'mensaje';
    document.getElementById('btnGuardar').disabled = false;
    document.getElementById('btnGuardar').textContent = '💾 Guardar Equipo';
    
    sessionStorage.removeItem('codigoBarrasPendiente');
    codigoBarrasActual = null;
    
    const btnImprimir = document.getElementById('btnImprimir');
    if (btnImprimir) btnImprimir.disabled = true;
    
    generarCodigoBarras();
};

// Mostrar mensajes
function mostrarMensajeRegistro(texto, tipo) {
    const mensajeDiv = document.getElementById('mensaje');
    if (mensajeDiv) {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = `mensaje ${tipo}`;
    }
}
