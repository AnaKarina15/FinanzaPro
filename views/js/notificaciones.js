import { db, auth } from './firebase-config.js';
import {
    collection, query, where, getDocs, addDoc,
    updateDoc, doc, orderBy, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

let currentUid = null;
let unsubscribeNotif = null;

// ═══════════════════════════════════════════════════════════
// INICIALIZAR — llamar desde cualquier vista
// ═══════════════════════════════════════════════════════════
export function initNotificaciones(uid) {
    currentUid = uid;
    _escucharNotificaciones();

    // Garantizar que el DOM esté listo antes de bindear botones
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _bindBellButton);
    } else {
        // DOM ya está listo (caso normal cuando onAuthStateChanged dispara tarde)
        _bindBellButton();
    }
}

// ═══════════════════════════════════════════════════════════
// CREAR NOTIFICACIÓN (para llamar desde otros módulos)
// ═══════════════════════════════════════════════════════════
export async function crearNotificacion(uid, { titulo, mensaje, tipo = 'info' }) {
    try {
        const ref = await addDoc(collection(db, "notificaciones"), {
            usuario_id: uid,
            titulo,
            mensaje,
            tipo,
            leida: false,
            fecha_creacion: serverTimestamp()
        });
        console.log("Notificación creada:", ref.id);
    } catch (e) {
        console.error("Error creando notificación:", e);
    }
}

// ═══════════════════════════════════════════════════════════
// BIENVENIDA — enviar solo si el usuario no tiene ninguna aún
// Funciona para usuarios nuevos Y usuarios ya registrados
// ═══════════════════════════════════════════════════════════
export async function enviarBienvenidaSiNecesario(uid, nombre) {
    try {
        const q = query(
            collection(db, "notificaciones"),
            where("usuario_id", "==", uid)
        );
        const snap = await getDocs(q);
        // Si ya tiene notificaciones, no enviamos de nuevo
        if (!snap.empty) return;

        await crearNotificacion(uid, {
            titulo: `¡Bienvenid@ a FinanzaPro, ${nombre}! 🎉`,
            mensaje: `Nos alegra que estés aquí. Ya tienes todo listo para llevar el control de tus finanzas personales. ¡Empieza registrando tus primeros ingresos y gastos!`,
            tipo: 'meta'
        });
    } catch (e) {
        console.error("Error enviando bienvenida:", e);
    }
}

// ═══════════════════════════════════════════════════════════
// ESCUCHAR NOTIFICACIONES EN TIEMPO REAL
// ═══════════════════════════════════════════════════════════
function _escucharNotificaciones() {
    if (!currentUid) return;
    if (unsubscribeNotif) unsubscribeNotif();

    const q = query(
        collection(db, "notificaciones"),
        where("usuario_id", "==", currentUid)
    );

    unsubscribeNotif = onSnapshot(q, (snapshot) => {
        const noLeidas = snapshot.docs.filter(d => d.data().leida === false);
        _actualizarBadge(noLeidas.length);
        // Mostrar TODAS las notificaciones en el panel, ordenadas por fecha desc
        const todas = [...snapshot.docs].sort((a, b) => {
            const fa = a.data().fecha_creacion?.toMillis?.() || 0;
            const fb = b.data().fecha_creacion?.toMillis?.() || 0;
            return fb - fa;
        });
        _renderPanel(todas);
    }, (error) => {
        console.error("Error escuchando notificaciones:", error);
    });
}

// ═══════════════════════════════════════════════════════════
// ACTUALIZAR BADGE DEL ÍCONO
// ═══════════════════════════════════════════════════════════
function _actualizarBadge(count) {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    if (count > 0) {
        badge.textContent = count > 9 ? '9+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════
// RENDERIZAR PANEL DE NOTIFICACIONES
// ═══════════════════════════════════════════════════════════
function _renderPanel(docs) {
    const lista = document.getElementById('notif-lista');
    const emptyMsg = document.getElementById('notif-empty');
    if (!lista) return;

    lista.innerHTML = '';

    if (docs.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'flex';
        return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';

    const iconos = { alerta: 'warning', meta: 'emoji_events', info: 'info' };
    const colores = { alerta: '#f97316', meta: '#059669', info: '#3b82f6' };

    docs.forEach(docSnap => {
        const data = docSnap.data();
        const leida = data.leida === true;
        const fecha = data.fecha_creacion?.toDate
            ? data.fecha_creacion.toDate().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
            : 'Ahora';

        const item = document.createElement('div');
        // Notificaciones leídas se muestran más tenues
        item.className = `notif-item${leida ? ' notif-leida' : ''}`;
        item.innerHTML = `
            <div class="notif-icon-wrap" style="background:${colores[data.tipo] || colores.info}22; color:${colores[data.tipo] || colores.info}">
                <span class="material-symbols-outlined">${iconos[data.tipo] || 'info'}</span>
            </div>
            <div class="notif-content">
                <p class="notif-titulo">${data.titulo}</p>
                <p class="notif-mensaje">${data.mensaje}</p>
                <span class="notif-fecha">${fecha}</span>
            </div>
            <div class="notif-actions">
                ${!leida ? `
                <button class="notif-mark-read" data-id="${docSnap.id}" title="Marcar como leída">
                    <span class="material-symbols-outlined">check_circle</span>
                </button>` : '<span class="notif-leida-icon" title="Leída"><span class="material-symbols-outlined">done_all</span></span>'}
                <button class="notif-delete" data-id="${docSnap.id}" title="Eliminar">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        `;
        lista.appendChild(item);
    });

    // Marcar como leída
    lista.querySelectorAll('.notif-mark-read').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await updateDoc(doc(db, "notificaciones", btn.dataset.id), { leida: true });
        });
    });

    // Eliminar notificación
    lista.querySelectorAll('.notif-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const { deleteDoc: delDoc } = await import("https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js");
            await delDoc(doc(db, "notificaciones", btn.dataset.id));
        });
    });
}

// ═══════════════════════════════════════════════════════════
// BOTÓN CAMPANA — abrir/cerrar panel
// ═══════════════════════════════════════════════════════════
function _bindBellButton() {
    const btn  = document.getElementById('btn-notificaciones');
    const panel = document.getElementById('notif-panel');
    if (!btn || !panel) return;

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('open');
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && e.target !== btn) {
            panel.classList.remove('open');
        }
    });

    // Marcar todas como leídas
    document.getElementById('btn-marcar-todas')?.addEventListener('click', async () => {
        if (!currentUid) return;
        // Traer todas las notificaciones del usuario y filtrar en cliente
        const q = query(
            collection(db, "notificaciones"),
            where("usuario_id", "==", currentUid)
        );
        const snap = await getDocs(q);
        const promises = snap.docs
            .filter(d => d.data().leida === false)
            .map(d => updateDoc(doc(db, "notificaciones", d.id), { leida: true }));
        await Promise.all(promises);
    });
}
