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

// CORRECCIÓN PARA EL BOTÓN DE CREAR NEGOCIO
window.toggleCreator = function() {
  // 1. Usamos el ID correcto que está en tu HTML
  const creator = document.getElementById('creatorSection');
  const btn = document.getElementById('btnCreatorText');

  // 2. Verificamos si existe para evitar errores
  if (!creator || !btn) {
    console.error("Error: No se encontró la sección 'creatorSection' o el botón");
    return;
  }
  
  // 3. Usamos classList en lugar de style.display para ser compatible con tu CSS
  if (creator.classList.contains('hidden')) {
    creator.classList.remove('hidden'); // Mostrar
    btn.textContent = 'OCULTAR CREADOR';
  } else {
    creator.classList.add('hidden'); // Ocultar
    btn.textContent = 'CREAR NUEVO NEGOCIO';
  }
};