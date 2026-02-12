// ==================== ESTADO GLOBAL ====================
const API_URL = 'http://localhost:5000/api';  // URL del backend Flask
let esquemas = [];
let negocioSeleccionado = null;
let camposTemporales = [];
let modoEdicion = false;
let editandoId = null;

// ==================== FUNCIÓN PARA APLICAR CÁLCULOS AUTOMÁTICOS ====================
function aplicarCalculos(data, campos) {
    const resultado = { ...data };
    
    campos.forEach(campo => {
        // Campo calculado (multiplicación)
        if (campo.type === 'calculated' && campo.field1 && campo.field2) {
            const val1 = parseFloat(data[campo.field1]) || 0;
            const val2 = parseFloat(data[campo.field2]) || 0;
            resultado[campo.key] = (val1 * val2).toFixed(2);
        }
        
        // Edad automática
        if (campo.type === 'age' && campo.sourceField && data[campo.sourceField]) {
            try {
                const fechaNac = new Date(data[campo.sourceField]);
                const hoy = new Date();
                if (!isNaN(fechaNac.getTime())) {
                    let edad = hoy.getFullYear() - fechaNac.getFullYear();
                    const mes = hoy.getMonth() - fechaNac.getMonth();
                    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
                        edad--;
                    }
                    if (edad >= 0 && edad < 150) {
                        resultado[campo.key] = edad;
                    }
                }
            } catch (e) {
                console.error('Error calculando edad:', e);
            }
        }
        
        // Estado de licencia
        if (campo.type === 'license_status' && campo.sourceField && data[campo.sourceField]) {
            try {
                const fechaVenc = new Date(data[campo.sourceField]);
                const hoy = new Date();
                if (!isNaN(fechaVenc.getTime())) {
                    resultado[campo.key] = fechaVenc >= hoy ? 'VIGENTE' : 'VENCIDA';
                }
            } catch (e) {
                console.error('Error calculando estado licencia:', e);
            }
        }
    });
    
    return resultado;
}

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', async () => {
    await cargarEsquemas();
    updateIdLabel();
    updateCampoConfig();
    
    document.getElementById('idAutomatico').addEventListener('change', updateIdLabel);
});

// ==================== FUNCIONES API ====================

async function cargarEsquemas() {
    try {
        const response = await fetch(`${API_URL}/schemas`);
        if (!response.ok) throw new Error('Error al cargar esquemas');
        esquemas = await response.json();
        renderSistemas();
    } catch (error) {
        console.error('Error cargando esquemas:', error);
        showAlert('Error conectando con el servidor', 'error');
    }
}

// ==================== FUNCIONES DE UI ====================
function showAlert(message, type = 'success') {
    const alert = document.getElementById('alert');
    alert.className = `alert alert-${type} show`;
    alert.textContent = message;
    setTimeout(() => {
        alert.className = 'alert';
    }, 3000);
}

function toggleCreator() {
    const section = document.getElementById('creatorSection');
    const btn = document.getElementById('btnCreatorText');
    
    if (section.classList.contains('hidden')) {
        section.classList.remove('hidden');
        btn.textContent = 'CANCELAR';
    } else {
        section.classList.add('hidden');
        btn.textContent = 'CREAR NUEVO NEGOCIO';
        limpiarCreador();
    }
}

function updateIdLabel() {
    const checkbox = document.getElementById('idAutomatico');
    const label = document.getElementById('idLabel');
    label.textContent = checkbox.checked ? 'AUTOMÁTICO' : 'MANUAL';
}

