// ==========================================
// VARIABLES GLOBALES
// ==========================================
let ventaAEliminar = null;
let usuarioActualElimVenta = null;

// ==========================================
// TOAST
// ==========================================
function mostrarToastElimVenta(texto, tipo) {
  let toastContainer = document.getElementById('toastContainerElimVenta');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainerElimVenta';
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

if (!document.getElementById('toastStylesElimVenta')) {
  const style = document.createElement('style');
  style.id = 'toastStylesElimVenta';
  style.textContent = `@keyframes toastSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes toastSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }`;
  document.head.appendChild(style);
}

// ==========================================
// ZOOM
// ==========================================
function abrirZoomInfalibleElimVenta(url) {
  const modal = document.createElement('div');
  modal.id = 'modalZoomDinamicoElimVenta';
  modal.style.cssText = `position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background-color: rgba(0, 0, 0, 0.95) !important; z-index: 999999 !important; display: flex !important; align-items: center !important; justify-content: center !important; cursor: zoom-out;`;
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.cssText = `position: absolute !important; top: 20px !important; right: 30px !important; color: #fff !important; font-size: 40px !important; font-weight: bold !important; cursor: pointer !important; background: none !important; border: none !important; z-index: 1000000 !important;`;
  closeBtn.onclick = function(e) { e.stopPropagation(); cerrarZoomInfalibleElimVenta(); };
  const img = document.createElement('img');
  img.src = url;
  img.alt = 'Zoom de foto';
  img.style.cssText = `max-width: 90% !important; max-height: 90vh !important; border-radius: 8px; box-shadow: 0 0 30px rgba(0,0,0,0.8); cursor: default;`;
  modal.appendChild(closeBtn);
  modal.appendChild(img);
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  modal.addEventListener('click', function(e) { if (e.target === modal) cerrarZoomInfalibleElimVenta(); });
}

function cerrarZoomInfalibleElimVenta() {
  const modal = document.getElementById('modalZoomDinamicoElimVenta');
  if (modal) { modal.remove(); document.body.style.overflow = ''; }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function inicializarEliminarVenta() {
  let intentos = 0;
  while (typeof supabaseClient === 'undefined' && intentos < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }
  if (typeof supabaseClient === 'undefined') {
    mostrarToastElimVenta('Error: Supabase no está disponible', 'error');
    return;
  }
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    const { data } = await supabaseClient.from('usuarios').select('*').eq('email', session.user.email).maybeSingle();
    usuarioActualElimVenta = data || { email: session.user.email, id: session.user.id };
  }
  const inputBusqueda = document.getElementById('buscarVentaElim');
  if (inputBusqueda) {
    inputBusqueda.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); buscarVentaParaEliminar(); }
    });
  }
}

// ==========================================
// BUSCAR VENTA
// ==========================================
async function buscarVentaParaEliminar() {
  const input = document.getElementById('buscarVentaElim');
  if (!input) return;
  let numeroVenta = input.value.trim().toUpperCase();
  if (!numeroVenta) {
    mostrarToastElimVenta('Por favor ingrese un número de venta', 'error');
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('ventas')
      .select('*')
      .eq('numero_venta', numeroVenta)
      .maybeSingle();

    if (error || !data) {
      mostrarToastElimVenta('Venta no encontrada', 'error');
      input.value = '';
      input.focus();
      return;
    }

    ventaAEliminar = data;

    // Llenar ficha
    document.getElementById('elimVentaNumero').textContent = data.numero_venta || '-';
    document.getElementById('elimVentaFecha').textContent = data.fecha_venta ? new Date(data.fecha_venta).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
    document.getElementById('elimVentaCodigo').textContent = data.codigo_barras || '-';
    document.getElementById('elimVentaNombre').textContent = data.nombre_equipo || '-';
    document.getElementById('elimVentaSerial').textContent = data.serial || '-';
    document.getElementById('elimVentaPrecio').textContent = `$${parseFloat(data.precio_venta).toFixed(2)}`;
    document.getElementById('elimVentaComprador').textContent = `${data.comprador_nombre || ''} ${data.comprador_apellido || ''}`.trim() || '-';
    document.getElementById('elimVentaCedula').textContent = data.comprador_cedula || '-';
    document.getElementById('fieldsetVentaEliminar').style.display = 'block';

    // Fotos
    const contenedorFotos = document.getElementById('fotosEquipoEliminar');
    contenedorFotos.innerHTML = '';
    const fotos = data.fotos_equipo || [];
    if (fotos.length === 0) {
      contenedorFotos.innerHTML = `<div class="foto-preview-placeholder"><div class="foto-preview-placeholder-icon"></div><div>Sin fotos registradas</div></div>`;
    } else {
      fotos.forEach((url, i) => {
        const div = document.createElement('div');
        div.className = 'foto-preview';
        div.onclick = function() { abrirZoomInfalibleElimVenta(url); };
        div.innerHTML = `<img src="${url}" alt="Foto ${i+1}">`;
        contenedorFotos.appendChild(div);
      });
    }

    document.getElementById('botonesAccionElimVenta').style.display = 'flex';

  } catch (err) {
    mostrarToastElimVenta('Error al buscar: ' + err.message, 'error');
  }
}

