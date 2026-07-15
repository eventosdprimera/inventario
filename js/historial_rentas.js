// ==========================================
// RENDERIZAR TABLA
// ==========================================
function renderizarTablaHist(totalRegistros) {
  const tbody = document.getElementById('tbodyRentasHist');
  if (!tbody) return;

  if (rentasHistCache.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
          <div style="font-size: 40px; margin-bottom: 10px;">📭</div>
          <div>No se encontraron rentas con los filtros aplicados</div>
        </td>
      </tr>`;
    document.getElementById('paginacionHist').innerHTML = '';
    return;
  }

  tbody.innerHTML = rentasHistCache.map((renta, index) => {
    const globalIndex = (paginaActualHist - 1) * POR_PAGINA_HIST + index + 1;
    const fechaInicio = new Date(renta.fecha_renta + 'T12:00:00').toLocaleDateString('es-ES');
    const fechaDev = new Date(renta.fecha_devolucion + 'T12:00:00').toLocaleDateString('es-ES');
    
    const estadoColors = {
      'activa': '#10b981',
      'vencida': '#ef4444'
    };
    const colorEstado = estadoColors[renta.estado] || '#6b7280';
    const estadoDisplay = renta.estado === 'activa' ? 'Activa' : 'Vencida';

    return `
      <tr>
        <td>${globalIndex}</td>
        <td style="font-family: monospace; font-weight: 600; color: #1e3a8a;">${renta.numero_renta}</td>
        <td><strong>${renta.cliente_nombre}</strong></td>
        <td>${fechaInicio}</td>
        <td>${fechaDev}</td>
        <td style="text-align: center;">
          <span style="background: ${colorEstado}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 11px; text-transform: capitalize;">
            ${estadoDisplay}
          </span>
        </td>
        <td style="text-align: right; font-weight: 600;">$${parseFloat(renta.total).toFixed(2)}</td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
            <button type="button" class="btn-action btn-primary" onclick="imprimirRentaHist('${renta.numero_renta}')" 
                    title="Imprimir comprobante" style="padding: 6px 12px; font-size: 12px;">
              🖨️ Imprimir
            </button>
            <button type="button" class="btn-action btn-print" onclick="marcarRecibidaHist('${renta.numero_renta}')" 
                    title="Marcar como recibida" style="padding: 6px 12px; font-size: 12px;">
              ✅ Recibido
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  renderizarPaginacionHist(totalRegistros);
}