function updateCampoConfig() {
    const tipo = document.getElementById('campoTipo').value;
    const config = document.getElementById('campoConfig');
    
    let html = '';
    
    if (tipo === 'text') {
        html = `
            <label>Máximo de Caracteres</label>
            <input type="number" id="maxLength" class="form-input" placeholder="Ej: 50">
        `;
    } else if (tipo === 'number') {
        html = `
            <label>Configuración de Número</label>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; align-items: end;">
                <div>
                    <label style="font-size: 11px; color: #888;">Longitud Total</label>
                    <input type="number" id="numLength" class="form-input" placeholder="8">
                </div>
                <div>
                    <label style="font-size: 11px; color: #888;">Decimales</label>
                    <input type="number" id="decimals" class="form-input" value="2">
                </div>
                <label style="display: flex; align-items: center; gap: 5px; color: #00ff00; padding: 10px; background: #050505; border: 1px solid #333;">
                    <input type="checkbox" id="isInteger" style="width: auto;"> Solo Enteros
                </label>
            </div>
        `;
    } else if (tipo === 'select') {
        html = `
            <label>Opciones (separadas por coma)</label>
            <input type="text" id="options" class="form-input" placeholder="Ej: hombre,mujer">
        `;
    } else if (tipo === 'calculated') {
        html = `
            <label>Campos a Multiplicar</label>
            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 10px; align-items: end;">
                <div>
                    <label style="font-size: 11px; color: #888;">Campo 1</label>
                    <input type="text" id="field1" class="form-input" placeholder="precio">
                </div>
                <span style="color: #00ff00; font-size: 20px; padding-bottom: 10px;">×</span>
                <div>
                    <label style="font-size: 11px; color: #888;">Campo 2</label>
                    <input type="text" id="field2" class="form-input" placeholder="cantidad">
                </div>
            </div>
            <small style="color: #888; display: block; margin-top: 5px; font-size: 11px;">
                💡 "Precio Unitario" → precio_unitario
            </small>
        `;
    } else if (tipo === 'age') {
        html = `
            <label>Campo Fecha Nacimiento</label>
            <input type="text" id="sourceField" class="form-input" placeholder="fecha_nacimiento">
            <small style="color: #888; display: block; margin-top: 5px; font-size: 11px;">
                💡 "Fecha Nacimiento" → fecha_nacimiento
            </small>
        `;
    } else if (tipo === 'license_status') {
        html = `
            <label>Campo Fecha Vencimiento</label>
            <input type="text" id="sourceField" class="form-input" placeholder="fecha_vencimiento">
            <small style="color: #888; display: block; margin-top: 5px; font-size: 11px;">
                💡 "Fecha Vencimiento" → fecha_vencimiento
            </small>
        `;
    }
    
    config.innerHTML = html;
}

// ==================== SISTEMA CREATOR ====================
function agregarCampo() {
    const label = document.getElementById('campoLabel').value.trim();
    if (!label) {
        showAlert('Ingresa un nombre para el campo', 'error');
        return;
    }
    
    const tipo = document.getElementById('campoTipo').value;
    const key = label.toLowerCase().replace(/ /g, '_');
    
    const campo = { label, key, type: tipo };
    
    if (tipo === 'text') {
        campo.maxLength = document.getElementById('maxLength')?.value || '';
    } else if (tipo === 'number') {
        campo.numLength = document.getElementById('numLength')?.value || '';
        campo.decimals = document.getElementById('decimals')?.value || '2';
        campo.isInteger = document.getElementById('isInteger')?.checked || false;
    } else if (tipo === 'select') {
        campo.options = document.getElementById('options')?.value || '';
    } else if (tipo === 'calculated') {
        campo.field1 = document.getElementById('field1')?.value || '';
        campo.field2 = document.getElementById('field2')?.value || '';
    } else if (tipo === 'age' || tipo === 'license_status') {
        campo.sourceField = document.getElementById('sourceField')?.value || '';
    }
    
    camposTemporales.push(campo);
    renderCamposPreview();
    
    document.getElementById('campoLabel').value = '';
    updateCampoConfig();
}

function eliminarCampoPreview(index) {
    camposTemporales.splice(index, 1);
    renderCamposPreview();
}

function renderCamposPreview() {
    const container = document.getElementById('camposPreview');
    container.innerHTML = camposTemporales.map((c, i) => `
        <div class="campo-tag">
            <span>${c.label} [${c.type}]</span>
            <span class="campo-tag-delete" onclick="eliminarCampoPreview(${i})">✕</span>
        </div>
    `).join('');
}

