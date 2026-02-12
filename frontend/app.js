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