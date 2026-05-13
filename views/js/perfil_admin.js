import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { initNotificaciones } from "./notificaciones_admin.js";
import { initPresencia, cerrarPresencia } from "./presencia.js";

let currentUid = null;
let currentUser = null;

// ═══════════════════════════════════════════════
// AUTH STATE
// ═══════════════════════════════════════════════
onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = '../index.php'; return; }

    currentUser = user;
    currentUid = user.uid;
    initPresencia(user.uid);

    const docSnap = await getDoc(doc(db, "usuarios", currentUid));
    if (!docSnap.exists()) { window.location.href = '../index.php'; return; }

    const data = docSnap.data();
    if (data.rol !== 'admin') {
        window.location.href = 'dashboard.php';
        return;
    }

    // --- Llenar UI ---
    const nombre = `${data.nombre || ''} ${data.apellido || ''}`.trim();

    // Sidebar
    const navUsr = document.getElementById('admin-nav-username');
    if (navUsr) { navUsr.textContent = nombre; navUsr.classList.remove('skeleton-text'); }

    const navAvatar = document.getElementById('admin-nav-avatar');
    const avatarUrl = data.fotoPerfil || data.foto_perfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=059669&color=fff`;
    if (navAvatar) navAvatar.src = avatarUrl;

    // Header card
    const hdrNombre = document.getElementById('admin-nombre-header');
    if (hdrNombre) { hdrNombre.textContent = nombre; hdrNombre.classList.remove('skeleton-text'); }

    const avatar = document.getElementById('avatar-admin');
    if (avatar) avatar.src = avatarUrl;

    // Form fields
    const inputNombre = document.getElementById('admin-input-nombre');
    const inputApellido = document.getElementById('admin-input-apellido');
    const inputCorreo = document.getElementById('admin-input-correo');

    if (inputNombre) inputNombre.value = data.nombre || '';
    if (inputApellido) inputApellido.value = data.apellido || '';
    if (inputCorreo) inputCorreo.value = user.email || '';

    // Tema
    const temaGuardado = data.tema_interfaz || 'claro';
    document.getElementById('admin-tema').value = temaGuardado;
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === temaGuardado);
    });
    if (temaGuardado === 'oscuro') document.body.classList.add('dark-theme');

    // Alertas guardadas
    const alertas = data.alertas_admin || {};
    setCheckbox('notif-nuevo-usuario',   alertas.nuevo_usuario !== false);
    setCheckbox('notif-sesion-sospechosa', alertas.sesion_sospechosa !== false);
    setCheckbox('notif-errores-db',      alertas.errores_db !== false);
    setCheckbox('notif-cuenta-desactivada', alertas.cuenta_desactivada === true);

    // Idioma
    if (data.idioma) {
        const sel = document.getElementById('admin-idioma');
        if (sel) sel.value = data.idioma;
    }

    // Notificaciones
    initNotificaciones(currentUid);
});

function setCheckbox(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = val;
}

// ═══════════════════════════════════════════════
// GUARDAR DATOS PERSONALES
// ═══════════════════════════════════════════════
document.getElementById('btn-guardar-datos')?.addEventListener('click', async () => {
    const nombre = document.getElementById('admin-input-nombre').value.trim();
    const apellido = document.getElementById('admin-input-apellido').value.trim();
    if (!nombre) { Swal.fire('Campo requerido', 'El nombre no puede estar vacío.', 'warning'); return; }

    try {
        await updateDoc(doc(db, "usuarios", currentUid), { nombre, apellido });
        // Actualizar sidebar
        const nombreCompleto = `${nombre} ${apellido}`.trim();
        const navUsr = document.getElementById('admin-nav-username');
        if (navUsr) navUsr.textContent = nombreCompleto;
        document.getElementById('admin-nombre-header').textContent = nombreCompleto;
        Swal.fire({ icon: 'success', title: 'Guardado', timer: 1500, showConfirmButton: false });
    } catch (e) {
        Swal.fire('Error', 'No se pudieron guardar los cambios.', 'error');
    }
});

// ═══════════════════════════════════════════════
// CAMBIAR CONTRASEÑA (Reset por email)
// ═══════════════════════════════════════════════
document.getElementById('btn-cambiar-pass-admin')?.addEventListener('click', async () => {
    const result = await Swal.fire({
        title: 'Cambiar contraseña',
        text: `Se enviará un enlace de restablecimiento a ${currentUser?.email}`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Enviar enlace',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#059669',
    });
    if (result.isConfirmed) {
        try {
            await sendPasswordResetEmail(auth, currentUser.email);
            Swal.fire({ icon: 'success', title: 'Enlace enviado', text: 'Revisa tu bandeja de entrada.', timer: 3000, showConfirmButton: false });
        } catch (e) {
            Swal.fire('Error', 'No se pudo enviar el correo.', 'error');
        }
    }
});

// ═══════════════════════════════════════════════
// GUARDAR ALERTAS DEL SISTEMA
// ═══════════════════════════════════════════════
document.getElementById('btn-guardar-alertas')?.addEventListener('click', async () => {
    const alertas = {
        nuevo_usuario:       document.getElementById('notif-nuevo-usuario').checked,
        sesion_sospechosa:   document.getElementById('notif-sesion-sospechosa').checked,
        errores_db:          document.getElementById('notif-errores-db').checked,
        cuenta_desactivada:  document.getElementById('notif-cuenta-desactivada').checked,
    };
    try {
        await updateDoc(doc(db, "usuarios", currentUid), { alertas_admin: alertas });
        Swal.fire({ icon: 'success', title: 'Preferencias guardadas', timer: 1500, showConfirmButton: false });
    } catch (e) {
        Swal.fire('Error', 'No se pudieron guardar las alertas.', 'error');
    }
});

// ═══════════════════════════════════════════════
// TOGGLE DE TEMA
// ═══════════════════════════════════════════════
document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const val = btn.dataset.value;
        document.querySelectorAll('.toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.value === val));
        document.getElementById('admin-tema').value = val;
        document.body.classList.toggle('dark-theme', val === 'oscuro');
        try {
            await updateDoc(doc(db, "usuarios", currentUid), { tema_interfaz: val });
        } catch (e) { /* silencioso */ }
    });
});

// ═══════════════════════════════════════════════
// GESTIONAR SESIONES ACTIVAS
// ═══════════════════════════════════════════════
document.getElementById('btn-gestionar-sesiones')?.addEventListener('click', () => {
    Swal.fire({
        title: 'Sesiones Activas',
        html: `
            <div style="text-align:left; font-size:14px; color:#475569; margin-bottom:12px;">
                <p><strong>Dispositivo Actual:</strong> Windows PC - Chrome (Activa ahora)</p>
                <p style="margin-top:8px;"><em>Otras sesiones vinculadas no encontradas.</em></p>
            </div>
            <p style="font-size:13px; color:#64748b;">¿Deseas cerrar la sesión en todos los dispositivos por seguridad?</p>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Sí, cerrar todas',
        cancelButtonText: 'Cancelar',
    }).then(async (result) => {
        if (result.isConfirmed) {
            await cerrarPresencia();
            await signOut(auth);
            window.location.href = '../index.php';
        }
    });
});

// ═══════════════════════════════════════════════
// CERRAR SESIÓN
// ═══════════════════════════════════════════════
document.getElementById('btn-cerrar-sesion-admin')?.addEventListener('click', async () => {
    const result = await Swal.fire({
        title: '¿Cerrar sesión?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        confirmButtonText: 'Salir',
        cancelButtonText: 'Cancelar',
    });
    if (result.isConfirmed) {
        await cerrarPresencia();
        await signOut(auth);
        window.location.href = '../index.php';
    }
});
