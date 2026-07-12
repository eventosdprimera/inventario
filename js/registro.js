// ==========================================
// VARIABLES GLOBALES
// ==========================================
let codigoBarrasActual = null;
let fotosSeleccionadas = [null, null, null, null];
let usuarioActual = null;
let fotoSeleccionadaActual = null;
let yaInicializado = false;

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarRegistroEquipo() {
    console.log('🚀 === INICIANDO REGISTRO DE EQUIPO ===');
    
    if (yaInicializado) {
        console.log('⏭️ Ya inicializado, saltando...');
        return;
    }
    
    // Verificar elementos del DOM
    const formRegistro = document.getElementById('formRegistro');
    const btnGuardar = document.getElementById('btnGuardar');
    const modalSelector = document.getElementById('modalSelector');
    const modalCamara = document.getElementById('modalCamara');
    const svgBarcode = document.getElementById('barcode');
    
    console.log('🔍 Verificando elementos del DOM:');
    console.log('  - formRegistro:', formRegistro ? '✅' : '❌');
    console.log('  - btnGuardar:', btnGuardar ? '✅' : '❌');
    console.log('  - modalSelector:', modalSelector ? '✅' : '❌');
    console.log('  - modalCamara:', modalCamara ? '✅' : '❌');
    console.log('  - svgBarcode:', svgBarcode ? '✅' : '❌');
    
    if (!formRegistro || !btnGuardar) {
        console.log('ℹ️ No estamos en la página de registro');
        return;
    }
    
    if (!modalSelector || !modalCamara) {
        console.error('❌ ERROR: Faltan modales en el HTML');
        alert('Error: Faltan elementos en la página. Recarga la página.');
        return;
    }
    
    yaInicializado = true;
    console.log('✅ Elementos verificados');
    
    // Esperar Supabase
    console.log('⏳ Esperando Supabase...');
    let intentosSupabase = 0;
    while (typeof supabaseClient === 'undefined' && intentosSupabase < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        intentosSupabase++;
    }
    
    if (typeof supabaseClient === 'undefined') {
        console.warn('⚠️ Supabase no disponible, continuando sin él');
    } else {
        console.log('✅ Supabase disponible');
        await cargarUsuario();
    }
    
    // Esperar JsBarcode
    console.log('⏳ Esperando JsBarcode...');
    let intentosJsBarcode = 0;
    while (typeof JsBarcode === 'undefined' && intentosJsBarcode < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        intentosJsBarcode++;
    }
    
    if (typeof JsBarcode === 'undefined') {
        console.error('❌ JsBarcode no disponible');
        alert('Error: No se pudo cargar el generador de códigos de barras');
        return;
    }
    console.log('✅ JsBarcode disponible');
    
    // Generar código de barras
    await generarCodigoBarras();
    
    console.log('✅ === INICIALIZACIÓN COMPLETADA ===');
}

// ==========================================
// CARGAR USUARIO
// ==========================================
async function cargarUsuario() {
    try {
        if (typeof supabaseClient === 'undefined') {
            console.warn('⚠️ Supabase no disponible para cargar usuario');
            return;
        }
        
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            console.warn('⚠️ No hay sesión activa');
            return;
        }
        
        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('email', session.user.email)
            .single();
        
        if (data && !error) {
            usuarioActual = data;
            console.log('✅ Usuario cargado:', usuarioActual.email);
        } else {
            usuarioActual = { email: session.user.email, id: session.user.id };
            console.log('✅ Usuario básico cargado:', usuarioActual.email);
        }
    } catch (err) {
        console.error('❌ Error al cargar usuario:', err);
    }
}

