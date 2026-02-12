// frontend/auth.js
import { getAuth, signInWithEmailAndPassword,
         createUserWithEmailAndPassword, signOut,
         onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { app } from "./firebase-config.js";

export const auth = getAuth(app);

// Login
export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Registro
export async function register(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

// Logout
export async function logout() {
  return signOut(auth);
}

// Escuchar cambios de sesión
export function onAuthChange(callback) {
  onAuthStateChanged(auth, callback);
}