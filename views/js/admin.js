import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getAuth, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Necesitamos la configuración de Firebase de nuevo para inicializar la segunda app
// Vamos a extraerla de la app principal
const firebaseConfig = auth.app.options;

// Inicializamos una app secundaria solo para crear cuentas de usuario
const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

let currentUid = null;
let todosLosUsuarios = [];
let paginaActual = 1;
const porPagina = 10;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUid = user.uid;
        
        // Verificar si es admin
        const docSnap = await getDoc(doc(db, "usuarios", currentUid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.rol !== 'admin') {
                Swal.fire('Acceso denegado', 'No tienes permisos de administrador', 'error').then(() => {
                    window.location.href = 'dashboard.php';
                });
                return;
            }
            
            // Actualizar info del admin en UI
            const nombreCompleto = `${data.nombre} ${data.apellido}`;
            document.getElementById('admin-nav-username').textContent = nombreCompleto;
            if (data.foto_perfil) {
                document.getElementById('admin-nav-avatar').src = data.foto_perfil;
            } else {
                document.getElementById('admin-nav-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto)}&background=059669&color=fff`;
            }

            // Iniciar carga de datos
            await cargarUsuariosFirestore();
            inicializarEventos();
        } else {
            window.location.href = '../index.php';
        }
    } else {
        window.location.href = '../index.php';
    }
});

// ========== EVENTOS ==========
function inicializarEventos() {
    document.getElementById("btn-agregar-usuario").addEventListener("click", abrirModalCrear);
    document.getElementById("btn-cerrar-modal").addEventListener("click", cerrarModal);
    document.getElementById("btn-cancelar-modal").addEventListener("click", cerrarModal);
    document.getElementById("form-usuario").addEventListener("submit", guardarUsuario);

    document.getElementById("modal-usuario").addEventListener("click", (e) => {
        if (e.target === e.currentTarget) cerrarModal();
    });

    document.getElementById("search-input").addEventListener("input", (e) => {
        const querySearch = e.target.value.toLowerCase();
        const filtrados = todosLosUsuarios.filter(u => 
            u.nombre.toLowerCase().includes(querySearch) || 
            u.apellido.toLowerCase().includes(querySearch) || 
            u.email.toLowerCase().includes(querySearch)
        );
        paginaActual = 1;
        renderizarTabla(filtrados);
    });

    document.getElementById("btn-prev").addEventListener("click", () => {
        if (paginaActual > 1) {
            paginaActual--;
            renderizarTabla(todosLosUsuarios);
        }
    });

    document.getElementById("btn-next").addEventListener("click", () => {
        const totalPaginas = Math.ceil(todosLosUsuarios.length / porPagina);
        if (paginaActual < totalPaginas) {
            paginaActual++;
            renderizarTabla(todosLosUsuarios);
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") cerrarModal();
    });
}

// ========== CARGAR USUARIOS FIRESTORE ==========
async function cargarUsuariosFirestore() {
    const tbody = document.getElementById("users-tbody");
    tbody.innerHTML = `<tr><td colspan="4"><div class="loading-spinner"></div><p>Cargando usuarios...</p></td></tr>`;

    try {
        const querySnapshot = await getDocs(collection(db, "usuarios"));
        todosLosUsuarios = [];
        querySnapshot.forEach((doc) => {
            todosLosUsuarios.push({ id: doc.id, ...doc.data() });
        });
        
        // Calcular estadísticas
        const total = todosLosUsuarios.length;
        const activos = todosLosUsuarios.filter(u => u.estado !== 'inactivo').length;
        // Asumiendo nuevos esta semana
        const nuevos = 0; 
        
        animarNumero("stat-total", total);
        animarNumero("stat-activos", activos);
        document.getElementById("stat-nuevos").textContent = `+${nuevos}`;

        renderizarTabla(todosLosUsuarios);
    } catch (error) {
        console.error("Error cargando usuarios:", error);
        tbody.innerHTML = `<tr><td colspan="4"><p>Error de conexión</p></td></tr>`;
    }
}

function animarNumero(elementId, valorFinal) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = valorFinal; // Simplificado para que no falle
}

// ========== RENDERIZAR TABLA ==========
function renderizarTabla(listaFiltrada) {
    const tbody = document.getElementById("users-tbody");

    if (!listaFiltrada || listaFiltrada.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><p>No se encontraron usuarios</p></div></td></tr>`;
        return;
    }

    const inicio = (paginaActual - 1) * porPagina;
    const fin = inicio + porPagina;
    const paginados = listaFiltrada.slice(inicio, fin);

    tbody.innerHTML = paginados.map((u, i) => {
        const nombreCompleto = `${u.nombre || ''} ${u.apellido || ''}`.trim() || 'Sin Nombre';
        const avatarUrl = u.foto_perfil ? u.foto_perfil : `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto)}&background=059669&color=fff&size=80`;

        let roleClass = u.rol === 'admin' ? "role-admin" : "role-usuario";
        let rolNombre = u.rol === 'admin' ? "Administrador" : "Usuario";

        return `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar">
                            <img src="${avatarUrl}" alt="${nombreCompleto}" />
                        </div>
                        <span class="user-name">${escapeHtml(nombreCompleto)}</span>
                    </div>
                </td>
                <td>${escapeHtml(u.email || u.correo || 'Sin correo')}</td>
                <td><span class="role-badge ${roleClass}">${rolNombre}</span></td>
                <td>
                    <div class="actions-cell">
                        <button class="btn-action btn-edit" onclick="editarUsuario('${u.id}')" title="Editar">
                            <span class="material-symbols-outlined">edit</span>
                        </button>
                        <button class="btn-action btn-delete" onclick="eliminarUsuario('${u.id}', '${escapeHtml(nombreCompleto)}')" title="Eliminar (Desactivar)">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    const totalPaginas = Math.ceil(listaFiltrada.length / porPagina);
    document.getElementById("btn-prev").disabled = paginaActual <= 1;
    document.getElementById("btn-next").disabled = paginaActual >= totalPaginas;
    document.getElementById("table-info").textContent = `Mostrando ${inicio + 1}-${Math.min(fin, listaFiltrada.length)} de ${listaFiltrada.length} usuarios`;
}

