// js/auth.js
import { db, auth } from './config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const alertBox = document.getElementById('alert-msg');
const loginForm = document.getElementById('login-form');
const registroForm = document.getElementById('registro-form');

function mostrarFeedback(msg, esError = false) {
    if (!alertBox) return;
    alertBox.textContent = msg.toUpperCase();
    alertBox.style.display = "block";
    alertBox.style.background = esError ? "rgba(239, 68, 68, 0.2)" : "rgba(0, 240, 255, 0.2)";
    alertBox.style.border = esError ? "1px solid #ef4444" : "1px solid #00f0ff";
    alertBox.style.color = esError ? "#ef4444" : "#ffffff";
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const pass = document.getElementById('login-password').value;
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            window.location.replace("dashboard.html");
        } catch (err) {
            console.error(err);
            mostrarFeedback("Credenciales incorrectas o servidor caído", true);
        }
    });
}

if (registroForm) {
    registroForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('reg-nombre').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const rol = document.getElementById('reg-rol').value;
        const pass = document.getElementById('reg-password').value;

        if (pass.length < 6) {
            mostrarFeedback("Contraseña debe tener mínimo 6 caracteres", true);
            return;
        }
        try {
            await createUserWithEmailAndPassword(auth, email, pass);
            await addDoc(collection(db, "Usuarios"), {
                nombre, correo: email, rol, fechaAlta: new Date()
            });
            mostrarFeedback("Alta registrada. Redirigiendo...");
            setTimeout(() => { window.location.replace("dashboard.html"); }, 1500);
        } catch (err) {
            console.error(err);
            mostrarFeedback("Fallo de inyección o correo duplicado", true);
        }
    });
}