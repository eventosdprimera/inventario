// js/registro.js
let codigoBarrasActual = null;
let fotosSeleccionadas = [null, null, null, null];
let usuarioActual = null;
let streamCamara = null;
let fotoCamaraActual = 1;

async function inicializarRegistroEquipo() {
    console.log('Inicializando registro de equipo...');
    let intentos = 0;
    const maxIntentos = 50;
    while (typeof JsBarcode === 'undefined' && intentos < maxIntentos) {
        await new Promise(resolve => setTimeout(resolve, 200));
        intentos++;
    }
    if (typeof JsBarcode === 'undefined') {
        console.error('JsBarcode no está disponible');
        mostrarMensajeRegistro('Error: No se pudo cargar el generador de códigos. Recarga la página.', 'error');
        return;
    }
    console.log('JsBarcode disponible ✓');
    await cargarUsuario();
    await generarCodigoBarras();
}

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

async function generarCodigoBarras() {
    try {
        // Si ya hay un código pendiente (no se ha guardado aún), lo reutilizamos
        const codigoGuardado = sessionStorage.getItem('codigoBarrasPendiente');
        if (codigoGuardado) {
            codigoBarrasActual = codigoGuardado;
            renderCodigoBarras(codigoGuardado);
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
        renderCodigoBarras(codigoBarrasActual);
    } catch (err) {
        console.error('Error al generar código:', err);
        document.getElementById('codigoBarrasValor').textContent = 'Error al generar';
        mostrarMensajeRegistro('Error al generar el código de barras: ' + err.message, 'error');
    }
}

function renderCodigoBarras(codigo) {
    document.getElementById('codigoBarrasValor').textContent = codigo;
    try {
        JsBarcode("#barcode", codigo, {
            format: "CODE128",
            width: 2,
            height: 60,
            displayValue: true,
            fontSize: 14,
            margin: 5,
            font: "Courier New",
            fontOptions: "bold"
        });
    } catch (e) {
        console.error('Error JsBarcode:', e);
    }
    const btnImprimir = document.getElementById('btnImprimir');
    if (btnImprimir) btnImprimir.disabled = false;
}

// ============ CÁMARA DEL COMPUTADOR ============
window.abrirCamara = async function(numeroFoto) {
    fotoCamaraActual = numeroFoto;
    const modal = document.getElementById('modalCamara');
    const video = document.getElementById('videoCamara');
    const modalBody = document.getElementById('modalCamaraBody');
    const btnCapturar = document.getElementById('btnCapturar');

    // Verificar soporte
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        mostrarErrorCamara('Tu navegador no soporta el acceso a la cámara.');
        return;
    }

    modal.classList.add('activo');
    btnCapturar.disabled = true;
    btnCapturar.textContent = '⏳ Iniciando cámara...';

    try {
        // Intentar cámara trasera primero, luego cualquier cámara
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });
        } catch (e1) {
            // Si falla, intentar con cualquier cámara disponible
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        streamCamara = stream;
        video.srcObject = stream;
        await video.play();

        btnCapturar.disabled = false;
        btnCapturar.textContent = '📸 Capturar Foto';
    } catch (err) {
        console.error('Error al acceder a la cámara:', err);
        let mensajeError = 'No se pudo acceder a la cámara.';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            mensajeError = 'Permiso de cámara denegado. Por favor habilita el acceso en la configuración del navegador.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            mensajeError = 'No se encontró ninguna cámara en este dispositivo. Por favor usa el botón "Archivo" para subir una imagen.';
        } else if (err.name === 'NotReadableError') {
            mensajeError = 'La cámara está siendo usada por otra aplicación.';
        }
        mostrarErrorCamara(mensajeError);
    }
};

function mostrarErrorCamara(mensaje) {
    const modalBody = document.getElementById('modalCamaraBody');
    const btnCapturar = document.getElementById('btnCapturar');
    modalBody.innerHTML = `
        <div class="modal-camara-error">
            <span class="modal-camara-error-icon">📷❌</span>
            <div class="modal-camara-error-title">Cámara no disponible</div>
            <div class="modal-camara-error-text">${mensaje}</div>
        </div>
    `;
    btnCapturar.disabled = true;
    btnCapturar.style.display = 'none';
}

window.cerrarCamara = function() {
    const modal = document.getElementById('modalCamara');
    const video = document.getElementById('videoCamara');
    const modalBody = document.getElementById('modalCamaraBody');
    const btnCapturar = document.getElementById('btnCapturar');

    if (streamCamara) {
        streamCamara.getTracks().forEach(track => track.stop());
        streamCamara = null;
    }
    video.srcObject = null;

    // Restaurar estructura del modal por si hubo error
    modalBody.innerHTML = `
        <video id="videoCamara" class="modal-camara-video" autoplay playsinline></video>
        <canvas id="canvasCamara" class="modal-camara-canvas"></canvas>
    `;
    btnCapturar.disabled = false;
    btnCapturar.textContent = '📸 Capturar Foto';
    btnCapturar.style.display = '';

    modal.classList.remove('activo');
};