// ========== MODAL: CREAR ==========
function abrirModalCrear() {
    document.getElementById("modal-titulo").textContent = "Agregar Usuario";
    document.getElementById("btn-guardar").textContent = "Crear Usuario y Enviar Clave";
    document.getElementById("form-usuario").reset();
    document.getElementById("input-id-usuario").value = "";
    document.getElementById("input-rol").value = "usuario";
    
    // El input de correo debe ser editable
    document.getElementById("input-correo").readOnly = false;

    document.getElementById("modal-usuario").classList.add("active");
    document.getElementById("input-nombre").focus();
}

// ========== MODAL: EDITAR ==========
window.editarUsuario = async function (id) {
    const user = todosLosUsuarios.find(u => u.id === id);
    if (user) {
        document.getElementById("modal-titulo").textContent = "Editar Usuario";
        document.getElementById("btn-guardar").textContent = "Actualizar Usuario";
        document.getElementById("input-id-usuario").value = user.id;
        document.getElementById("input-nombre").value = user.nombre || '';
        document.getElementById("input-apellido").value = user.apellido || '';
        document.getElementById("input-correo").value = user.email || user.correo || '';
        document.getElementById("input-telefono").value = user.telefono || "";
        document.getElementById("input-rol").value = user.rol === 'admin' ? 'admin' : 'usuario';

        // Por seguridad, no permitimos cambiar el correo directamente en edición sin verificación
        document.getElementById("input-correo").readOnly = true;

        document.getElementById("modal-usuario").classList.add("active");
        document.getElementById("input-nombre").focus();
    }
};

// ========== GUARDAR (Crear o Actualizar) ==========
async function guardarUsuario(e) {
    e.preventDefault();

    const idUsuario = document.getElementById("input-id-usuario").value;
    const esEdicion = idUsuario !== "";
    const btn = document.getElementById("btn-guardar");
    btn.disabled = true;
    btn.textContent = "Guardando...";

    const payload = {
        nombre: document.getElementById("input-nombre").value.trim(),
        apellido: document.getElementById("input-apellido").value.trim(),
        telefono: document.getElementById("input-telefono").value.trim(),
        rol: document.getElementById("input-rol").value,
        estado: 'activo'
    };

    try {
        if (esEdicion) {
            await updateDoc(doc(db, "usuarios", idUsuario), payload);
            Swal.fire({ icon: "success", title: "Actualizado", text: "Usuario actualizado", timer: 2000, showConfirmButton: false });
        } else {
            const email = document.getElementById("input-correo").value.trim();
            payload.email = email;
            payload.fecha_creacion = new Date();

            // Usamos la app secundaria para crear la cuenta de Auth sin cerrar sesión al admin
            const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, "TemporalFinanzaPro2026!");
            const newUid = userCred.user.uid;
            
            // Cerramos sesión en la app secundaria
            await signOut(secondaryAuth);
            
            // Guardamos en firestore
            await setDoc(doc(db, "usuarios", newUid), payload);

            // Enviamos el correo para que restablezca su contraseña al ingresar
            await sendPasswordResetEmail(auth, email);

            Swal.fire({ icon: "success", title: "Creado", text: "Usuario creado exitosamente. Se envió un correo para que asigne su contraseña.", timer: 3000 });
        }
        
        cerrarModal();
        cargarUsuariosFirestore();
    } catch (error) {
        console.error("Error guardando:", error);
        Swal.fire("Error", "Ocurrió un error: " + error.message, "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "Guardar Usuario";
    }
}

// ========== ELIMINAR ==========
window.eliminarUsuario = async function (id, nombre) {
    if(id === currentUid) {
        Swal.fire("Acción no permitida", "No puedes eliminar tu propia cuenta desde aquí.", "error");
        return;
    }

    const result = await Swal.fire({
        title: "¿Desactivar usuario?",
        html: `Al estar en modo cliente, Firebase no permite borrar el login de <strong>${nombre}</strong>.<br>Pero desactivaremos su perfil en la app.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Sí, desactivar",
        cancelButtonText: "Cancelar"
    });

    if (result.isConfirmed) {
        try {
            await updateDoc(doc(db, "usuarios", id), { estado: 'inactivo' });
            Swal.fire({ icon: "success", title: "Desactivado", timer: 2000, showConfirmButton: false });
            cargarUsuariosFirestore();
        } catch (error) {
            Swal.fire("Error", "No se pudo desactivar", "error");
        }
    }
};

function cerrarModal() {
    document.getElementById("modal-usuario").classList.remove("active");
}

function escapeHtml(text) {
    if (!text) return "";
    return String(text).replace(/[&<>"']/g, function (m) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m];
    });
}
