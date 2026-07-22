// ==========================================
// VARIABLES GLOBALES
// ==========================================
let ventaSeleccionada = null;
let usuarioActualModVenta = null;

// ==========================================
// TOAST
// ==========================================
function mostrarToastModVenta(texto, tipo) {
  let toastContainer = document.getElementById('toastContainerModVenta');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainerModVenta';
    toastContainer.style.cssText = `position: fixed; top: 80px; right: 20px; z-index: 999999; display: flex; flex-direction: column; gap: 10px; max-width: 350px;`;
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  const bgColor = tipo === 'exito' ? '#d1fae5' : (tipo === 'error' ? '#fee2e2' : '#fef3c7');
  const borderColor = tipo === 'exito' ? '#10b981' : (tipo === 'error' ? '#dc2626' : '#f59e0b');
  const textColor = tipo === 'exito' ? '#065f46' : (tipo === 'error' ? '#991b1b' : '#92400e');
  toast.style.cssText = `background: ${bgColor}; border-left: 4px solid ${borderColor}; color: ${textColor}; padding: 14px 18px; border-radius: 8px; font-size: 14px; font-family: 'Poppins', sans-serif; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: toastSlideIn 0.3s ease; display: flex; align-items: center; gap: 10px;`;
  toast.innerHTML = `<span style="font-size: 18px;">${tipo === 'exito' ? '✅' : '⚠️'}</span><span style="flex: 1;">${texto}</span><span onclick="this.parentElement.remove()" style="cursor: pointer; font-size: 18px; opacity: 0.6;">✕</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'toastSlideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 3000);
}

if (!document.getElementById('toastStylesModVenta')) {
  const style = document.createElement('style');
  style.id = 'toastStylesModVenta';
  style.textContent = `@keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes toastSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }`;
  document.head.appendChild(style);
}

// ==========================================
// ZOOM
// ==========================================
function abrirZoomInfalibleModVenta(url) {
  const modal = document.createElement('div');
  modal.id = 'modalZoomDinamicoModVenta';
  modal.style.cssText = `position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background-color: rgba(0, 0, 0, 0.95) !important; z-index: 999999 !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: zoom-out;`;
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = `position: absolute !important; top: 20px !important; right: 30px !important; color: #fff !important; font-size: 40px !important; font-weight: bold !important; cursor: pointer !important; background: none !important; border: none !important; z-index: 1000000 !important;`;
  closeBtn.onclick = function(e) { e.stopPropagation(); cerrarZoomInfalibleModVenta(); };
  const img = document.createElement('img');
  img.src = url;
  img.alt = 'Zoom de foto';
  img.style.cssText = `max-width: 90% !important; max-height: 90vh !important; border-radius: 8px; box-shadow: 0 0 30px rgba(0,0,0,0.8); cursor: default;`;
  modal.appendChild(closeBtn);
  modal.appendChild(img);
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  modal.addEventListener('click', function(e) { if (e.target === modal) cerrarZoomInfalibleModVenta(); });
}

function cerrarZoomInfalibleModVenta() {
  const modal = document.getElementById('modalZoomDinamicoModVenta');
  if (modal) { modal.remove(); document.body.style.overflow = ''; }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarModificarVenta() {
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }
  if (typeof supabaseClient === 'undefined') {
    mostrarToastModVenta('Error: Supabase no está disponible', 'error');
    return;
  }
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    const { data } = await supabaseClient.from('usuarios').select('*').eq('email', session.user.email).maybeSingle();
    usuarioActualModVenta = data || { email: session.user.email, id: session.user.id };
  }
  const inputBusqueda = document.getElementById('buscarVentaMod');
  if (inputBusqueda) {
    inputBusqueda.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); buscarVentaParaModificar(); }
    });
  }
}

// ==========================================
// BUSCAR VENTA
// ==========================================
async function buscarVentaParaModificar() {
  const input = document.getElementById('buscarVentaMod');
  if (!input) return;
  let numeroVenta = input.value.trim().toUpperCase();
  if (!numeroVenta) {
    mostrarToastModVenta('Por favor ingrese un número de venta', 'error');
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('ventas')
      .select('*')
      .eq('numero_venta', numeroVenta)
      .maybeSingle();

    if (error || !data) {
      mostrarToastModVenta('Venta no encontrada', 'error');
      input.value = '';
      input.focus();
      return;
    }

    ventaSeleccionada = data;

    // Ficha solo lectura
    document.getElementById('modVentaNumero').textContent = data.numero_venta || '-';
    document.getElementById('modVentaCodigo').textContent = data.codigo_barras || '-';
    document.getElementById('modVentaNombre').textContent = data.nombre_equipo || '-';
    document.getElementById('modVentaSerial').textContent = data.serial || '-';
    document.getElementById('fieldsetEquipoVendido').style.display = 'block';

    // Fotos del equipo vendido
    const contenedorFotos = document.getElementById('fotosEquipoVendidoMod');
    contenedorFotos.innerHTML = '';
    const fotos = data.fotos_equipo || [];
    if (fotos.length === 0) {
      contenedorFotos.innerHTML = `<div class="foto-preview-placeholder"><div class="foto-preview-placeholder-icon">📷</div><div>Sin fotos registradas</div></div>`;
    } else {
      fotos.forEach((url, i) => {
        const div = document.createElement('div');
        div.className = 'foto-preview';
        div.onclick = function() { abrirZoomInfalibleModVenta(url); };
        div.innerHTML = `<img src="${url}" alt="Foto ${i+1}">`;
        contenedorFotos.appendChild(div);
      });
    }

    // Campos editables
    document.getElementById('modCompradorNombre').value = data.comprador_nombre || '';
    document.getElementById('modCompradorApellido').value = data.comprador_apellido || '';
    document.getElementById('modCompradorCedula').value = data.comprador_cedula || '';
    document.getElementById('modCompradorTelefono').value = data.comprador_telefono || '';
    document.getElementById('modCompradorEmail').value = data.comprador_email || '';
    document.getElementById('modCompradorDireccion').value = data.comprador_direccion || '';
    document.getElementById('modPrecioVenta').value = data.precio_venta || '';

    document.getElementById('fieldsetDatosVentaMod').style.display = 'block';
    document.getElementById('botonesAccionModVenta').style.display = 'flex';

  } catch (err) {
    mostrarToastModVenta('Error al buscar: ' + err.message, 'error');
  }
}

