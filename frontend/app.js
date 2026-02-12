// frontend/app.js
import { getFirestore, collection, addDoc, getDocs,
         doc, updateDoc, deleteDoc, query,
         where, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { app } from "./firebase-config.js";
import { auth, onAuthChange, login, register, logout } from "./auth.js";

const db = getFirestore(app);

// Colección por usuario
function userCol(uid, col) {
  return collection(db, `usuarios/${uid}/${col}`);
}

// ── ESQUEMAS ─────────────────────────────────────────
export async function getSchemas() {
  const uid = auth.currentUser.uid;
  const snap = await getDocs(userCol(uid, 'esquemas'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createSchema(schema) {
  const uid = auth.currentUser.uid;
  return addDoc(userCol(uid, 'esquemas'), {
    ...schema, createdAt: serverTimestamp()
  });
}

export async function deleteSchema(id) {
  const uid = auth.currentUser.uid;
  return deleteDoc(doc(db, `usuarios/${uid}/esquemas`, id));
}

// ── DATOS ─────────────────────────────────────────────
export async function getData(negocio) {
  const uid = auth.currentUser.uid;
  const q = query(userCol(uid, 'datos'), where('negocio', '==', negocio));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createRecord(negocio, contenido) {
  const uid = auth.currentUser.uid;
  return addDoc(userCol(uid, 'datos'), {
    negocio, contenido, createdAt: serverTimestamp()
  });
}

export async function updateRecord(id, contenido) {
  const uid = auth.currentUser.uid;
  return updateDoc(doc(db, `usuarios/${uid}/datos`, id),
    { contenido, updatedAt: serverTimestamp() });
}

export async function deleteRecord(id) {
  const uid = auth.currentUser.uid;
  return deleteDoc(doc(db, `usuarios/${uid}/datos`, id));
}

// ── ESCUCHAR SESIÓN ───────────────────────────────────
onAuthChange(user => {
  if (user) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
  } else {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  }
});

// Exponer globalmente para los botones del HTML
window.fb = {
  login, register, logout,
  getSchemas, createSchema, deleteSchema,
  getData, createRecord, updateRecord, deleteRecord
};

window.toggleCreator = function() {
  // CORRECCIÓN: Usar getElementById en lugar de querySelector
  const creator = document.getElementById('creatorSection'); 
  const btn = document.getElementById('btnCreatorText');

  if (!creator || !btn) return; // Evita el error si no existen

  if (creator.classList.contains('hidden')) {
    creator.classList.remove('hidden');
    btn.textContent = 'OCULTAR CREADOR';
  } else {
    creator.classList.add('hidden');
    btn.textContent = 'CREAR NUEVO NEGOCIO';
  }
};

// ==========================================
// LÓGICA DE INTERFAZ (UI) FALTANTE
// ==========================================

let camposTemporales = []; // Almacena los campos antes de guardar

// 1. Función para mostrar/ocultar opciones según el tipo
window.updateCampoConfig = function() {
    // Por ahora simplificado, puedes expandirlo luego
    console.log("Tipo de campo cambiado");
};

// 2. Función para AÑADIR CAMPO a la lista temporal
window.agregarCampo = function() {
    const label = document.getElementById('campoLabel').value;
    const type = document.getElementById('campoTipo').value;
    
    if (!label) {
        alert("Escribe un nombre para el campo");
        return;
    }

    // Agregar al array
    camposTemporales.push({ key: label.toLowerCase().replace(/ /g, '_'), label, type });

    // Renderizar vista previa
    const preview = document.getElementById('camposPreview');
    const tag = document.createElement('div');
    tag.className = 'campo-tag';
    tag.innerHTML = `<span>${label} (${type})</span> <span class="campo-tag-delete" onclick="eliminarCampoTemp('${label}')">✖</span>`;
    preview.appendChild(tag);

    // Limpiar input
    document.getElementById('campoLabel').value = '';
};

// 3. Función para GUARDAR EL SISTEMA en Firebase
window.guardarSistema = async function() {
    const nombre = document.getElementById('nuevoNombre').value;
    
    if (!nombre || camposTemporales.length === 0) {
        alert("Ingresa un nombre y al menos un campo");
        return;
    }

    try {
        document.getElementById('loading').style.display = 'block';
        
        // Usamos la función createSchema que ya tienes definida arriba
        await window.fb.createSchema({
            nombre: nombre,
            campos: camposTemporales,
            config: { idAutomatico: document.getElementById('idAutomatico').checked }
        });

        alert("¡Negocio creado exitosamente!");
        location.reload(); // Recargar para ver los cambios
    } catch (error) {
        console.error(error);
        alert("Error al guardar: " + error.message);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
};

// 4. Función auxiliar para eliminar campos de la vista previa
window.eliminarCampoTemp = function(label) {
    camposTemporales = camposTemporales.filter(c => c.label !== label);
    // Re-renderizar es más complejo, por ahora pedimos recargar si se equivocan
    // O puedes implementar una lógica de re-renderizado simple aquí.
    alert("Campo eliminado de la memoria (la vista previa no se actualizará visualmente hasta que limpies, pero no se guardará).");
};


// ==========================================
// 🚀 LÓGICA CORE (CEREBRO DE LA APP)
// ==========================================

let currentSchema = null;
let currentData = [];
let camposTemporales = []; // Para el creador de negocios

// ── 1. GESTIÓN DE SISTEMAS (SIDEBAR) ──────────────────
async function cargarSistemas() {
    const lista = document.getElementById('sistemasList');
    lista.innerHTML = '<li style="padding:10px; color:#666;">Cargando...</li>';
    
    try {
        const esquemas = await window.fb.getSchemas();
        lista.innerHTML = '';
        
        if (esquemas.length === 0) {
            lista.innerHTML = '<li style="padding:10px;">No hay sistemas. ¡Crea uno!</li>';
            return;
        }

        esquemas.forEach(schema => {
            const li = document.createElement('li');
            li.className = 'sistema-item';
            li.innerHTML = `
                <span>${schema.nombre}</span>
                <span class="delete-sistema" onclick="borrarSistema('${schema.id}', '${schema.nombre}')">×</span>
            `;
            li.onclick = (e) => {
                if(!e.target.classList.contains('delete-sistema')) seleccionarSistema(schema, li);
            };
            lista.appendChild(li);
        });
    } catch (e) {
        console.error(e);
        lista.innerHTML = '<li style="color:red;">Error al cargar</li>';
    }
}

async function seleccionarSistema(schema, elementoHtml) {
    currentSchema = schema;
    
    // UI Update
    document.querySelectorAll('.sistema-item').forEach(i => i.classList.remove('active'));
    elementoHtml.classList.add('active');
    
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    document.getElementById('sistemaNombre').textContent = schema.nombre;
    
    // Renderizar Formulario y Tabla
    renderizarFormulario(schema.campos);
    renderizarTablaEncabezados(schema.campos);
    cargarDatos(schema.nombre);
}

window.borrarSistema = async function(id, nombre) {
    if(!confirm(`¿Estás seguro de ELIMINAR todo el negocio "${nombre}" y sus datos?`)) return;
    
    try {
        await window.fb.deleteSchema(id);
        // Aquí deberíamos borrar también los datos asociados, 
        // pero por seguridad en frontend lo haremos simple por ahora.
        alert('Sistema eliminado');
        location.reload();
    } catch(e) { alert(e.message); }
};

// ── 2. GENERADOR DE FORMULARIOS (DINÁMICO) ────────────
function renderizarFormulario(campos) {
    const container = document.getElementById('formFields');
    container.innerHTML = ''; // Limpiar
    
    campos.forEach(campo => {
        const div = document.createElement('div');
        div.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = campo.label;
        
        let input;
        
        if (campo.type === 'select') {
            input = document.createElement('select');
            input.className = 'form-select';
            // Asumimos que options viene como string "a, b, c" o array
            const opts = typeof campo.options === 'string' ? campo.options.split(',') : (campo.options || []);
            opts.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.trim();
                option.textContent = opt.trim();
                input.appendChild(option);
            });
        } else {
            input = document.createElement('input');
            input.className = 'form-input';
            input.type = campo.type === 'number' || campo.type === 'calculated' || campo.type === 'age' ? 'number' : 
                         campo.type === 'date' ? 'date' : 'text';
            
            // Lógica de campos especiales
            if (campo.type === 'calculated' || campo.type === 'age') {
                input.readOnly = true;
                input.placeholder = '(Automático)';
                input.style.backgroundColor = '#111';
            }
        }
        
        input.id = `input_${campo.key}`;
        input.name = campo.key;
        input.dataset.type = campo.type; // Guardar tipo para cálculos
        
        // Listeners para cálculos en tiempo real
        input.addEventListener('input', () => calcularCampos(campos));
        
        div.appendChild(label);
        div.appendChild(input);
        container.appendChild(div);
    });
}

function calcularCampos(campos) {
    campos.forEach(target => {
        if (target.type === 'calculated') {
            const val1 = parseFloat(document.getElementById(`input_${target.field1}`)?.value) || 0;
            const val2 = parseFloat(document.getElementById(`input_${target.field2}`)?.value) || 0;
            const total = val1 * val2; // Por defecto multiplicación (puedes expandir esto)
            
            const inputTarget = document.getElementById(`input_${target.key}`);
            if(inputTarget) inputTarget.value = total.toFixed(2);
        }
        
        if (target.type === 'age' && target.sourceField) {
            const fechaStr = document.getElementById(`input_${target.sourceField}`)?.value;
            if (fechaStr) {
                const hoy = new Date();
                const nac = new Date(fechaStr);
                let edad = hoy.getFullYear() - nac.getFullYear();
                const m = hoy.getMonth() - nac.getMonth();
                if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
                    edad--;
                }
                const inputTarget = document.getElementById(`input_${target.key}`);
                if(inputTarget) inputTarget.value = edad;
            }
        }
    });
}

// ── 3. GESTIÓN DE DATOS (TABLA Y CRUD) ────────────────
async function cargarDatos(negocio) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '<tr><td colspan="100%">Cargando datos...</td></tr>';
    
    try {
        const datos = await window.fb.getData(negocio);
        currentData = datos; // Guardar referencia local
        renderizarTablaDatos(datos);
        actualizarJsonViewer(datos);
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="100%" style="color:red">Error al cargar datos</td></tr>';
    }
}

function renderizarTablaEncabezados(campos) {
    const thead = document.getElementById('tableHead');
    let html = '<tr>';
    // Siempre mostramos ID primero si es automático
    if (currentSchema.config.idAutomatico) html += '<th>ID</th>';
    
    campos.forEach(c => html += `<th>${c.label}</th>`);
    html += '<th>ACCIONES</th></tr>';
    thead.innerHTML = html;
}

function renderizarTablaDatos(datos) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    if (datos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="100%">No hay registros</td></tr>';
        return;
    }

    // Ordenar por ID descendente (más reciente arriba)
    datos.sort((a,b) => (b.contenido.id || 0) - (a.contenido.id || 0));

    datos.forEach(dato => {
        const tr = document.createElement('tr');
        const content = dato.contenido;
        
        let html = '';
        if (currentSchema.config.idAutomatico) html += `<td>${content.id || '-'}</td>`;
        
        currentSchema.campos.forEach(campo => {
            html += `<td>${content[campo.key] || ''}</td>`;
        });
        
        html += `
            <td class="table-actions">
                <button class="icon-btn icon-delete" onclick="eliminarDato('${dato.id}')">🗑️</button>
            </td>
        `;
        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
}

// ── 4. REGISTRAR DATOS (SUBMIT) ───────────────────────
window.submitData = async function() {
    if (!currentSchema) return;

    const btn = document.getElementById('btnSubmitText');
    const originalText = btn.textContent;
    btn.textContent = "GUARDANDO...";
    
    try {
        // 1. Recolectar datos del formulario
        const formData = {};
        currentSchema.campos.forEach(campo => {
            const input = document.getElementById(`input_${campo.key}`);
            let val = input.value;
            // Convertir tipos
            if (campo.type === 'number' || campo.type === 'calculated' || campo.type === 'age') {
                val = val === '' ? 0 : parseFloat(val);
            }
            formData[campo.key] = val;
        });

        // 2. Manejo de ID Automático (Simulación simple, idealmente usar contador atómico)
        if (currentSchema.config.idAutomatico) {
            const maxId = currentData.reduce((max, d) => Math.max(max, d.contenido.id || 0), 0);
            formData.id = maxId + 1;
        }

        // 3. Enviar a Firebase
        await window.fb.createRecord(currentSchema.nombre, formData);
        
        // 4. Limpiar y recargar
        document.getElementById('dataForm').reset();
        await cargarDatos(currentSchema.nombre);
        mostrarAlerta('Registro exitoso', 'success');

    } catch (e) {
        console.error(e);
        mostrarAlerta('Error: ' + e.message, 'error');
    } finally {
        btn.textContent = originalText;
    }
};

window.eliminarDato = async function(docId) {
    if(!confirm("¿Borrar este registro?")) return;
    try {
        await window.fb.deleteRecord(docId);
        cargarDatos(currentSchema.nombre);
    } catch(e) { alert(e.message); }
};

// ── 5. UTILIDADES Y CARGA INICIAL ─────────────────────
function mostrarAlerta(msg, type) {
    const alertBox = document.getElementById('alert');
    alertBox.textContent = msg;
    alertBox.className = `alert alert-${type} show`;
    setTimeout(() => alertBox.classList.remove('show'), 3000);
}

function actualizarJsonViewer(data) {
    document.getElementById('jsonViewer').textContent = JSON.stringify(data.map(d => d.contenido), null, 2);
}

// Cargar sistemas cuando inicia la app (si está logueado)
window.fb.onAuthChange(user => {
    if (user) {
        cargarSistemas();
    }
});

// ==========================================
// RESTAURACIÓN DE FUNCIONES DEL CREADOR (De tu imagen anterior)
// ==========================================
window.updateCampoConfig = function() { console.log("Tipo cambiado"); };

window.agregarCampo = function() {
    const label = document.getElementById('campoLabel').value;
    const type = document.getElementById('campoTipo').value;
    
    // Configuraciones extra
    let configExtra = {};
    if (type === 'calculated') {
        // Prompt simple para capturar campos a multiplicar (mejora esto en el UI luego)
        const f1 = prompt("Ingresa el ID del campo 1 a multiplicar (ej: precio):");
        const f2 = prompt("Ingresa el ID del campo 2 a multiplicar (ej: cantidad):");
        if(!f1 || !f2) return;
        configExtra = { field1: f1.toLowerCase(), field2: f2.toLowerCase() };
    }
    if (type === 'age') {
        const source = prompt("Ingresa el ID del campo fecha nacimiento (ej: fecha_nacimiento):");
        if(!source) return;
        configExtra = { sourceField: source.toLowerCase() };
    }

    if (!label) return alert("Nombre requerido");
    
    const key = label.toLowerCase().replace(/ /g, '_');
    camposTemporales.push({ key, label, type, ...configExtra });
    
    renderPreviewCreator();
    document.getElementById('campoLabel').value = '';
};

function renderPreviewCreator() {
    const container = document.getElementById('camposPreview');
    container.innerHTML = '';
    camposTemporales.forEach(c => {
        const tag = document.createElement('div');
        tag.className = 'campo-tag';
        tag.innerHTML = `${c.label} <small>(${c.type})</small>`;
        container.appendChild(tag);
    });
}

window.guardarSistema = async function() {
    const nombre = document.getElementById('nuevoNombre').value;
    if(!nombre || camposTemporales.length === 0) return alert("Completa los datos");
    
    try {
        await window.fb.createSchema({
            nombre, 
            campos: camposTemporales,
            config: { idAutomatico: document.getElementById('idAutomatico').checked }
        });
        alert("Sistema creado");
        location.reload();
    } catch(e) { alert(e.message); }
};