window.capturarFoto = function() {
    const video = document.getElementById('videoCamara');
    const canvas = document.getElementById('canvasCamara');
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(function(blob) {
        if (!blob) {
            alert('Error al capturar la foto');
            return;
        }
        // Crear un File a partir del blob
        const file = new File([blob], `foto_camara_${Date.now()}.png`, { type: 'image/png' });

        // Asignar al slot correspondiente
        fotosSeleccionadas[fotoCamaraActual - 1] = file;

        // Mostrar preview
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById(`preview${fotoCamaraActual}`);
            const placeholder = document.getElementById(`preview${fotoCamaraActual}-placeholder`);
            const removeBtn = document.getElementById(`remove${fotoCamaraActual}`);
            const previewBox = document.getElementById(`previewBox${fotoCamaraActual}`);
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

        // Cerrar modal
        cerrarCamara();
    }, 'image/png', 0.92);
};

// ============ FOTOS DESDE ARCHIVO ============
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
        previewBox.onclick = function() { document.getElementById(`foto${numero}`).click(); };
        previewBox.style.cursor = 'pointer';
    }
};

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

// ============ BLOQUEO/DESBLOQUEO DEL FORMULARIO ============
function bloquearFormulario(bloquear) {
    const form = document.getElementById('formRegistro');
    if (!form) return;
    const elementos = form.querySelectorAll('input, select, textarea, button');
    elementos.forEach(el => {
        // No bloqueamos el botón de guardar (ya se maneja aparte) ni botones de foto-remove
        if (el.id === 'btnGuardar') return;
        el.disabled = bloquear;
    });
    // El botón de imprimir sticker también se bloquea
    const btnImprimir = document.getElementById('btnImprimir');
    if (btnImprimir) btnImprimir.disabled = bloquear;
}

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

    // 🔒 BLOQUEAR TODO EL FORMULARIO
    const btnGuardar = document.getElementById('btnGuardar');
    btnGuardar.disabled = true;
    btnGuardar.textContent = '⏳ Guardando...';
    bloquearFormulario(true);

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

        // Eliminar el código pendiente porque ya se guardó
        sessionStorage.removeItem('codigoBarrasPendiente');
        codigoBarrasActual = null;

        window.equipoRegistrado = {
            codigo_barras: data.codigo_barras,
            nombre_equipo: nombre,
            marca: marca,
            modelo: modelo,
            serial: serial,
            estatus: estatus,
            fecha_registro: data.fecha_registro
        };

        // Preguntar si desea imprimir sticker
        setTimeout(() => {
            if (confirm('✅ Equipo guardado con éxito.\n\n¿Deseas imprimir el sticker del código de barras?')) {
                imprimirSticker();
            }
            // Limpiar formulario para registrar otro equipo (generará nuevo código)
            limpiarFormularioAutomatico();
        }, 500);

    } catch (err) {
        console.error('Error al guardar:', err);
        mostrarMensajeRegistro('Error al guardar: ' + err.message, 'error');
        // 🔓 DESBLOQUEAR si hubo error
        btnGuardar.disabled = false;
        btnGuardar.textContent = '💾 Guardar Equipo';
        bloquearFormulario(false);
    }
};

window.imprimirSticker = function() {
    const eq = window.equipoRegistrado;
    const codigo = eq ? eq.codigo_barras : codigoBarrasActual;
    if (!codigo) {
        alert('No hay código de barras');
        return;
    }
    const nombre = eq ? eq.nombre_equipo : (document.getElementById('nombreEquipo').value.trim());
    const marca = eq ? eq.marca : (document.getElementById('marcaEquipo').value.trim() || '');
    const modelo = eq ? eq.modelo : (document.getElementById('modeloEquipo').value.trim() || '');
    const serial = eq ? eq.serial : (document.getElementById('serialEquipo').value.trim() || '');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = '<svg id="stickerBarcode"></svg>';
    document.body.appendChild(tempDiv);
    try {
        JsBarcode("#stickerBarcode", codigo, {
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
<title>Sticker - ${codigo}</title>
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
<div class="codigo">${codigo}</div>
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

// Limpieza automática tras guardar con éxito (genera nuevo código)
async function limpiarFormularioAutomatico() {
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
            previewBox.onclick = function() { document.getElementById(`foto${i}`).click(); };
            previewBox.style.cursor = 'pointer';
        }
    }
    window.equipoRegistrado = null;
    document.getElementById('mensaje').className = 'mensaje';
    document.getElementById('btnGuardar').disabled = false;
    document.getElementById('btnGuardar').textContent = '💾 Guardar Equipo';

    // Desbloquear todo
    bloquearFormulario(false);

    // Generar nuevo código de barras para el siguiente equipo
    await generarCodigoBarras();

    // Scroll arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Limpieza manual (botón "Limpiar Formulario")
window.limpiarFormulario = async function() {
    if (!confirm('¿Limpiar el formulario? Se generará un nuevo código de barras.')) return;
    await limpiarFormularioAutomatico();
};

function mostrarMensajeRegistro(texto, tipo) {
    const mensajeDiv = document.getElementById('mensaje');
    if (mensajeDiv) {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = `mensaje ${tipo}`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const container = document.querySelector('.container');
        if (container) {
            setTimeout(() => {
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }
}
