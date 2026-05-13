import { db, auth, getMessagingInstance } from './firebase-config.js';
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
        _bindBellButton();
    }
    
    // Iniciar Firebase Cloud Messaging para notificaciones en primer plano
    _initFCM();

    // Verificar presupuestos al entrar por si alguno ya se pasó
    verificarPresupuesto(uid);
}

// VAPID Key (Web Push Certificate) — obtenla en:
// Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
const VAPID_KEY = 'BP5q8ZSgj7DEHODHO26bwY520lgVx5nvemxtX2csG32yoYtg4x5dPmiJKj6cZLINX2_ib-CbbbttVLGuyNhurcE';

async function _initFCM() {
    if (!currentUid) return;
    try {
        // 1. Verificar soporte del navegador
        if (!('serviceWorker' in navigator) || !('Notification' in window)) {
            console.warn('Este navegador no soporta notificaciones push.');
            return;
        }

        // 2. Obtener instancia de messaging (resuelve la race condition del export null)
        const messaging = await getMessagingInstance();
        if (!messaging) {
            console.warn('FCM no está soportado en este navegador/entorno.');
            return;
        }

        const { onMessage, getToken } = await import("https://www.gstatic.com/firebasejs/10.11.1/firebase-messaging.js");
        const { doc, updateDoc, getDoc, arrayUnion } = await import("https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js");

        // 3. Registrar el Service Worker para notificaciones en segundo plano
        //    Scope debe cubrir las páginas de la app (/FinanzaPro/)
        let swRegistration = null;
        try {
            swRegistration = await navigator.serviceWorker.register('../firebase-messaging-sw.js');
            console.log('Service Worker FCM registrado. Scope:', swRegistration.scope);
            
            // Esperar a que el SW esté activo antes de pedir token
            if (swRegistration.installing) {
                await new Promise((resolve) => {
                    swRegistration.installing.addEventListener('statechange', (e) => {
                        if (e.target.state === 'activated') resolve();
                    });
                });
            }
        } catch (err) {
            console.warn('Error registrando Service Worker FCM:', err);
            return;
        }

        // 4. Pedir permiso de notificaciones al usuario
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('Permiso de notificaciones denegado por el usuario.');
            return;
        }

        // 5. Obtener el token FCM y guardarlo en Firestore
        //    Se guarda como:
        //    - fcm_token (string)  → compatibilidad hacia atrás
        //    - fcm_tokens (array)  → soporte multi-dispositivo (PC + móvil)
        try {
            const tokenOptions = { vapidKey: VAPID_KEY };
            if (swRegistration) tokenOptions.serviceWorkerRegistration = swRegistration;

            const token = await getToken(messaging, tokenOptions);
            if (token) {
                console.log('Token FCM obtenido:', token.substring(0, 30) + '...');

                // Guardar token único (backward compat) + agregarlo al array de tokens
                await updateDoc(doc(db, 'usuarios', currentUid), {
                    fcm_token: token,
                    fcm_tokens: arrayUnion(token)
                });
                console.log('Token FCM guardado en Firestore (single + multi-device).');
            } else {
                console.warn('No se pudo obtener token FCM. Verifica la VAPID key y el Service Worker.');
            }
        } catch (tokenErr) {
            console.error('Error obteniendo token FCM:', tokenErr);
        }

        // 6. Escuchar notificaciones cuando la app está en primer plano
        //    (cuando la pestaña ESTÁ activa, el SW no muestra la notificación del sistema,
        //     sino que se maneja aquí con un toast de SweetAlert)
        onMessage(messaging, (payload) => {
            console.log('Notificación FCM en primer plano:', payload);
            const title = payload.notification?.title || payload.data?.titulo || 'FinanzaPro';
            const body  = payload.notification?.body  || payload.data?.mensaje || '';
            
            const Swal = window.Swal;
            if (Swal) {
                Swal.fire({
                    title: title,
                    text: body,
                    icon: 'info',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 5000
                });
            }
        });

    } catch (error) {
        console.error('Error inicializando FCM:', error);
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

// (Se eliminó enviarBienvenidaSiNecesario porque causaba un bucle si el usuario borraba todas sus notificaciones. El mensaje de bienvenida ahora solo se crea al registrarse en login.js).

// ═══════════════════════════════════════════════════════════
// TRIGGER: META DE AHORRO — al 50% y al 100%
// ═══════════════════════════════════════════════════════════
export async function verificarProgresoMeta(uid, meta) {
    if (!uid || !meta) return;
    try {
        const actual  = parseFloat(meta.monto_actual)  || 0;
        const objetivo = parseFloat(meta.monto_objetivo) || 0;
        if (objetivo <= 0) return;

        const porcentaje = (actual / objetivo) * 100;
        const nombre = meta.nombre || 'tu meta';

        // Evitar duplicados: revisar títulos existentes
        const snapCheck = await getDocs(query(collection(db, "notificaciones"), where("usuario_id", "==", uid)));
        const titulos = snapCheck.docs.map(d => d.data().titulo);

        if (porcentaje >= 100 && !titulos.some(t => t.includes('¡Lograste tu meta') && t.includes(nombre))) {
            await crearNotificacion(uid, {
                titulo: `🏆 ¡Lograste tu meta: ${nombre}!`,
                mensaje: `Has alcanzado el 100% de tu meta de ahorro. ¡Felicitaciones, es un gran logro!`,
                tipo: 'meta'
            });
        } else if (porcentaje >= 50 && porcentaje < 100 && !titulos.some(t => t.includes('Vas a la mitad') && t.includes(nombre))) {
            await crearNotificacion(uid, {
                titulo: `🎯 Vas a la mitad: ${nombre}`,
                mensaje: `Ya llevas el ${Math.round(porcentaje)}% de "${nombre}". ¡Sigue así, vas muy bien!`,
                tipo: 'meta'
            });
        }
    } catch (e) {
        console.error("Error verificando progreso de meta:", e);
    }
}

// ═══════════════════════════════════════════════════════════
// TRIGGER: GASTO INUSUAL — si supera 2× el promedio de la categoría
// ═══════════════════════════════════════════════════════════
export async function verificarGastoInusual(uid, { monto, categoria }) {
    if (!uid || !monto || !categoria) return;
    try {
        const snap = await getDocs(query(collection(db, "transacciones"), where("usuario_id", "==", uid)));
        const gastosCat = snap.docs.map(d => d.data()).filter(t => t.tipo === 'gasto' && t.categoria === categoria);

        if (gastosCat.length < 3) return; // sin historial suficiente

        const promedio = gastosCat.reduce((a, t) => a + (parseFloat(t.monto) || 0), 0) / gastosCat.length;
        const montoNum = parseFloat(monto);

        if (montoNum >= promedio * 2) {
            await crearNotificacion(uid, {
                titulo: `⚠️ Gasto inusual en ${categoria}`,
                mensaje: `Registraste $${montoNum.toLocaleString('es-CO')} en ${categoria}, que es ${(montoNum / promedio).toFixed(1)}× tu promedio habitual ($${Math.round(promedio).toLocaleString('es-CO')}). ¿Todo bien?`,
                tipo: 'alerta'
            });
        }
    } catch (e) {
        console.error("Error verificando gasto inusual:", e);
    }
}

// ═══════════════════════════════════════════════════════════
// TRIGGER: VERIFICAR PRESUPUESTOS AL INICIAR SESIÓN
// Para presupuestos que ya estaban excedidos antes del sistema de notificaciones
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// TRIGGER: VERIFICAR PRESUPUESTOS (Unificado)
// ═══════════════════════════════════════════════════════════
export async function verificarPresupuesto(uid, categoriaFiltro = null) {
    if (!uid) return;
    try {
        const now = new Date();
        const currentMonthFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const currentYearString = String(now.getFullYear());

        // 1. Obtener presupuestos y transacciones
        const [snapPres, snapTrans] = await Promise.all([
            getDocs(query(collection(db, "presupuestos"), where("id_usuario", "==", uid))),
            getDocs(query(collection(db, "transacciones"), where("usuario_id", "==", uid)))
        ]);

        const transacciones = snapTrans.docs.map(d => d.data());

        // 2. Verificar cada presupuesto
        for (const pDoc of snapPres.docs) {
            const p = pDoc.data();
            const catP = p.nombre || p.categoria || '';
            
            if (categoriaFiltro && catP !== categoriaFiltro) continue;

            const limite = parseFloat(p.monto_limite || p.limite || p.valor_limite || 0);
            if (limite <= 0) continue;

            // Retrocompatibilidad
            if (!p.tipo_periodo) {
                p.tipo_periodo = 'mensual';
                p.periodo = currentMonthFormatted;
            }

            // Calcular gasto de acuerdo al periodo del presupuesto
            let gasto = 0;
            transacciones.forEach(t => {
                if (t.tipo === 'gasto' && (t.categoria === catP || t.categoria === p.nombre)) {
                    const tMonth = t.fecha ? String(t.fecha).substring(0, 7) : ''; // YYYY-MM
                    const tYear = t.fecha ? String(t.fecha).substring(0, 4) : '';  // YYYY
                    
                    if (p.tipo_periodo === 'mensual' && tMonth === p.periodo) {
                        gasto += parseFloat(t.monto) || 0;
                    } else if (p.tipo_periodo === 'anual' && tYear === p.periodo) {
                        gasto += parseFloat(t.monto) || 0;
                    }
                }
            });

            const pct = (gasto / limite) * 100;

            const titulo100 = `🔴 ¡Límite superado! — ${catP}`;
            const titulo80  = `⚠️ Alerta 80% — ${catP}`;

            let updateData = null;
            const periodoActual = p.periodo || currentMonthFormatted;

            if (pct >= 100) {
                if (p.notificado_mes !== periodoActual || p.notificado_nivel < 100) {
                    await crearNotificacion(uid, {
                        titulo: titulo100,
                        mensaje: `Has superado el 100% de tu presupuesto de ${catP} (${gasto.toLocaleString('es-CO')} / ${limite.toLocaleString('es-CO')}).`,
                        tipo: 'alerta'
                    });
                    updateData = { notificado_mes: periodoActual, notificado_nivel: 100 };
                }
            } else if (pct >= 80) {
                // Respetar preferencia del usuario si la bandera existe (0 = false)
                if (p.alerta_80_porciento !== 0 && (p.notificado_mes !== periodoActual || p.notificado_nivel < 80)) {
                    await crearNotificacion(uid, {
                        titulo: titulo80,
                        mensaje: `Llevas el ${Math.round(pct)}% de tu presupuesto de ${catP} (${gasto.toLocaleString('es-CO')} / ${limite.toLocaleString('es-CO')}).`,
                        tipo: 'alerta'
                    });
                    updateData = { notificado_mes: periodoActual, notificado_nivel: 80 };
                }
            }

            if (updateData) {
                await updateDoc(doc(db, "presupuestos", pDoc.id), updateData);
            }
        }
    } catch (e) {
        console.error("Error verificando presupuestos:", e);
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

    // Eliminar todas las notificaciones
    document.getElementById('btn-eliminar-todas')?.addEventListener('click', async () => {
        if (!currentUid) return;

        const SwAlert = window.Swal;
        if (!SwAlert) {
            console.error('SweetAlert2 no está disponible.');
            return;
        }

        const result = await SwAlert.fire({
            title: '¿Eliminar todas las notificaciones?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar todas',
            cancelButtonText: 'Cancelar'
        });
        if (!result.isConfirmed) return;

        try {
            const q = query(collection(db, "notificaciones"), where("usuario_id", "==", currentUid));
            const snap = await getDocs(q);
            const { deleteDoc: delDoc } = await import("https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js");
            await Promise.all(snap.docs.map(d => delDoc(doc(db, "notificaciones", d.id))));
            SwAlert.fire('¡Listo!', 'Todas las notificaciones han sido eliminadas.', 'success');
        } catch (e) {
            console.error('Error eliminando notificaciones:', e);
            SwAlert.fire('Error', 'No se pudieron eliminar las notificaciones.', 'error');
        }
    });
}