// ==========================================
// GENERAR CÓDIGO DE BARRAS
// ==========================================
async function generarCodigoBarras() {
    try {
        console.log('🔖 Generando código de barras...');
        
        const codigoGuardado = sessionStorage.getItem('codigoBarrasPendiente');
        
        if (codigoGuardado) {
            console.log('📋 Usando código guardado:', codigoGuardado);
            codigoBarrasActual = codigoGuardado;
            const elementoCodigo = document.getElementById('codigoBarrasValor');
            if (elementoCodigo) elementoCodigo.textContent = codigoBarrasActual;
            
            try {
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
                console.log('✅ Código de barras renderizado');
            } catch (e) {
                console.error('❌ Error al renderizar código:', e);
            }
            
            const btnImprimir = document.getElementById('btnImprimir');
            if (btnImprimir) btnImprimir.disabled = false;
            return;
        }
        
        // Generar nuevo código
        let nuevoCodigo;
        let existe = true;
        let intentos = 0;
        
        while (existe && intentos < 10) {
            const ahora = new Date();
            const fechaParte = ahora.toISOString().slice(0, 10).replace(/-/g, '');
            const horaParte = ahora.toTimeString().slice(0, 8).replace(/:/g, '');
            const randomParte = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
            
            nuevoCodigo = `EP-${fechaParte}-${horaParte}-${randomParte}`;
            
            // Verificar en Supabase si está disponible
            if (typeof supabaseClient !== 'undefined') {
                try {
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
                } catch (err) {
                    existe = false;
                }
            } else {
                existe = false;
            }
        }
        
        if (existe) {
            throw new Error('No se pudo generar un código único después de 10 intentos');
        }
        
        codigoBarrasActual = nuevoCodigo;
        sessionStorage.setItem('codigoBarrasPendiente', codigoBarrasActual);
        
        const elementoCodigo = document.getElementById('codigoBarrasValor');
        if (elementoCodigo) elementoCodigo.textContent = codigoBarrasActual;
        
        try {
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
            console.log('✅ Código generado:', codigoBarrasActual);
        } catch (e) {
            console.error('❌ Error al renderizar código:', e);
        }
        
        const btnImprimir = document.getElementById('btnImprimir');
        if (btnImprimir) btnImprimir.disabled = false;
        
    } catch (err) {
        console.error('❌ Error al generar código:', err);
        const elementoCodigo = document.getElementById('codigoBarrasValor');
        if (elementoCodigo) elementoCodigo.textContent = 'Error al generar';
        mostrarMensajeRegistro('Error al generar el código: ' + err.message, 'error');
    }
}

// ==========================================
// SELECTOR DE FOTO
// ==========================================
window.abrirSelectorFoto = function(numero) {
    console.log('📸 Abriendo selector para foto:', numero);
    
    const modal = document.getElementById('modalSelector');
    
    if (!modal) {
        console.error('❌ Modal selector NO encontrado');
        alert('Error: El modal de selección no está disponible. Recarga la página.');
        return;
    }
    
    fotoSeleccionadaActual = numero;
    modal.classList.add('activo');
    console.log('✅ Modal abierto');
};

window.cerrarSelectorFoto = function() {
    const modal = document.getElementById('modalSelector');
    if (modal) modal.classList.remove('activo');
    fotoSeleccionadaActual = null;
};

window.seleccionarArchivo = function() {
    if (fotoSeleccionadaActual) {
        const input = document.getElementById(`foto${fotoSeleccionadaActual}`);
        if (input) input.click();
        cerrarSelectorFoto();
    }
};

window.seleccionarCamara = function() {
    if (fotoSeleccionadaActual) {
        cerrarSelectorFoto();
        abrirCamara(fotoSeleccionadaActual);
    }
};

// ==========================================
// PREVISUALIZAR FOTO
// ==========================================
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
        const previewBox = document.getElementById(`previewBox${numero}`);
        
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
        if (removeBtn) removeBtn.style.display = 'flex';
        if (previewBox) {
            previewBox.onclick = null;
            previewBox.style.cursor = 'default';
        }
    };
    reader.readAsDataURL(file);
};

// ==========================================
// REMOVER FOTO
// ==========================================
window.removerFoto = function(numero) {
    fotosSeleccionadas[numero - 1] = null;
    
    const preview = document.getElementById(`preview${numero}`);
    const placeholder = document.getElementById(`preview${numero}-placeholder`);
    const removeBtn = document.getElementById(`remove${numero}`);
    const input = document.getElementById(`foto${numero}`);
    const previewBox = document.getElementById(`previewBox${numero}`);
    
    if (preview) { preview.style.display = 'none'; preview.src = ''; }
    if (placeholder) placeholder.style.display = 'block';
    if (removeBtn) removeBtn.style.display = 'none';
    if (input) input.value = '';
    if (previewBox) {
        previewBox.onclick = function() { abrirSelectorFoto(numero); };
        previewBox.style.cursor = 'pointer';
    }
};

// ==========================================
// ABRIR CÁMARA
// ==========================================
window.abrirCamara = async function(numero) {
    fotoSeleccionadaActual = numero;
    const modal = document.getElementById('modalCamara');
    const video = document.getElementById('videoCamara');
    
    if (!modal || !video) {
        alert('Error: Modal de cámara no encontrado');
        return;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        video.srcObject = stream;
        modal.classList.add('activo');
    } catch (err) {
        console.error('❌ Error al acceder a la cámara:', err);
        alert('No se pudo acceder a la cámara. Verifica los permisos.');
    }
};

// ==========================================
// CERRAR CÁMARA
// ==========================================
window.cerrarCamara = function() {
    const modal = document.getElementById('modalCamara');
    const video = document.getElementById('videoCamara');
    
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    if (modal) modal.classList.remove('activo');
    fotoSeleccionadaActual = null;
};