// ==========================================
// CONFIRMAR Y ELIMINAR (CON LOGS)
// ==========================================
async function confirmarEliminarVenta() {
  if (!ventaAEliminar) return;

  const confirmacion = prompt(`⚠️ CONFIRMACIÓN DE SEGURIDAD\n\nPara eliminar la venta ${ventaAEliminar.numero_venta}, escriba la palabra ELIMINAR en mayúsculas:`);
  
  if (confirmacion !== 'ELIMINAR') {
    mostrarToastElimVenta('❌ Operación cancelada. La palabra de confirmación no coincide.', 'error');
    return;
  }

  const btnEliminar = document.getElementById('btnEliminarVenta');
  btnEliminar.disabled = true;
  btnEliminar.textContent = ' Eliminando...';

  try {
    // Eliminar de la tabla ventas
    const { error } = await supabaseClient
      .from('ventas')
      .delete()
      .eq('id', ventaAEliminar.id);

    if (error) throw error;

    // ✅ Registrar en logs
    if (typeof registrarLog === 'function') {
      const descripcion = `Venta ELIMINADA | N° Venta: ${ventaAEliminar.numero_venta} | Equipo: ${ventaAEliminar.nombre_equipo} (${ventaAEliminar.codigo_barras}) | Comprador: ${ventaAEliminar.comprador_nombre} ${ventaAEliminar.comprador_apellido} | Precio: $${parseFloat(ventaAEliminar.precio_venta).toFixed(2)} | Eliminado por: ${usuarioActualElimVenta?.email || 'Desconocido'}`;
      await registrarLog('ventas', 'Venta eliminada', descripcion, 'error');
    }

    mostrarToastElimVenta('🗑️ Venta eliminada permanentemente y registrada en logs', 'exito');
    setTimeout(() => { limpiarFormularioElimVenta(); }, 1500);

  } catch (err) {
    console.error('Error al eliminar venta:', err);
    mostrarToastElimVenta('Error al eliminar: ' + err.message, 'error');
  } finally {
    const btn = document.getElementById('btnEliminarVenta');
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🗑️ Eliminar Venta Permanentemente';
    }
  }
}

// ==========================================
// LIMPIAR FORMULARIO
// ==========================================
function limpiarFormularioElimVenta() {
  ventaAEliminar = null;
  document.getElementById('buscarVentaElim').value = '';
  document.getElementById('fieldsetVentaEliminar').style.display = 'none';
  document.getElementById('botonesAccionElimVenta').style.display = 'none';
  
  const contenedorFotos = document.getElementById('fotosEquipoEliminar');
  if (contenedorFotos) contenedorFotos.innerHTML = '';

  const btnEliminar = document.getElementById('btnEliminarVenta');
  if (btnEliminar) {
    btnEliminar.disabled = false;
    btnEliminar.textContent = '🗑️ Eliminar Venta Permanentemente';
  }

  document.getElementById('buscarVentaElim').focus();
}

// ==========================================
// INICIALIZAR
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  inicializarEliminarVenta();
});
