// js/config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// REEMPLAZA ESTE BLOQUE CON LAS CREDENCIALES DE TU NUEVO PROYECTO EN LIMPIO
const firebaseConfig = {
  apiKey: "AIzaSyAxtpLlb5E2lJCw_2DjCFoN3YaM7rG3nYE",
  authDomain: "almacen-e603b.firebaseapp.com",
  projectId: "almacen-e603b",
  storageBucket: "almacen-e603b.firebasestorage.app",
  messagingSenderId: "672504482696",
  appId: "1:672504482696:web:cfe7ef21a6f35f0596483d",
  measurementId: "G-XYP9F2T758"
};
// Inicializar Firebase de forma nativa
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);