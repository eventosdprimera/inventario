// Caso especial: Inventario → Registrar
if (modulo === 'inventario' && operacion === 'registrar') {
  try {
    // Cargar JsBarcode si no está disponible
    if (typeof JsBarcode === 'undefined') {
      await cargarScript('https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js');
    }

    // Cargar registro.js si no está disponible
    if (typeof inicializarRegistroEquipo === 'undefined') {
      await cargarScript('js/registro.js');
    }

    // Cargar el HTML del formulario
    const response = await fetch('html/registro.html');
    if (!response.ok) throw new Error('No se pudo cargar html/registro.html');
    const htmlText = await response.text();

    // Parsear el HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    // Extraer solo el contenido del .container (NO el header, footer ni scripts)
    const containerContent = doc.querySelector('.container');
    if (!containerContent) throw new Error('No se encontró el contenedor del formulario');

    // Inyectar el contenido en el área dinámica
    contenidoDiv.innerHTML = containerContent.innerHTML;

    // Esperar a que el DOM esté listo
    await new Promise(resolve => setTimeout(resolve, 300));

    // Inicializar el formulario (esto también inyectará los modales si es necesario)
    if (typeof inicializarRegistroEquipo === 'function') {
      await inicializarRegistroEquipo();
    }
  } catch (err) {
    console.error('Error:', err);
    contenidoDiv.innerHTML = `<fieldset><legend>Error</legend>
      <p>No se pudo cargar el formulario: ${err.message}</p>
    </fieldset>`;
  }
  return;
}