async function guardarSistema() {
    const nombre = document.getElementById('nuevoNombre').value.trim();
    
    if (!nombre || camposTemporales.length === 0) {
        showAlert('Faltan datos para crear el sistema', 'error');
        return;
    }
    
    const idAutomatico = document.getElementById('idAutomatico').checked;
    
    const nuevoEsquema = {
        nombre,
        config: { idAutomatico },
        campos: [
            { key: 'id', label: 'ID', type: 'number', locked: idAutomatico, isInteger: true },
            ...camposTemporales
        ]
    };
    
    try {
        const response = await fetch(`${API_URL}/schemas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoEsquema)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al crear sistema');
        }
        
        await cargarEsquemas();
        toggleCreator();
        showAlert('Sistema creado correctamente', 'success');
    } catch (error) {
        console.error('Error guardando sistema:', error);
        showAlert(error.message, 'error');
    }
}

function limpiarCreador() {
    document.getElementById('nuevoNombre').value = '';
    document.getElementById('idAutomatico').checked = true;
    camposTemporales = [];
    renderCamposPreview();
    updateIdLabel();
}

// ==================== GESTIÓN DE SISTEMAS ====================
function renderSistemas() {
    const lista = document.getElementById('sistemasList');
    lista.innerHTML = esquemas.map((esq, index) => `
        <li class="sistema-item ${negocioSeleccionado?.nombre === esq.nombre ? 'active' : ''}" 
            onclick="seleccionarSistema(${index})">
            <span>${esq.nombre}</span>
            <span class="delete-sistema" onclick="event.stopPropagation(); eliminarSistema(${index})">🗑️</span>
        </li>
    `).join('');
}

async function seleccionarSistema(index) {
    negocioSeleccionado = esquemas[index];
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    
    renderFormulario();
    await renderTabla();
    renderSistemas();
    generarPlantillaJSON();
    await actualizarVisorJSON();
}

async function eliminarSistema(index) {
    if (!confirm(`¿Seguro que deseas eliminar "${esquemas[index].nombre}"?`)) return;
    
    const nombreEliminado = esquemas[index].nombre;
    
    try {
        const response = await fetch(`${API_URL}/schemas/${encodeURIComponent(nombreEliminado)}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Error al eliminar sistema');
        
        await cargarEsquemas();
        
        if (negocioSeleccionado?.nombre === nombreEliminado) {
            negocioSeleccionado = null;
            document.getElementById('emptyState').classList.remove('hidden');
            document.getElementById('mainContent').classList.add('hidden');
        }
        
        showAlert('Sistema eliminado', 'success');
    } catch (error) {
        console.error('Error eliminando sistema:', error);
        showAlert('Error al eliminar sistema', 'error');
    }
}

// ==================== FORMULARIO ====================
function renderFormulario() {
    document.getElementById('sistemaNombre').textContent = negocioSeleccionado.nombre;
    
    const formFields = document.getElementById('formFields');
    const campos = ordenarCampos(negocioSeleccionado.campos);
    
    formFields.innerHTML = campos.map(campo => {
        const disabled = (campo.key === 'id' && negocioSeleccionado.config.idAutomatico) ||
                         campo.type === 'calculated' || 
                         campo.type === 'age' || 
                         campo.type === 'license_status';
        
        if (campo.type === 'select') {
            return `
                <div class="form-group">
                    <label>${campo.label}</label>
                    <select name="${campo.key}" class="form-select">
                        <option value="">Selecciona...</option>
                        ${campo.options.split(',').map(opt => `<option value="${opt.trim()}">${opt.trim()}</option>`).join('')}
                    </select>
                </div>
            `;
        } else {
            const type = campo.type === 'date' ? 'date' : 'text';
            const placeholder = disabled ? 'AUTO' : '';
            
            return `
                <div class="form-group">
                    <label>${campo.label}</label>
                    <input type="${type}" 
                           name="${campo.key}" 
                           class="form-input" 
                           placeholder="${placeholder}"
                           ${disabled ? 'disabled' : ''}
                           data-config='${JSON.stringify(campo)}'>
                </div>
            `;
        }
    }).join('');
    
    formFields.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', () => {
            calcularCamposAutomaticos();
            validarInput(input);
        });
    });
}

