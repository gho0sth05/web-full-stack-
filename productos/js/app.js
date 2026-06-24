// js/app.js
import { db, auth } from './config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let usuarioActual = null;
let rolUsuario = "usuario";
let cacheProductos = [];

const userDisplay = document.getElementById('user-display');
const btnLogout = document.getElementById('btn-logout');
const globalAlert = document.getElementById('global-alert');
const productoForm = document.getElementById('producto-form');
const listaProductos = document.getElementById('lista-productos');
const searchBar = document.getElementById('search-bar');
const filterStock = document.getElementById('filter-stock');

// Elementos del sistema de pedidos extendido
const pedidoForm = document.getElementById('pedido-form');
const pedidoSelect = document.getElementById('pedido-select-producto');
const pedidoCantidad = document.getElementById('pedido-cantidad');
const listaPedidos = document.getElementById('lista-pedidos');

document.addEventListener('DOMContentLoaded', () => {

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            usuarioActual = user;
            await verificarRol(user.email);
            await cargarProductos();
            await cargarPedidosHistorial();
        } else {
            window.location.replace("index.html");
        }
    });

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            signOut(auth).then(() => window.location.replace("index.html"));
        });
    }

    function mostrarAlerta(msg, esError = false) {
        if (!globalAlert) return;
        globalAlert.textContent = msg.toUpperCase();
        globalAlert.style.display = "block";
        globalAlert.style.background = esError ? "rgba(239, 68, 68, 0.2)" : "rgba(0, 240, 255, 0.2)";
        globalAlert.style.border = esError ? "1px solid #ef4444" : "1px solid var(--blue-neon)";
        globalAlert.style.color = esError ? "#ef4444" : "#ffffff";
        setTimeout(() => { globalAlert.style.display = "none"; }, 3500);
    }

    async function verificarRol(correo) {
        try {
            const q = query(collection(db, "Usuarios"), where("correo", "==", correo));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const data = snap.docs[0].data();
                rolUsuario = data.rol;
                userDisplay.innerHTML = `OPERARIO: <span>${data.nombre.toUpperCase()} [${rolUsuario.toUpperCase()}]</span>`;
            }
            if (rolUsuario !== "admin") {
                const mod = document.getElementById('modulo-escritura');
                if (mod) mod.style.opacity = "0.3";
                const btn = document.getElementById('btn-form-action');
                if (btn) { btn.disabled = true; btn.textContent = "Lectura Restringida"; }
            }
        } catch (e) { console.error(e); }
    }

    // --- CRUD: LEER E INYECTAR PRODUCTOS ---
    async function cargarProductos() {
        try {
            const snap = await getDocs(collection(db, "Productos"));
            cacheProductos = [];
            
            if (pedidoSelect) pedidoSelect.innerHTML = '<option value="">-- Elige un recurso --</option>';
            
            snap.forEach(d => {
                const prodData = { id: d.id, ...d.data() };
                cacheProductos.push(prodData);
                
                // Rellenar dinámicamente el selector de pedidos
                if (pedidoSelect && prodData.stock > 0) {
                    const opt = document.createElement('option');
                    opt.value = prodData.id;
                    opt.textContent = `${prodData.nombre.toUpperCase()} (Dispo: ${prodData.stock})`;
                    pedidoSelect.appendChild(opt);
                }
            });
            ejecutarFiltros();
        } catch (e) { mostrarAlerta("Fallo de sincronización", true); }
    }

    if (productoForm) {
        productoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (rolUsuario !== "admin") return;

            const id = document.getElementById('prod-id').value;
            const nombre = document.getElementById('prod-nombre').value.trim();
            const categoria = document.getElementById('prod-categoria').value;
            const precio = parseFloat(document.getElementById('prod-precio').value);
            const stock = parseInt(document.getElementById('prod-stock').value);
            const descripcion = document.getElementById('prod-descripcion').value.trim();

            try {
                if (id === "") {
                    await addDoc(collection(db, "Productos"), { nombre, categoria, precio, stock, descripcion, fecha: new Date() });
                    mostrarAlerta("Producto registrado.");
                } else {
                    await updateDoc(doc(db, "Productos", id), { nombre, categoria, precio, stock, descripcion });
                    document.getElementById('prod-id').value = "";
                    document.getElementById('form-titulo').textContent = "Registrar Producto";
                    document.getElementById('btn-form-action').textContent = "Inyectar Producto";
                    mostrarAlerta("Producto modificado.");
                }
                productoForm.reset();
                await cargarProductos();
            } catch (err) { mostrarAlerta("Transacción fallida", true); }
        });
    }

    // --- COMPLEJIDAD AVANZADA: LÓGICA DE PEDIDOS Y VALIDACIÓN DE CONFLICTOS DE STOCK ---
    if (pedidoForm) {
        pedidoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const prodId = pedidoSelect.value;
            const cantidadSolicitada = parseInt(pedidoCantidad.value);

            if (!prodId) {
                mostrarAlerta("Selecciona un producto válido.", true);
                return;
            }

            try {
                // Leer el documento en tiempo real desde Firestore para evitar conflictos si otro usuario compró antes
                const prodRef = doc(db, "Productos", prodId);
                const prodSnap = await getDoc(prodRef);

                if (prodSnap.exists()) {
                    const productoData = prodSnap.data();
                    const stockActual = productoData.stock;

                    // VALIDACIÓN DE CONFLICTO (Equivalente al conflicto de horarios)
                    if (stockActual < cantidadSolicitada) {
                        mostrarAlerta(`Error: Conflicto de Disponibilidad. Solo quedan ${stockActual} unidades.`, true);
                        return;
                    }

                    // RESTA AUTOMÁTICA DEL STOCK EN FIRESTORE
                    const nuevoStock = stockActual - cantidadSolicitada;
                    await updateDoc(prodRef, { stock: nuevoStock });

                    // REGISTRAR MOVIMIENTO RELACIONAL EN LA COLECCIÓN "Pedidos"
                    await addDoc(collection(db, "Pedidos"), {
                        productoId: prodId,
                        productoNombre: productoData.nombre,
                        cantidad: cantidadSolicitada,
                        operarioEmail: usuarioActual.email,
                        fechaTransaccion: new Date().toLocaleDateString(),
                        estado: "DESPACHADO / ÉXITO"
                    });

                    mostrarAlerta("Pedido procesado. Inventario descontado.");
                    pedidoForm.reset();
                    await cargarProductos();
                    await cargarPedidosHistorial();
                }
            } catch (err) {
                console.error(err);
                mostrarAlerta("Fallo al procesar orden.", true);
            }
        });
    }

    // CARGAR HISTORIAL DE PEDIDOS RELACIONALES
    async function cargarPedidosHistorial() {
        if (!listaPedidos) return;
        try {
            const snap = await getDocs(collection(db, "Pedidos"));
            listaPedidos.innerHTML = "";
            
            if(snap.empty) {
                listaPedidos.innerHTML = `<tr><td colspan="5" style="color: var(--text-muted);">No hay transacciones registradas.</td></tr>`;
                return;
            }

            snap.forEach(d => {
                const p = d.data();
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${p.fechaTransaccion}</td>
                    <td style="color:var(--blue-neon);">${p.operarioEmail}</td>
                    <td><strong>${p.productoNombre.toUpperCase()}</strong></td>
                    <td>${p.cantidad}</td>
                    <td style="color:#00ff66; font-weight:600;">${p.estado}</td>
                `;
                listaPedidos.appendChild(tr);
            });
        } catch(e) {
            console.error(e);
        }
    }

    function ejecutarFiltros() {
        const txt = searchBar.value.toLowerCase().trim();
        const stk = filterStock.value;
        const res = cacheProductos.filter(p => {
            const n = p.nombre.toLowerCase().includes(txt);
            let s = true;
            if (stk === "DISPONIBLE") s = p.stock > 0;
            if (stk === "AGOTADO") s = p.stock === 0;
            return n && s;
        });
        renderizar(res);
    }

    if (searchBar) searchBar.addEventListener('input', ejecutarFiltros);
    if (filterStock) filterStock.addEventListener('change', ejecutarFiltros);

    function renderizar(lista) {
        if (!listaProductos) return;
        listaProductos.innerHTML = "";
        if (lista.length === 0) {
            listaProductos.innerHTML = `<p style="color: var(--text-muted); padding:10px;">Sector vacío.</p>`;
            return;
        }
        lista.forEach(p => {
            const div = document.createElement('div');
            div.className = "prod-card";
            const badge = p.stock > 0 ? `<span class="badge instock">Stock (${p.stock})</span>` : `<span class="badge outstock">Agotado</span>`;
            const btns = rolUsuario === "admin" ? `
                <div class="action-block">
                    <button style="background: var(--purple-neon); color:#fff;" onclick="prepararEdicion('${p.id}')">Editar</button>
                    <button style="background: rgba(239,68,68,0.2); color:#ef4444;" onclick="remover('${p.id}')">Eliminar</button>
                </div>` : `<div style="font-size:11px; color:var(--text-muted); margin-top:12px; text-align:center;">Solo Lectura</div>`;

            div.innerHTML = `<div class="prod-meta"><span style="color:var(--purple-neon); font-size:12px;">${p.categoria.toUpperCase()}</span>${badge}</div>
                <h4 style="margin:5px 0; font-size:18px; font-family:'Syne';">${p.nombre}</h4>
                <p style="color:var(--text-muted); font-size:13px; margin:5px 0;">${p.descripcion || 'Sin descripción.'}</p>
                <div class="prod-price">$${p.precio.toLocaleString()}</div>${btns}`;
            listaProductos.appendChild(div);
        });
    }

    window.prepararEdicion = async (id) => {
        const snap = await getDoc(doc(db, "Productos", id));
        if (snap.exists()) {
            const p = snap.data();
            document.getElementById('prod-id').value = id;
            document.getElementById('prod-nombre').value = p.nombre;
            document.getElementById('prod-categoria').value = p.categoria;
            document.getElementById('prod-precio').value = p.precio;
            document.getElementById('prod-stock').value = p.stock;
            document.getElementById('prod-descripcion').value = p.descripcion || "";
            document.getElementById('form-titulo').textContent = "Modificar Producto";
            document.getElementById('btn-form-action').textContent = "Actualizar Cambios";
        }
    };

    window.remover = async (id) => {
        if (confirm("¿Expulsar este producto?")) {
            await deleteDoc(doc(db, "Productos", id));
            await cargarProductos();
        }
    };
});