// ==========================================
// GUARDAR CAMBIOS (CON LOGS)
// ==========================================
async function guardarCambiosVenta() {
  if (!ventaSeleccionada) return;

  const nombre = document.getElementById('modCompradorNombre').value.trim();
  const apellido = document.getElementById('modCompradorApellido').value.trim();
  const cedula = document.getElementById('modCompradorCedula').value.trim();
  const telefono = document.getElementById('modCompradorTelefono').value.trim();
  const email = document.getElementById('modCompradorEmail').value.trim();
  const direccion = document.getElementById('modCompradorDireccion').value.trim();
  const precioVenta = document.getElementById('modPrecioVenta').value;

  if (!nombre || !apellido || !cedula || !telefono || !precioVenta) {
    mostrarToastModVenta('Complete todos los campos obligatorios (*)', 'error');
    return;
  }
  if (!/^\d{7,8}$/.test(cedula)) {
    mostrarToastModVenta('La cédula debe tener exactamente 7 u 8 dígitos numéricos', 'error');
    return;
  }
  if (!/^\d{11}$/.test(telefono)) {
    mostrarToastModVenta('El teléfono debe tener exactamente 11 dígitos numéricos', 'error');
    return;
  }

  const btnGuardar = document.getElementById('btnGuardarCambiosVenta');
  btnGuardar.disabled = true;
  btnGuardar.textContent = '⏳ Guardando...';

  try {
    const updateData = {
      comprador_nombre: nombre,
      comprador_apellido: apellido,
      comprador_cedula: cedula,
      comprador_telefono: telefono,
      comprador_email: email,
      comprador_direccion: direccion,
      precio_venta: parseFloat(precioVenta)
    };

    const { error } = await supabaseClient
      .from('ventas')
      .update(updateData)
      .eq('id', ventaSeleccionada.id);

    if (error) throw error;

    // ✅ Registrar en logs
    if (typeof registrarLog === 'function') {
      const descripcion = `Venta modificada | N° Venta: ${ventaSeleccionada.numero_venta} | Equipo: ${ventaSeleccionada.nombre_equipo} | Nuevo Comprador: ${nombre} ${apellido} (C.I: ${cedula}) | Nuevo Precio: $${parseFloat(precioVenta).toFixed(2)} | Modificado por: ${usuarioActualModVenta?.email || 'Desconocido'}`;
      await registrarLog('ventas', 'Venta modificada', descripcion, 'warning');
    }

    mostrarToastModVenta('✅ Cambios guardados exitosamente y registrados en logs', 'exito');
    setTimeout(() => { limpiarFormularioModVenta(); }, 1500);

  } catch (err) {
    console.error('Error al guardar cambios:', err);
    mostrarToastModVenta('Error al guardar: ' + err.message, 'error');
  } finally {
    const btn = document.getElementById('btnGuardarCambiosVenta');
    if (btn) {
      btn.disabled = false;
      btn.textContent = '💾 Guardar Cambios';
    }
  }
}

// ==========================================
// LIMPIAR FORMULARIO
// ==========================================
function limpiarFormularioModVenta() {
  ventaSeleccionada = null;
  document.getElementById('buscarVentaMod').value = '';
  document.getElementById('modCompradorNombre').value = '';
  document.getElementById('modCompradorApellido').value = '';
  document.getElementById('modCompradorCedula').value = '';
  document.getElementById('modCompradorTelefono').value = '';
  document.getElementById('modCompradorEmail').value = '';
  document.getElementById('modCompradorDireccion').value = '';
  document.getElementById('modPrecioVenta').value = '';

  document.getElementById('fieldsetEquipoVendido').style.display = 'none';
  document.getElementById('fieldsetDatosVentaMod').style.display = 'none';
  document.getElementById('botonesAccionModVenta').style.display = 'none';
  
  const contenedorFotos = document.getElementById('fotosEquipoVendidoMod');
  if (contenedorFotos) contenedorFotos.innerHTML = '';

  const btnGuardar = document.getElementById('btnGuardarCambiosVenta');
  if (btnGuardar) {
    btnGuardar.disabled = false;
    btnGuardar.textContent = '💾 Guardar Cambios';
  }

  document.getElementById('buscarVentaMod').focus();
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  inicializarModificarVenta();
});