function validarInput(input) {
    const config = JSON.parse(input.dataset.config || '{}');
    let value = input.value;
    
    if (config.type === 'number' && config.isInteger && value.includes('.')) {
        input.value = value.replace('.', '');
        return;
    }
    
    if (config.type === 'number' && value.includes('.')) {
        const parts = value.split('.');
        if (parts[1] && parts[1].length > 2) {
            input.value = parseFloat(value).toFixed(2);
        }
    }
    
    if (config.type === 'text' && config.maxLength) {
        if (value.length > parseInt(config.maxLength)) {
            input.value = value.substring(0, config.maxLength);
        }
    }
    
    if (config.type === 'number' && config.numLength) {
        const soloDigitos = value.replace('.', '');
        if (soloDigitos.length > parseInt(config.numLength)) {
            input.value = value.substring(0, value.length - 1);
        }
    }
}

function calcularCamposAutomaticos() {
    const form = document.getElementById('dataForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    negocioSeleccionado.campos.forEach(campo => {
        const input = form.querySelector(`[name="${campo.key}"]`);
        if (!input) return;
        
        if (campo.type === 'calculated' && campo.field1 && campo.field2) {
            const val1 = parseFloat(data[campo.field1]) || 0;
            const val2 = parseFloat(data[campo.field2]) || 0;
            input.value = (val1 * val2).toFixed(2);
        }
        
        if (campo.type === 'age' && campo.sourceField) {
            const valorFuente = data[campo.sourceField];
            if (valorFuente && valorFuente.trim() !== '') {
                const fechaNac = new Date(valorFuente);
                const hoy = new Date();
                if (!isNaN(fechaNac.getTime())) {
                    let edad = hoy.getFullYear() - fechaNac.getFullYear();
                    const mes = hoy.getMonth() - fechaNac.getMonth();
                    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
                        edad--;
                    }
                    if (edad >= 0 && edad < 150) {
                        input.value = edad;
                    }
                }
            }
        }
        
        if (campo.type === 'license_status' && campo.sourceField) {
            const valorFuente = data[campo.sourceField];
            if (valorFuente && valorFuente.trim() !== '') {
                const fechaVenc = new Date(valorFuente);
                const hoy = new Date();
                if (!isNaN(fechaVenc.getTime())) {
                    const estado = fechaVenc >= hoy ? 'VIGENTE' : 'VENCIDA';
                    input.value = estado;
                    input.style.color = estado === 'VENCIDA' ? '#ff0000' : '#00ff00';
                    input.style.fontWeight = 'bold';
                }
            }
        }
    });
}

