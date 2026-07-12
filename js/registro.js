<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Registrar Equipo - Eventos D' Primera</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%231e3a8a'/%3E%3Ctext x='50' y='68' font-family='Arial,sans-serif' font-size='48' font-weight='bold' text-anchor='middle' fill='white'%3EEP%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:wght@400;700&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
font-family: 'Poppins', sans-serif;
background-color: #f5f7fa;
min-height: 100vh;
display: flex;
flex-direction: column;
}
.header {
background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
color: white;
padding: 15px 30px;
display: flex;
justify-content: space-between;
align-items: center;
box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.header-left { display: flex; flex-direction: column; gap: 3px; }
.header-titulo { font-family: 'Libre Caslon Text', serif; font-size: 22px; font-weight: 700; }
.header-subtitulo { font-size: 12px; opacity: 0.85; font-style: italic; }
.btn-volver {
background-color: rgba(255,255,255,0.2);
color: white;
border: 1px solid rgba(255,255,255,0.3);
padding: 8px 16px;
border-radius: 8px;
cursor: pointer;
font-size: 13px;
font-weight: 500;
font-family: 'Poppins', sans-serif;
text-decoration: none;
display: inline-block;
}
.btn-volver:hover { background-color: rgba(255,255,255,0.3); }
.container {
flex: 1;
padding: 30px;
max-width: 1200px;
margin: 0 auto;
width: 100%;
}
.page-title {
font-family: 'Libre Caslon Text', serif;
color: #1e3a8a;
font-size: 26px;
margin-bottom: 8px;
}
.page-subtitle {
color: #6b7280;
font-size: 14px;
margin-bottom: 25px;
}
fieldset {
background-color: white;
border: 2px solid #e5e7eb;
border-radius: 12px;
padding: 30px;
margin-bottom: 20px;
box-shadow: 0 2px 10px rgba(0,0,0,0.03);
}
legend {
background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
color: white;
padding: 8px 20px;
border-radius: 20px;
font-size: 14px;
font-weight: 600;
letter-spacing: 0.5px;
}
.codigo-barras-section {
background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
padding: 25px;
border-radius: 12px;
border: 2px dashed #3b82f6;
margin-bottom: 25px;
text-align: center;
}
.codigo-barras-header {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 15px;
flex-wrap: wrap;
gap: 15px;
}
.codigo-barras-label {
font-size: 12px;
color: #1e3a8a;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 1px;
}
.codigo-barras-valor {
font-size: 22px;
font-weight: 700;
color: #1e3a8a;
font-family: 'Courier New', monospace;
letter-spacing: 2px;
background-color: white;
padding: 10px 20px;
border-radius: 8px;
display: inline-block;
min-width: 300px;
margin-top: 8px;
}
.codigo-barras-preview {
background-color: white;
padding: 15px;
border-radius: 8px;
display: inline-block;
margin: 15px 0;
}
.codigo-info {
display: flex;
align-items: center;
justify-content: center;
gap: 8px;
margin-top: 12px;
font-size: 12px;
color: #065f46;
font-weight: 500;
}
.fotos-section { margin-bottom: 30px; }
.fotos-grid {
display: grid;
grid-template-columns: repeat(4, 1fr);
gap: 20px;
}
.foto-item { position: relative; }
.foto-preview {
width: 100%;
height: 160px;
border: 2px dashed #cbd5e1;
border-radius: 12px;
display: flex;
align-items: center;
justify-content: center;
background-color: #f8fafc;
overflow: hidden;
cursor: pointer;
transition: all 0.3s;
flex-direction: column;
gap: 8px;
}
.foto-preview:hover {
border-color: #1e3a8a;
background-color: #eff6ff;
transform: translateY(-2px);
}
.foto-preview img {
width: 100%;
height: 100%;
object-fit: cover;
}
.foto-preview-placeholder {
text-align: center;
color: #94a3b8;
font-size: 12px;
font-weight: 500;
}
.foto-preview-placeholder-icon {
font-size: 40px;
margin-bottom: 6px;
display: block;
}
.foto-input { display: none; }
.foto-label-text {
text-align: center;
font-size: 12px;
color: #475569;
margin-bottom: 8px;
font-weight: 600;
}
.foto-label-text .required { color: #dc2626; font-weight: 700; font-size: 14px; }
.foto-remove {
position: absolute;
top: 8px;
right: 8px;
background: #dc2626;
color: white;
border: 2px solid white;
border-radius: 50%;
width: 28px;
height: 28px;
cursor: pointer;
font-size: 16px;
display: flex;
align-items: center;
justify-content: center;
transition: all 0.3s;
z-index: 2;
box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
.foto-remove:hover {
background: #b91c1c;
transform: scale(1.15);
}
/* BOTONES ARCHIVO/CÁMARA - REDISEÑADOS */
.foto-actions {
display: flex;
gap: 6px;
margin-top: 8px;
}
.foto-action-btn {
flex: 1;
padding: 9px 6px;
border: none;
border-radius: 8px;
cursor: pointer;
font-size: 11px;
font-weight: 600;
transition: all 0.3s;
display: flex;
align-items: center;
justify-content: center;
gap: 5px;
font-family: 'Poppins', sans-serif;
color: white;
position: relative;
overflow: hidden;
letter-spacing: 0.3px;
}
.foto-action-btn .btn-icon {
font-size: 14px;
display: inline-flex;
}
.foto-action-btn.archivo {
background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
box-shadow: 0 3px 8px rgba(239, 68, 68, 0.25);
}
.foto-action-btn.archivo:hover {
background: linear-gradient(135deg, #d97706 0%, #dc2626 100%);
transform: translateY(-2px);
box-shadow: 0 5px 12px rgba(239, 68, 68, 0.4);
}
.foto-action-btn.camara {
background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
box-shadow: 0 3px 8px rgba(30, 58, 138, 0.25);
}
.foto-action-btn.camara:hover {
background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
transform: translateY(-2px);
box-shadow: 0 5px 12px rgba(30, 58, 138, 0.4);
}
.foto-action-btn:active {
transform: translateY(0);
}
.foto-action-btn::before {
content: '';
position: absolute;
top: 0; left: -100%;
width: 100%; height: 100%;
background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
transition: left 0.5s;
}
.foto-action-btn:hover::before {
left: 100%;
}
.form-row { margin-bottom: 20px; }
.form-row-full { margin-bottom: 20px; }
.form-grid-4 {
display: grid;
grid-template-columns: repeat(4, 1fr);
gap: 20px;
}
.form-grid-2 {
display: grid;
grid-template-columns: 1fr 1fr;
gap: 20px;
}
.form-group { display: flex; flex-direction: column; }
.form-group.full-width { grid-column: 1 / -1; }
.form-group label {
color: #374151;
font-size: 13px;
font-weight: 600;
margin-bottom: 8px;
display: flex;
align-items: center;
gap: 4px;
}
.form-group label .required { color: #dc2626; font-weight: 700; font-size: 14px; }
.form-group input,
.form-group select,
.form-group textarea {
padding: 12px 14px;
border: 2px solid #e5e7eb;
border-radius: 8px;
font-size: 14px;
font-family: 'Poppins', sans-serif;
transition: all 0.3s;
background-color: #fafafa;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
outline: none;
border-color: #1e3a8a;
background-color: white;
box-shadow: 0 0 0 3px rgba(30,58,138,0.1);
}
.form-group input:disabled,
.form-group select:disabled,
.form-group textarea:disabled {
background-color: #f3f4f6;
color: #6b7280;
cursor: not-allowed;
opacity: 0.7;
}
.input-with-symbol { position: relative; }
.input-with-symbol input { padding-right: 35px; }
.input-with-symbol .symbol {
position: absolute;
right: 14px;
top: 50%;
transform: translateY(-50%);
color: #1e3a8a;
font-weight: 700;
pointer-events: none;
font-size: 18px;
}
.medida-group { display: flex; gap: 8px; align-items: center; }
.medida-group input { flex: 0 0 80px; max-width: 80px; padding: 12px 8px; }
.medida-group select { flex: 1; min-width: 0; }
.btn-action {
padding: 14px 28px;
border: none;
border-radius: 10px;
font-size: 15px;
font-weight: 600;
cursor: pointer;
transition: all 0.3s;
font-family: 'Poppins', sans-serif;
margin-right: 10px;
box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
.btn-primary {
background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
color: white;
}
.btn-primary:hover {
transform: translateY(-2px);
box-shadow: 0 6px 12px rgba(30,58,138,0.3);
}
.btn-secondary { background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%); color: white; }
.btn-secondary:hover {
transform: translateY(-2px);
box-shadow: 0 6px 12px rgba(107,114,128,0.3);
}
.btn-print {
background: linear-gradient(135deg, #059669 0%, #10b981 100%);
color: white;
}
.btn-print:hover {
transform: translateY(-2px);
box-shadow: 0 6px 12px rgba(5,150,105,0.3);
}
.btn-action:disabled {
opacity: 0.5;
cursor: not-allowed;
transform: none !important;
}
.button-group {
margin-top: 30px;
padding-top: 25px;
border-top: 2px solid #e5e7eb;
display: flex;
flex-wrap: wrap;
gap: 12px;
}
.mensaje {
padding: 16px 20px;
border-radius: 10px;
margin-bottom: 25px;
font-size: 14px;
font-weight: 500;
display: none;
border-left: 4px solid;
}
.mensaje.exito {
background-color: #d1fae5;
color: #065f46;
border-left-color: #10b981;
display: block;
}
.mensaje.error {
background-color: #fee2e2;
color: #991b1b;
border-left-color: #dc2626;
display: block;
}
/* MODAL CÁMARA */
.modal-camara {
display: none;
position: fixed;
top: 0; left: 0;
width: 100%; height: 100%;
background: rgba(0,0,0,0.75);
z-index: 9999;
justify-content: center;
align-items: center;
backdrop-filter: blur(4px);
}
.modal-camara.activo { display: flex; }
.modal-camara-content {
background: white;
border-radius: 16px;
padding: 25px;
max-width: 600px;
width: 90%;
box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.modal-camara-header {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 15px;
padding-bottom: 12px;
border-bottom: 2px solid #e5e7eb;
}
.modal-camara-title {
font-family: 'Libre Caslon Text', serif;
color: #1e3a8a;
font-size: 18px;
font-weight: 700;
}
.modal-camara-close {
background: #fee2e2;
color: #dc2626;
border: none;
width: 32px; height: 32px;
border-radius: 50%;
cursor: pointer;
font-size: 18px;
font-weight: 700;
display: flex;
align-items: center;
justify-content: center;
transition: all 0.3s;
}
.modal-camara-close:hover {
background: #dc2626;
color: white;
transform: rotate(90deg);
}
.modal-camara-video {
width: 100%;
background: #000;
border-radius: 10px;
max-height: 400px;
display: block;
}
.modal-camara-canvas { display: none; }
.modal-camara-actions {
display: flex;
gap: 10px;
margin-top: 15px;
justify-content: center;
}
.modal-camara-btn {
padding: 12px 24px;
border: none;
border-radius: 8px;
cursor: pointer;
font-weight: 600;
font-family: 'Poppins', sans-serif;
font-size: 14px;
transition: all 0.3s;
display: flex;
align-items: center;
gap: 6px;
}
.modal-camara-btn.capturar {
background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
color: white;
box-shadow: 0 4px 10px rgba(220,38,38,0.3);
}
.modal-camara-btn.capturar:hover {
transform: translateY(-2px);
box-shadow: 0 6px 14px rgba(220,38,38,0.4);
}
.modal-camara-btn.cancelar {
background: #e5e7eb;
color: #374151;
}
.modal-camara-btn.cancelar:hover {
background: #d1d5db;
}
.modal-camara-error {
background: #fee2e2;
color: #991b1b;
padding: 20px;
border-radius: 10px;
text-align: center;
border-left: 4px solid #dc2626;
}
.modal-camara-error-icon {
font-size: 48px;
margin-bottom: 10px;
display: block;
}
.modal-camara-error-title {
font-size: 16px;
font-weight: 700;
margin-bottom: 6px;
}
.modal-camara-error-text {
font-size: 13px;
line-height: 1.5;
}
.copyright {
text-align: center;
padding: 15px;
color: #9ca3af;
font-size: 11px;
background-color: white;
border-top: 1px solid #e5e7eb;
}
.copyright strong { color: #6b7280; font-weight: 600; }
@media (max-width: 768px) {
.header { flex-direction: column; gap: 15px; text-align: center; }
.container { padding: 15px; }
.form-grid-4 { grid-template-columns: 1fr 1fr; }
.form-grid-2 { grid-template-columns: 1fr; }
.fotos-grid { grid-template-columns: repeat(2, 1fr); }
.codigo-barras-header { flex-direction: column; }
}
@media (max-width: 480px) {
.form-grid-4 { grid-template-columns: 1fr; }
.fotos-grid { grid-template-columns: 1fr; }
}
</style>
</head>
<body>
<header class="header">
<div class="header-left">
<div class="header-titulo">Sistema de Inventario</div>
<div class="header-subtitulo">Registro de Equipos de Sonido</div>
</div>
<a href="../dashboard.html" class="btn-volver">← Volver al Dashboard</a>
</header>
<div class="container">
<h1 class="page-title">📦 Registrar Equipo de Sonido</h1>
<p class="page-subtitle">Complete el formulario para agregar un equipo al inventario. El código de barras se genera automáticamente.</p>
<div id="mensaje" class="mensaje"></div>
<form id="formRegistro" onsubmit="return false;">
<fieldset>
<legend>🔖 Código de Barras (Automático)</legend>
<div class="codigo-barras-section">
<div class="codigo-barras-header">
<div>
<div class="codigo-barras-label">Código Único del Equipo</div>
<div class="codigo-barras-valor" id="codigoBarrasValor">Generando...</div>
</div>
<button type="button" class="btn-action btn-print" id="btnImprimir" onclick="imprimirSticker()" disabled>🖨️ Imprimir Sticker</button>
</div>
<div class="codigo-barras-preview">
<svg id="barcode"></svg>
</div>
<div class="codigo-info">
🔒 Este código es único, inmutable y se mantendrá hasta guardar el equipo
</div>
</div>
</fieldset>
<fieldset>
<legend>📋 Datos del Equipo</legend>
<div class="fotos-section">
<div class="fotos-grid">
<!-- FOTO 1 -->
<div class="foto-item">
<div class="foto-preview" id="previewBox1" onclick="document.getElementById('foto1').click()">
<div class="foto-preview-placeholder" id="preview1-placeholder">
<span class="foto-preview-placeholder-icon">📷</span>
<div>Foto 1</div>
</div>
<img id="preview1" style="display: none;" alt="Foto 1">
</div>
<button type="button" class="foto-remove" id="remove1" style="display: none;" onclick="removerFoto(1)">×</button>
<input type="file" id="foto1" class="foto-input" accept="image/*" onchange="previsualizarFoto(1, event)">
<div class="foto-label-text">Principal <span class="required">*</span></div>
<div class="foto-actions">
<button type="button" class="foto-action-btn archivo" onclick="document.getElementById('foto1').click()"><span class="btn-icon">📁</span> Archivo</button>
<button type="button" class="foto-action-btn camara" onclick="abrirCamara(1)"><span class="btn-icon">📷</span> Cámara</button>
</div>
</div>
<!-- FOTO 2 -->
<div class="foto-item">
<div class="foto-preview" id="previewBox2" onclick="document.getElementById('foto2').click()">
<div class="foto-preview-placeholder" id="preview2-placeholder">
<span class="foto-preview-placeholder-icon">📷</span>
<div>Foto 2</div>
</div>
<img id="preview2" style="display: none;" alt="Foto 2">
</div>
<button type="button" class="foto-remove" id="remove2" style="display: none;" onclick="removerFoto(2)">×</button>
<input type="file" id="foto2" class="foto-input" accept="image/*" onchange="previsualizarFoto(2, event)">
<div class="foto-label-text">Foto 2 (opcional)</div>
<div class="foto-actions">
<button type="button" class="foto-action-btn archivo" onclick="document.getElementById('foto2').click()"><span class="btn-icon">📁</span> Archivo</button>
<button type="button" class="foto-action-btn camara" onclick="abrirCamara(2)"><span class="btn-icon">📷</span> Cámara</button>
</div>
</div>
<!-- FOTO 3 -->
<div class="foto-item">
<div class="foto-preview" id="previewBox3" onclick="document.getElementById('foto3').click()">
<div class="foto-preview-placeholder" id="preview3-placeholder">
<span class="foto-preview-placeholder-icon">📷</span>
<div>Foto 3</div>
</div>
<img id="preview3" style="display: none;" alt="Foto 3">
</div>
<button type="button" class="foto-remove" id="remove3" style="display: none;" onclick="removerFoto(3)">×</button>
<input type="file" id="foto3" class="foto-input" accept="image/*" onchange="previsualizarFoto(3, event)">
<div class="foto-label-text">Foto 3 (opcional)</div>
<div class="foto-actions">
<button type="button" class="foto-action-btn archivo" onclick="document.getElementById('foto3').click()"><span class="btn-icon">📁</span> Archivo</button>
<button type="button" class="foto-action-btn camara" onclick="abrirCamara(3)"><span class="btn-icon">📷</span> Cámara</button>
</div>
</div>
<!-- FOTO 4 -->
<div class="foto-item">
<div class="foto-preview" id="previewBox4" onclick="document.getElementById('foto4').click()">
<div class="foto-preview-placeholder" id="preview4-placeholder">
<span class="foto-preview-placeholder-icon">📷</span>
<div>Foto 4</div>
</div>
<img id="preview4" style="display: none;" alt="Foto 4">
</div>
<button type="button" class="foto-remove" id="remove4" style="display: none;" onclick="removerFoto(4)">×</button>
<input type="file" id="foto4" class="foto-input" accept="image/*" onchange="previsualizarFoto(4, event)">
<div class="foto-label-text">Foto 4 (opcional)</div>
<div class="foto-actions">
<button type="button" class="foto-action-btn archivo" onclick="document.getElementById('foto4').click()"><span class="btn-icon">📁</span> Archivo</button>
<button type="button" class="foto-action-btn camara" onclick="abrirCamara(4)"><span class="btn-icon">📷</span> Cámara</button>
</div>
</div>
</div>
</div>
<!-- FILA 1: Nombre del Equipo -->
<div class="form-row-full">
<div class="form-group">
<label>Nombre del Equipo <span class="required">*</span></label>
<input type="text" id="nombreEquipo" placeholder="Ej: Consola de Mezclas Digital Yamaha MG20XU de 20 Canales con Efectos" required>
</div>
</div>
<!-- FILA 2: Marca | Modelo | Serial | Medida -->
<div class="form-row">
<div class="form-grid-4">
<div class="form-group">
<label>Marca <span class="required">*</span></label>
<input type="text" id="marcaEquipo" placeholder="Ej: Yamaha, JBL, Shure" required>
</div>
<div class="form-group">
<label>Modelo</label>
<input type="text" id="modeloEquipo" placeholder="Ej: MG20XU, EON615">
</div>
<div class="form-group">
<label>Serial <span class="required">*</span></label>
<input type="text" id="serialEquipo" placeholder="Ej: YMH-2024-001234" required>
</div>
<div class="form-group">
<label>Medida (Peso o Dimensión)</label>
<div class="medida-group">
<input type="number" id="medidaValor" step="0.01" min="0" placeholder="0.00">
<select id="medidaUnidad">
<option value="metros">Metros</option>
<option value="cm">Centímetros</option>
</select>
</div>
</div>
</div>
</div>
<!-- FILA 3: Costo | Estatus -->
<div class="form-row">
<div class="form-grid-2">
<div class="form-group">
<label>Costo del Equipo ($) <span class="required">*</span></label>
<div class="input-with-symbol">
<input type="number" id="costoEquipo" step="0.01" min="0" placeholder="0.00" required>
<span class="symbol">$</span>
</div>
</div>
<div class="form-group">
<label>Estatus <span class="required">*</span></label>
<select id="estatusEquipo" required>
<option value="">Seleccionar estatus...</option>
<option value="operativo">✅ Operativo</option>
<option value="inoperativo">⚠️ Inoperativo</option>
<option value="averiado">❌ Averiado</option>
</select>
</div>
</div>
</div>
<!-- FILA 4: Observación -->
<div class="form-row-full">
<div class="form-group">
<label>Observación</label>
<textarea id="observacionEquipo" rows="4" placeholder="Observaciones adicionales sobre el equipo..."></textarea>
</div>
</div>
</fieldset>
<div class="button-group">
<button type="button" class="btn-action btn-primary" id="btnGuardar" onclick="guardarEquipo()">💾 Guardar Equipo</button>
<button type="button" class="btn-action btn-secondary" onclick="limpiarFormulario()">🧹 Limpiar Formulario</button>
</div>
</form>
</div>

<!-- MODAL CÁMARA -->
<div id="modalCamara" class="modal-camara">
<div class="modal-camara-content">
<div class="modal-camara-header">
<div class="modal-camara-title">📷 Capturar Foto</div>
<button class="modal-camara-close" onclick="cerrarCamara()">×</button>
</div>
<div id="modalCamaraBody">
<video id="videoCamara" class="modal-camara-video" autoplay playsinline></video>
<canvas id="canvasCamara" class="modal-camara-canvas"></canvas>
</div>
<div class="modal-camara-actions">
<button type="button" class="modal-camara-btn cancelar" onclick="cerrarCamara()">❌ Cancelar</button>
<button type="button" class="modal-camara-btn capturar" id="btnCapturar" onclick="capturarFoto()">📸 Capturar Foto</button>
</div>
</div>
</div>

<div class="copyright">
<strong>©copyright Eventos de Primera</strong><br>
2026-2027 | Versión 0.1
</div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="../js/config.js"></script>
<script src="../js/registro.js"></script>
</body>
</html> // js/registro.js
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
} botones de camara y archivo no tiene diseño Medida (Peso o Dimensión) con menos espacio en el campo para escirbir y a su lado debe de estar  Costo del Equipo ($) *