// ==========================================
// CAPTURAR FOTO
// ==========================================
window.capturarFoto = function() {
    const video = document.getElementById('videoCamara');
    const canvas = document.getElementById('canvasCamara');
    
    if (!video || !canvas) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    canvas.toBlob(function(blob) {
        const file = new File([blob], `foto_${fotoSeleccionadaActual}_${Date.now()}.jpg`, {
            type: 'image/jpeg'
        });
        
        fotosSeleccionadas[fotoSeleccionadaActual - 1] = file;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const numero = fotoSeleccionadaActual;
            const preview = document.getElementById(`preview${numero}`);
            const placeholder = document.getElementById(`preview${numero}-placeholder`);
            const removeBtn = document.getElementById(`remove${numero}`);
            const previewBox = document.getElementById(`previewBox${numero}`);
            
            if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
            if (placeholder) placeholder.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'flex';
            if (previewBox) { previewBox.onclick = null; previewBox.style.cursor = 'default'; }
        };
        reader.readAsDataURL(file);
        cerrarCamara();
    }, 'image/jpeg', 0.9);
};

// ==========================================
// VERIFICAR SERIAL
// ==========================================
async function verificarSerial(serial) {
    try {
        if (typeof supabaseClient === 'undefined') return false;
        
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

// ==========================================
// GUARDAR EQUIPO
// ==========================================
window.guardarEquipo = async function() {
    console.log('💾 Guardando equipo...');
    
    if (typeof supabaseClient === 'undefined') {
        alert('Error: Supabase no está configurado. Verifica tu archivo config.js');
        return;
    }
    
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
        mostrarMensajeRegistro('El serial ya está registrado.', 'error');
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
                const fileName = `${codigoBarrasActual}_foto${i + 1}_${Date.now()}.${fileExt}`;
                
                console.log(`📤 Subiendo foto ${i + 1}...`);
                
                const { error: uploadError } = await supabaseClient.storage
                    .from('equipos-fotos')
                    .upload(fileName, fotosSeleccionadas[i], {
                        cacheControl: '3600',
                        upsert: false
                    });
                
                if (uploadError) throw uploadError;
                
                const { data: urlData } = supabaseClient.storage
                    .from('equipos-fotos')
                    .getPublicUrl(fileName);
                
                fotoUrls[i] = urlData.publicUrl;
                console.log(`✅ Foto ${i + 1} subida`);
            }
        }
        
        console.log('📝 Guardando en base de datos...');
        
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
            if (error.code === '23505') throw new Error('El serial ya está registrado');
            throw error;
        }
        
        console.log('✅ Equipo guardado exitosamente');
        
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
        console.error('❌ Error al guardar:', err);
        mostrarMensajeRegistro('Error al guardar: ' + err.message, 'error');
        btnGuardar.disabled = false;
        btnGuardar.textContent = '💾 Guardar Equipo';
    }
};

// ==========================================
// IMPRIMIR STICKER
// ==========================================
window.imprimirSticker = function() {
    if (!codigoBarrasActual) {
        alert('No hay código de barras');
        return;
    }
    
    const nombre = document.getElementById('nombreEquipo').value.trim();
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
                    ${nombre ? `<div class="nombre">${nombre}</div>` : ''}
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
        console.error('❌ Error al generar sticker:', err);
        alert('Error al generar el sticker');
        if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
    }
};

// ==========================================
// LIMPIAR FORMULARIO
// ==========================================
window.limpiarFormulario = function() {
    if (!confirm('¿Limpiar el formulario? El código de barras se mantendrá.')) return;
    
    document.getElementById('formRegistro').reset();
    
    for (let i = 1; i <= 4; i++) {
        fotosSeleccionadas[i - 1] = null;
        const preview = document.getElementById(`preview${i}`);
        const placeholder = document.getElementById(`preview${i}-placeholder`);
        const removeBtn = document.getElementById(`remove${i}`);
        const input = document.getElementById(`foto${i}`);
        const previewBox = document.getElementById(`previewBox${i}`);
        
        if (preview) { preview.style.display = 'none'; preview.src = ''; }
        if (placeholder) placeholder.style.display = 'block';
        if (removeBtn) removeBtn.style.display = 'none';
        if (input) input.value = '';
        if (previewBox) {
            previewBox.onclick = function() { abrirSelectorFoto(i); };
            previewBox.style.cursor = 'pointer';
        }
    }
    
    window.equipoRegistrado = null;
    document.getElementById('mensaje').className = 'mensaje';
    document.getElementById('btnGuardar').disabled = false;
    document.getElementById('btnGuardar').textContent = '💾 Guardar Equipo';
};

// ==========================================
// MOSTRAR MENSAJE
// ==========================================
function mostrarMensajeRegistro(texto, tipo) {
    const mensajeDiv = document.getElementById('mensaje');
    if (mensajeDiv) {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = `mensaje ${tipo}`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ==========================================
// INICIAR CUANDO EL DOM ESTÉ LISTO
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado');
    inicializarRegistroEquipo();
});