async function submitData() {
    const form = document.getElementById('dataForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Mantener el ID en modo edición
    if (modoEdicion) {
        data.id = editandoId;
    }
    
    // Aplicar cálculos automáticos
    const dataCalculada = aplicarCalculos(data, negocioSeleccionado.campos);
    Object.assign(data, dataCalculada);
    
    // Validar campos requeridos
    const camposRequeridos = negocioSeleccionado.campos.filter(c => {
        if (c.key === 'id' && (negocioSeleccionado.config.idAutomatico || modoEdicion)) return false;
        if (c.type === 'calculated' || c.type === 'age' || c.type === 'license_status') return false;
        return true;
    });
    
    const hayVacios = camposRequeridos.some(c => !data[c.key] || data[c.key].toString().trim() === '');
    
    if (hayVacios) {
        showAlert('Todos los campos son obligatorios', 'warning');
        return;
    }
    
    // Convertir números
    negocioSeleccionado.campos.forEach(campo => {
        if (campo.type === 'number' && data[campo.key]) {
            data[campo.key] = campo.isInteger 
                ? parseInt(data[campo.key])
                : parseFloat(data[campo.key]);
        }
    });
    
    try {
        let response;
        
        if (modoEdicion) {
            // Actualizar registro existente
            response = await fetch(`${API_URL}/data/${editandoId}?negocio=${encodeURIComponent(negocioSeleccionado.nombre)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            // Crear nuevo registro
            response = await fetch(`${API_URL}/data?negocio=${encodeURIComponent(negocioSeleccionado.nombre)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al guardar datos');
        }
        
        form.reset();
        
        if (modoEdicion) {
            modoEdicion = false;
            editandoId = null;
            document.getElementById('btnSubmitText').textContent = 'REGISTRAR';
        }
        
        await renderTabla();
        await actualizarVisorJSON();
        showAlert('Datos guardados correctamente', 'success');
        
    } catch (error) {
        console.error('Error guardando datos:', error);
        showAlert(error.message, 'error');
    }
}

// ==================== TABLA ====================
async function renderTabla() {
    try {
        const response = await fetch(`${API_URL}/data?negocio=${encodeURIComponent(negocioSeleccionado.nombre)}`);
        if (!response.ok) throw new Error('Error al cargar datos');
        
        const datos = await response.json();
        datos.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        
        const campos = ordenarCampos(negocioSeleccionado.campos);
        
        const thead = document.getElementById('tableHead');
        thead.innerHTML = `
            <tr>
                ${campos.map(c => `<th>${c.label}</th>`).join('')}
                <th>OPC</th>
            </tr>
        `;
        
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = datos.map(row => `
            <tr>
                ${campos.map(c => {
                    let valor = row[c.key];
                    
                    // Calcular campos automáticos si no existen
                    if ((valor === undefined || valor === null || valor === '') && 
                        (c.type === 'age' || c.type === 'calculated' || c.type === 'license_status')) {
                        const temp = aplicarCalculos(row, negocioSeleccionado.campos);
                        valor = temp[c.key];
                    }
                    
                    if (c.type === 'number' && !c.isInteger && valor !== undefined && valor !== null && valor !== '') {
                        valor = parseFloat(valor).toFixed(2);
                    }
                    if (c.type === 'license_status' && valor === 'VENCIDA') {
                        return `<td style="color: #ff0000; font-weight: bold;">${valor}</td>`;
                    }
                    return `<td>${valor !== undefined && valor !== null ? valor : ''}</td>`;
                }).join('')}
                <td class="table-actions">
                    <button class="icon-btn icon-edit" onclick="editarDato(${row.id})">✏️</button>
                    <button class="icon-btn icon-delete" onclick="eliminarDato(${row.id})">🗑️</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error renderizando tabla:', error);
        showAlert('Error al cargar datos', 'error');
    }
}

async function editarDato(id) {
    try {
        const response = await fetch(`${API_URL}/data/${id}?negocio=${encodeURIComponent(negocioSeleccionado.nombre)}`);
        if (!response.ok) throw new Error('Error al cargar dato');
        
        const dato = await response.json();
        
        const form = document.getElementById('dataForm');
        Object.keys(dato).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) input.value = dato[key];
        });
        
        modoEdicion = true;
        editandoId = id;
        document.getElementById('btnSubmitText').textContent = 'ACTUALIZAR';
        
        document.querySelector('.card').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error editando dato:', error);
        showAlert('Error al cargar dato', 'error');
    }
}

async function eliminarDato(id) {
    if (!confirm('¿Eliminar este registro?')) return;
    
    try {
        const response = await fetch(`${API_URL}/data/${id}?negocio=${encodeURIComponent(negocioSeleccionado.nombre)}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Error al eliminar dato');
        
        await renderTabla();
        await actualizarVisorJSON();
        showAlert('Registro eliminado', 'success');
    } catch (error) {
        console.error('Error eliminando dato:', error);
        showAlert('Error al eliminar registro', 'error');
    }
}

// ==================== JSON ====================
function generarPlantillaJSON() {
    const plantilla = {};
    
    negocioSeleccionado.campos.forEach(campo => {
        if (campo.key === 'id' && negocioSeleccionado.config.idAutomatico) return;
        if (campo.type === 'calculated' || campo.type === 'age' || campo.type === 'license_status') return;
        
        if (campo.type === 'number' && !campo.isInteger) {
            plantilla[campo.key] = "0.00";
        } else if (campo.type === 'number') {
            plantilla[campo.key] = 0;
        } else if (campo.type === 'select') {
            plantilla[campo.key] = campo.options.split(',')[0].trim();
        } else {
            plantilla[campo.key] = "...";
        }
    });
    
    document.getElementById('jsonInput').value = JSON.stringify(plantilla, null, 2);
}

async function cargarDesdeJson() {
    try {
        const jsonText = document.getElementById('jsonInput').value.trim();
        let datosArray = [];
        
        // Permitir objeto único o array de objetos
        const parsed = JSON.parse(jsonText);
        
        if (Array.isArray(parsed)) {
            datosArray = parsed;
        } else if (typeof parsed === 'object' && parsed !== null) {
            datosArray = [parsed];
        } else {
            throw new Error('Formato inválido. Usa un objeto {} o un array de objetos []');
        }
        
        // Validar cada objeto
        const camposRequeridos = negocioSeleccionado.campos
            .filter(c => {
                if (c.key === 'id' && negocioSeleccionado.config.idAutomatico) return false;
                if (c.type === 'calculated' || c.type === 'age' || c.type === 'license_status') return false;
                return true;
            })
            .map(c => c.key);
        
        // Validar todos los objetos antes de insertar
        for (let i = 0; i < datosArray.length; i++) {
            const data = datosArray[i];
            const camposFaltantes = camposRequeridos.filter(c => !data.hasOwnProperty(c));
            
            if (camposFaltantes.length > 0) {
                showAlert(`Objeto ${i + 1}: Faltan campos: ${camposFaltantes.join(', ')}`, 'warning');
                return;
            }
            
            // Validar opciones de select
            const camposSelect = negocioSeleccionado.campos.filter(c => c.type === 'select');
            for (const campo of camposSelect) {
                const opcionesValidas = campo.options.split(',').map(o => o.trim().toLowerCase());
                const valorJson = data[campo.key];
                
                if (valorJson && !opcionesValidas.includes(valorJson.toLowerCase())) {
                    showAlert(`Objeto ${i + 1}: "${campo.label}" valor inválido: "${valorJson}". Permitidos: ${campo.options}`, 'error');
                    return;
                }
            }
        }
        
        // Aplicar cálculos a cada objeto
        const datosConCalculos = datosArray.map(data => {
            const dataCalculada = aplicarCalculos(data, negocioSeleccionado.campos);
            return { ...data, ...dataCalculada };
        });
        
        // Enviar al servidor
        const response = await fetch(`${API_URL}/data?negocio=${encodeURIComponent(negocioSeleccionado.nombre)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosConCalculos)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al cargar datos');
        }
        
        const result = await response.json();
        
        await renderTabla();
        await actualizarVisorJSON();
        showAlert(`✅ ${datosConCalculos.length} registro(s) cargado(s) correctamente`, 'success');
        
    } catch (e) {
        console.error('Error en carga JSON:', e);
        showAlert('❌ JSON inválido: ' + e.message, 'error');
    }
}

async function actualizarVisorJSON() {
    try {
        const response = await fetch(`${API_URL}/data?negocio=${encodeURIComponent(negocioSeleccionado.nombre)}`);
        if (!response.ok) throw new Error('Error al cargar datos');
        
        const datos = await response.json();
        
        const datosFormateados = datos.map(d => {
            const nuevo = {};
            
            // Primero el ID
            if (d.id !== undefined) nuevo.id = d.id;
            
            // Luego el resto de campos
            const campos = negocioSeleccionado?.campos.filter(c => c.key !== 'id') || [];
            campos.forEach(c => {
                if (d[c.key] !== undefined) {
                    if (c.type === 'number' && !c.isInteger) {
                        nuevo[c.key] = parseFloat(d[c.key]).toFixed(2);
                    } else {
                        nuevo[c.key] = d[c.key];
                    }
                }
            });
            
            return nuevo;
        });
        
        document.getElementById('jsonViewer').textContent = JSON.stringify(datosFormateados, null, 2);
    } catch (error) {
        console.error('Error actualizando visor JSON:', error);
    }
}

// ==================== UTILIDADES ====================
function ordenarCampos(campos) {
    return [...campos].sort((a, b) => a.key === 'id' ? -1 : b.key === 'id' ? 1 : 0);
}