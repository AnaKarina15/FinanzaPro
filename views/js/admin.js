import { app, auth, db } from './firebase-config.js';
import { onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getAuth, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { collection, onSnapshot, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { initNotificaciones, enviarBienvenidaSiNecesario, crearNotificacion } from "./notificaciones_admin.js";
import { initPresencia } from "./presencia.js";

// Necesitamos la configuración de Firebase de nuevo para inicializar la segunda app
const firebaseConfig = app.options;

// Inicializamos una app secundaria solo para crear cuentas de usuario
const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

let currentUid = null;
let todosLosUsuarios = [];
let listaActualFiltrada = [];
let paginaActual = 1;
const porPagina = 10;
let unsubscribeUsuarios = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUid = user.uid;
        initPresencia(user.uid);
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
            const navUsr = document.getElementById('admin-nav-username'); if(navUsr) { navUsr.textContent = nombreCompleto; navUsr.classList.remove('skeleton-text'); }
            if (data.foto_perfil) {
                document.getElementById('admin-nav-avatar').src = data.foto_perfil;
            } else {
                document.getElementById('admin-nav-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto)}&background=059669&color=fff`;
            }

            // Iniciar carga de datos
            await cargarUsuariosFirestore();
            inicializarEventos();
            initNotificaciones(currentUid);
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

    // Eventos modal notificación
    document.getElementById("btn-cerrar-modal-notif").addEventListener("click", cerrarModalNotif);
    document.getElementById("btn-cancelar-notif").addEventListener("click", cerrarModalNotif);
    document.getElementById("form-notificacion").addEventListener("submit", enviarNotificacion);
    document.getElementById("modal-notificacion").addEventListener("click", (e) => {
        if (e.target === e.currentTarget) cerrarModalNotif();
    });

    window.aplicarFiltrosYRenderizar = function() {
        const querySearch = document.getElementById("search-input").value.toLowerCase();
        const filterStatus = document.getElementById("filter-status") ? document.getElementById("filter-status").value : 'todos';

        listaActualFiltrada = todosLosUsuarios.filter(u => {
            const matchesSearch = (u.nombre || '').toLowerCase().includes(querySearch) || 
                                  (u.apellido || '').toLowerCase().includes(querySearch) || 
                                  (u.email || u.correo || '').toLowerCase().includes(querySearch);
            if (!matchesSearch) return false;

            if (filterStatus === 'en_linea') return u.en_linea === true;
            if (filterStatus === 'desconectados') return u.en_linea !== true && u.estado !== 'inactivo';
            if (filterStatus === 'inactivo') return u.estado === 'inactivo';
            if (filterStatus === 'nuevos') {
                const unaSemanaAtras = new Date();
                unaSemanaAtras.setDate(unaSemanaAtras.getDate() - 7);
                if (!u.fecha_creacion) return false;
                let fecha;
                if (u.fecha_creacion.toDate) {
                    fecha = u.fecha_creacion.toDate(); 
                } else if (u.fecha_creacion.seconds) {
                    fecha = new Date(u.fecha_creacion.seconds * 1000); 
                } else if (typeof u.fecha_creacion === 'string') {
                    fecha = new Date(u.fecha_creacion);
                } else if (u.fecha_creacion instanceof Date) {
                    fecha = u.fecha_creacion;
                } else {
                    fecha = new Date(u.fecha_creacion);
                }
                if (isNaN(fecha.getTime())) return false;
                return fecha >= unaSemanaAtras;
            }
            return true;
        });

        renderizarTabla(listaActualFiltrada);
    };

    document.getElementById("search-input").addEventListener("input", () => {
        paginaActual = 1;
        aplicarFiltrosYRenderizar();
    });

    const filterStatusEl = document.getElementById("filter-status");
    if (filterStatusEl) {
        filterStatusEl.addEventListener("change", () => {
            paginaActual = 1;
            aplicarFiltrosYRenderizar();
        });
    }

    document.getElementById("btn-prev").addEventListener("click", () => {
        if (paginaActual > 1) {
            paginaActual--;
            renderizarTabla(listaActualFiltrada);
        }
    });

    document.getElementById("btn-next").addEventListener("click", () => {
        const totalPaginas = Math.ceil(listaActualFiltrada.length / porPagina);
        if (paginaActual < totalPaginas) {
            paginaActual++;
            renderizarTabla(listaActualFiltrada);
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            cerrarModal();
            cerrarModalNotif();
        }
    });
}

// ========== CARGAR USUARIOS FIRESTORE (TIEMPO REAL) ==========
function cargarUsuariosFirestore() {
    const tbody = document.getElementById("users-tbody");
    tbody.innerHTML = `<tr><td colspan="4"><div class="loading-spinner"></div><p>Cargando usuarios...</p></td></tr>`;

    // Cancelar listener anterior si existe
    if (unsubscribeUsuarios) unsubscribeUsuarios();

    return new Promise((resolve) => {
        let primeraCarga = true;
        unsubscribeUsuarios = onSnapshot(
            collection(db, "usuarios"),
            (querySnapshot) => {
                todosLosUsuarios = [];
                querySnapshot.forEach((d) => {
                    todosLosUsuarios.push({ id: d.id, ...d.data() });
                });

                const total   = todosLosUsuarios.length;
                const activos = todosLosUsuarios.filter(u => u.en_linea === true).length; // Ahora cuenta usuarios en linea

                // Calcular usuarios nuevos de los últimos 7 días
                const unaSemanaAtras = new Date();
                unaSemanaAtras.setDate(unaSemanaAtras.getDate() - 7);
                const nuevos = todosLosUsuarios.filter(u => {
                    if (!u.fecha_creacion) return false;
                    let fecha;
                    if (u.fecha_creacion.toDate) {
                        fecha = u.fecha_creacion.toDate(); // Firestore Timestamp
                    } else if (u.fecha_creacion.seconds) {
                        fecha = new Date(u.fecha_creacion.seconds * 1000); // Objeto timestamp sin prototipo
                    } else if (typeof u.fecha_creacion === 'string') {
                        // Intentar parsear si es string
                        fecha = new Date(u.fecha_creacion);
                    } else if (u.fecha_creacion instanceof Date) {
                        fecha = u.fecha_creacion;
                    } else {
                        fecha = new Date(u.fecha_creacion);
                    }
                    
                    if (isNaN(fecha.getTime())) return false;
                    return fecha >= unaSemanaAtras;
                }).length;

                animarNumero("stat-total", total);
                animarNumero("stat-activos", activos);
                document.getElementById("stat-nuevos").textContent = `+${nuevos}`;

                if (window.aplicarFiltrosYRenderizar) {
                    window.aplicarFiltrosYRenderizar();
                } else {
                    listaActualFiltrada = todosLosUsuarios;
                    renderizarTabla(listaActualFiltrada);
                }

                if (primeraCarga) { primeraCarga = false; resolve(); }
            },
            (error) => {
                console.error("Error tiempo real:", error);
                tbody.innerHTML = `<tr><td colspan="4"><p>Error de conexión</p></td></tr>`;
                resolve();
            }
        );
    });
}

function animarNumero(elementId, valorFinal) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    const duration = 1000; 
    const start = parseInt(el.textContent) || 0;
    const end = parseInt(valorFinal) || 0;
    
    if (start === end) {
        el.textContent = end;
        return;
    }
    
    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    
    const timer = setInterval(() => {
        current += increment;
        el.textContent = current;
        if (current === end) {
            clearInterval(timer);
        }
    }, stepTime > 0 ? stepTime : 10);
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
        const esActivo = u.estado !== 'inactivo';
        
        const isCurrent = (u.id === currentUid);
        const tuEtiqueta = isCurrent ? ' <span style="font-size: 12px; color: #94a3b8; font-weight: 500; margin-left: 4px;">(Tú)</span>' : '';
        
        const estadoClass = esActivo ? 'btn-toggle-active' : 'btn-toggle-inactive';
        const estadoIcon = esActivo ? 'toggle_on' : 'toggle_off';
        
        let editAttr = isCurrent ? 'disabled title="Edita tus datos desde Mi Perfil"' : 'title="Editar" onclick="editarUsuario(\'' + u.id + '\')"';
        let toggleAttr = isCurrent ? 'disabled title="No puedes suspender tu propia cuenta"' : 'title="' + (esActivo ? 'Deshabilitar usuario' : 'Habilitar usuario') + '" onclick="toggleEstadoUsuario(\'' + u.id + '\', \'' + escapeHtml(nombreCompleto) + '\', ' + esActivo + ')"';
        let notifAttr = isCurrent ? 'disabled title="No puedes enviarte notificaciones a ti mismo"' : 'title="Enviar notificación" onclick="abrirModalNotificacion(\'' + u.id + '\', \'' + escapeHtml(nombreCompleto) + '\')"';

        // Indicador En Línea
        const isOnline = u.en_linea === true;
        const onlineText = isOnline ? 'En línea' : 'Desconectado';
        const onlineDotClass = isOnline ? 'online-dot active' : 'online-dot';

        return `
            <tr class="${esActivo ? '' : 'row-inactive'}">
                <td>
                    <div class="user-cell">
                        <div class="user-avatar">
                            <img src="${avatarUrl}" alt="${nombreCompleto}" />
                        </div>
                        <div>
                            <span class="user-name">${escapeHtml(nombreCompleto)}</span>
                            ${!esActivo ? '<span class="badge-deshabilitado">Deshabilitado</span>' : ''}
                        </div>
                    </div>
                </td>
                <td>${escapeHtml(u.email || u.correo || 'Sin correo')}</td>
                <td><span class="role-badge ${roleClass}">${rolNombre}</span>${tuEtiqueta}</td>
                <td>
                    <div class="online-status">
                        <span class="${onlineDotClass}"></span>
                        <span class="online-text">${onlineText}</span>
                    </div>
                </td>
                <td>
                    <div class="actions-cell">
                        <button class="btn-action btn-edit" ${editAttr} style="${isCurrent ? 'opacity: 0.4; cursor: not-allowed;' : ''}">
                            <span class="material-symbols-outlined">edit</span>
                        </button>
                        <button class="btn-action btn-notif" ${notifAttr} style="${isCurrent ? 'opacity: 0.4; cursor: not-allowed;' : ''}">
                            <span class="material-symbols-outlined">notification_add</span>
                        </button>
                        <button class="btn-action ${estadoClass}" ${toggleAttr} style="${isCurrent ? 'opacity: 0.4; cursor: not-allowed;' : ''}">
                            <span class="material-symbols-outlined">${estadoIcon}</span>
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
        // onSnapshot actualiza la tabla automáticamente
    } catch (error) {
        console.error("Error guardando:", error);
        Swal.fire("Error", "Ocurrió un error: " + error.message, "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "Guardar Usuario";
    }
}

// ========== TOGGLE ESTADO (ACTIVAR / DESACTIVAR) ==========
window.toggleEstadoUsuario = async function (id, nombre, esActivo) {
    if(id === currentUid) {
        Swal.fire("Acción no permitida", "No puedes modificar tu propia cuenta desde aquí.", "error");
        return;
    }

    const accion = esActivo ? 'deshabilitar' : 'habilitar';
    const btnColor = esActivo ? '#ef4444' : '#059669';
    const icon = esActivo ? 'warning' : 'question';
    const nuevoEstado = esActivo ? "inactivo" : "activo";

    const result = await Swal.fire({
        title: `¿${esActivo ? 'Deshabilitar' : 'Habilitar'} usuario?`,
        html: `Se ${accion}á la cuenta de <strong>${nombre}</strong> en la plataforma.`,
        icon,
        showCancelButton: true,
        confirmButtonColor: btnColor,
        confirmButtonText: `Sí, ${accion}`,
        cancelButtonText: "Cancelar"
    });

    if (result.isConfirmed) {
        try {
            await updateDoc(doc(db, "usuarios", id), { estado: nuevoEstado });
            Swal.fire({ icon: "success", title: esActivo ? "Usuario deshabilitado" : "Usuario habilitado", timer: 2000, showConfirmButton: false });
            // onSnapshot actualiza la tabla automáticamente
        } catch (error) {
            Swal.fire("Error", "No se pudo actualizar el estado", "error");
        }
    }
};

function cerrarModal() {
    document.getElementById("modal-usuario").classList.remove("active");
}

// ========== MODAL NOTIFICACIÓN: ABRIR ==========
window.abrirModalNotificacion = function (uid, nombre) {
    document.getElementById("form-notificacion").reset();
    document.getElementById("modal-notif-titulo").textContent = `Enviar Notificación a ${nombre}`;
    document.getElementById("input-notif-uid").value = uid;
    document.getElementById("modal-notificacion").classList.add("active");
    document.getElementById("input-notif-titulo").focus();
};

// ========== MODAL NOTIFICACIÓN: CERRAR ==========
function cerrarModalNotif() {
    document.getElementById("modal-notificacion").classList.remove("active");
}

// ========== MODAL NOTIFICACIÓN: ENVIAR ==========
async function enviarNotificacion(e) {
    e.preventDefault();

    const uid = document.getElementById("input-notif-uid").value;
    const titulo = document.getElementById("input-notif-titulo").value.trim();
    const mensaje = document.getElementById("input-notif-mensaje").value.trim();
    const btn = document.getElementById("btn-enviar-notif");

    if (!uid || !titulo || !mensaje) return;

    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">hourglass_top</span> Enviando...';

    try {
        await crearNotificacion(uid, { titulo, mensaje, tipo: 'info' });
        cerrarModalNotif();
        Swal.fire({ icon: 'success', title: 'Notificación enviada', text: 'La notificación fue enviada correctamente.', timer: 2500, showConfirmButton: false });
    } catch (error) {
        console.error('Error enviando notificación:', error);
        Swal.fire('Error', 'No se pudo enviar la notificación: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">send</span> Enviar';
    }
}

function escapeHtml(text) {
    if (!text) return "";
    return String(text).replace(/[&<>"']/g, function (m) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m];
    });
}

// ═══════════════════════════════════════════════
// FORMATO DE TELÉFONO (MÁSCARA)
// ═══════════════════════════════════════════════
document.addEventListener('input', function (e) {
  const isPhoneInput = e.target.name === 'telefono' || e.target.name === 'nuevo_telefono' || e.target.id === 'phone' || e.target.id === 'input-telefono';
  if (isPhoneInput) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3 && value.length <= 6) {
      value = `${value.slice(0, 3)} ${value.slice(3)}`;
    } else if (value.length > 6) {
      value = `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6, 10)}`;
    }
    e.target.value = value;
  }
});
