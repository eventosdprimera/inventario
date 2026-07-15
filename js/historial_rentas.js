// ==========================================
// MARCAR COMO RECIBIDA (Mover a terminadas con limpieza automática)
// ==========================================
async function marcarRecibidaHist(numeroRenta) {
  const confirmacion = confirm(`¿Confirmar que la renta #${numeroRenta} ha sido recibida?\n\nEsta acción:\n- Cambiará el estado a "Terminada"\n- Moverá la renta al historial de terminadas\n- Registrará la fecha real de devolución\n- Quedará fuera de esta lista`);
  
  if (!confirmacion) return;

  try {
    // 1. Cargar datos completos de la renta
    const { data: renta, error: errorRenta } = await supabaseClient
      .from('rentas')
      .select('*')
      .eq('numero_renta', numeroRenta)
      .single();

    if (errorRenta || !renta) {
      mostrarMensajeHist('No se pudo cargar la renta o ya fue eliminada', 'error');
      return;
    }

    // 2. Cargar items de la renta
    const { data: items, error: errorItems } = await supabaseClient
      .from('rentas_items')
      .select('*')
      .eq('renta_id', renta.id);

    if (errorItems) throw errorItems;

    // 3. Calcular días de diferencia (anticipado o retraso)
    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0];
    const fechaDevProgramada = new Date(renta.fecha_devolucion + 'T12:00:00');
    const diffTime = fechaDevProgramada - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let diasAnticipados = null;
    let diasRetraso = null;
    
    if (diffDays > 0) {
      diasAnticipados = diffDays;
    } else if (diffDays < 0) {
      diasRetraso = Math.abs(diffDays);
    }

    // 4. Insertar en rentas_terminadas
    const { data: rentaTerminada, error: errorTerminada } = await supabaseClient
      .from('rentas_terminadas')
      .insert({
        numero_renta: renta.numero_renta,
        serie: renta.serie || 'RENT',
        fecha_renta: renta.fecha_renta,
        fecha_devolucion_programada: renta.fecha_devolucion,
        fecha_devolucion_real: fechaHoy,
        cliente_nombre: renta.cliente_nombre,
        cliente_telefono: renta.cliente_telefono,
        cliente_email: renta.cliente_email,
        cliente_direccion: renta.cliente_direccion,
        ingeniero_nombre: renta.ingeniero_nombre,
        ingeniero_contacto: renta.ingeniero_contacto,
        subtotal: renta.subtotal,
        descuento: renta.descuento,
        total: renta.total,
        estado: 'devuelta',
        observaciones: renta.observaciones,
        usuario_registro: renta.usuario_registro,
        usuario_registro_id: renta.usuario_registro_id,
        recibido_por_email: usuarioActualHist?.email || 'unknown',
        recibido_por_id: usuarioActualHist?.id || null,
        dias_anticipados: diasAnticipados,
        dias_retraso: diasRetraso,
        observaciones_terminacion: `Recibida el ${hoy.toLocaleDateString('es-ES')}${diasAnticipados ? ` (${diasAnticipados} días antes)` : ''}${diasRetraso ? ` (${diasRetraso} días tarde)` : ' (a tiempo)'}`
      })
      .select()
      .single();

    // ✅ MANEJO INTELIGENTE DE ERRORES DE DUPLICADO
    if (errorTerminada) {
      if (errorTerminada.message && errorTerminada.message.includes('duplicate key value violates unique constraint')) {
        console.warn('La renta ya estaba en terminadas. Procediendo a limpiar la tabla activa...');
        
        // La renta ya está en terminadas, solo necesitamos eliminarla de las tablas activas para limpiar la inconsistencia
        await supabaseClient.from('rentas_items').delete().eq('renta_id', renta.id);
        await supabaseClient.from('rentas').delete().eq('id', renta.id);
        
        mostrarMensajeHist(`⚠️ La renta #${numeroRenta} ya estaba registrada como terminada. Se ha limpiado de la lista activa.`, 'exito');
        
        setTimeout(() => {
          buscarRentasHistorial();
        }, 1500);
        return; // Salir de la función exitosamente
      } else {
        throw new Error('Error al crear renta terminada: ' + errorTerminada.message);
      }
    }

    // 5. Insertar items en rentas_items_terminadas
    for (const item of items || []) {
      const { error: errorItem } = await supabaseClient
        .from('rentas_items_terminadas')
        .insert({
          renta_terminada_id: rentaTerminada.id,
          renta_id_original: item.renta_id,
          codigo_barras: item.codigo_barras,
          nombre_equipo: item.nombre_equipo,
          marca: item.marca,
          modelo: item.modelo,
          serial: item.serial,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal
        });

      if (errorItem) throw new Error('Error al crear item terminado: ' + errorItem.message);
    }

    // 6. Eliminar items de rentas_items
    const { error: errorDeleteItems } = await supabaseClient
      .from('rentas_items')
      .delete()
      .eq('renta_id', renta.id);

    if (errorDeleteItems) throw new Error('Error al eliminar items: ' + errorDeleteItems.message);

    // 7. Eliminar renta de rentas
    const { error: errorDeleteRenta } = await supabaseClient
      .from('rentas')
      .delete()
      .eq('id', renta.id);

    if (errorDeleteRenta) throw new Error('Error al eliminar renta: ' + errorDeleteRenta.message);

    // 8. Registrar en logs
    if (typeof registrarLog === 'function') {
      const descripcion = `Renta #${numeroRenta} marcada como recibida y terminada | Cliente: ${renta.cliente_nombre} | Total: $${parseFloat(renta.total).toFixed(2)} | ${diasAnticipados ? `${diasAnticipados} días antes` : diasRetraso ? `${diasRetraso} días tarde` : 'A tiempo'} | Recibido por: ${usuarioActualHist?.email || 'Desconocido'}`;
      await registrarLog('rentar', 'Renta terminada', descripcion, 'success');
    }

    mostrarMensajeHist(`✅ Renta #${numeroRenta} marcada como recibida y movida a terminadas`, 'exito');

    // 9. Recargar la lista automáticamente
    setTimeout(() => {
      buscarRentasHistorial();
    }, 1500);

  } catch (err) {
    console.error('Error al marcar como recibida:', err);
    mostrarMensajeHist('Error al procesar: ' + err.message, 'error');
  }
}
