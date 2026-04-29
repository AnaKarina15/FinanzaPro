import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut, updatePassword, verifyBeforeUpdateEmail, sendPasswordResetEmail, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

let currentUid = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUid = user.uid;
        cargarPerfil(user);
    } else {
        window.location.href = '../index.php';
    }
});

async function cargarPerfil(user) {
    try {
        let data = {};
        const docSnap = await getDoc(doc(db, "usuarios", user.uid));
        if (docSnap.exists()) {
            data = docSnap.data();
        } else {
            // Si el documento en Firestore no existe (ej: registro rápido con Google), usar info de Firebase Auth
            const nameParts = (user.displayName || "Usuario Nuevo").split(' ');
            data = {
                nombre: nameParts[0] || "",
                apellido: nameParts.slice(1).join(' ') || "",
                correo: user.email,
                moneda_principal: 'COP',
                tema_interfaz: 'claro',
                notificaciones_push: 1
            };
            // Guardar este documento base para futuros usos
            await updateDoc(doc(db, "usuarios", user.uid), data).catch(() => {
                // Si falla porque no existía, usamos setDoc en vez de updateDoc
                import("https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js").then(m => m.setDoc(doc(db, "usuarios", user.uid), data, {merge: true}));
            });
        }
        
        // Llenar inputs
        const inpNombre = document.querySelector('input[name="nombre"]');
        if(inpNombre) inpNombre.value = data.nombre || '';
        
        const inpApellido = document.querySelector('input[name="apellido"]');
        if(inpApellido) inpApellido.value = data.apellido || '';
        
        const inpCorreo = document.querySelector('input[name="correo"]');
        if(inpCorreo) inpCorreo.value = user.email || '';
        
        const inpTel = document.querySelector('input[name="telefono"]');
        if(inpTel) {
            let telLimpio = (data.telefono || '').replace(/\D/g, '');
            if(telLimpio.length > 10) telLimpio = telLimpio.slice(-10);
            inpTel.value = telLimpio;
        }
        
        // Preferencias
        const selMoneda = document.querySelector('select[name="moneda_principal"]');
        if(selMoneda) selMoneda.value = data.moneda_principal || 'COP';
        
        const temaBtns = document.querySelectorAll(".theme-toggle .toggle-btn");
        temaBtns.forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.theme-toggle .toggle-btn[data-value="${data.tema_interfaz || 'claro'}"]`);
        if(activeBtn) activeBtn.classList.add('active');
        
        const inpTema = document.getElementById('tema_interfaz');
        if(inpTema) inpTema.value = data.tema_interfaz || 'claro';

        const pushCb = document.querySelector('input[name="notificaciones_push"]');
        if (pushCb) pushCb.checked = data.notificaciones_push !== 0;

        // Header Visuals
        const hdrName = document.querySelector('.name-row h2');
        if(hdrName) hdrName.innerText = `${data.nombre || ''} ${data.apellido || ''}`.trim() || 'Sin Nombre';
        
        const hdrEmail = document.querySelector('.user-email');
        if(hdrEmail) hdrEmail.innerHTML = `<span class="material-symbols-outlined">mail</span> ${user.email}`;
        
        const avatarUrl = data.fotoPerfil || `https://ui-avatars.com/api/?name=${data.nombre}+${data.apellido}&background=059669&color=fff`;
        const avatar = document.getElementById('avatar-perfil');
        if(avatar) avatar.src = avatarUrl;

        // Sidebar Visuals
        const sideName = document.querySelector(".nav-profile .username");
        if (sideName) sideName.textContent = `${data.nombre || ''} ${data.apellido || ''}`.trim() || 'Sin Nombre';
        const avatarSidebar = document.querySelector(".nav-profile img");
        if (avatarSidebar) avatarSidebar.src = avatarUrl;
        
    } catch (error) {
        console.error("Error cargando perfil:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // --- CERRAR SESIÓN ---
    const btnLogout = document.querySelector(".btn-logout-text");
    if (btnLogout) {
        btnLogout.addEventListener("click", (e) => {
            e.preventDefault();
            Swal.fire({
                title: "¿Cerrar sesión?",
                text: "Saldrás de tu cuenta de FinanzaPro de forma segura.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#059669",
                cancelButtonColor: "#64748b",
                confirmButtonText: "Sí, salir",
                cancelButtonText: "Cancelar",
            }).then(async (result) => {
                if (result.isConfirmed) {
                    await signOut(auth);
                    window.location.href = '../index.php';
                }
            });
        });
    }

    // --- TEMA DE INTERFAZ ---
    const toggleBtns = document.querySelectorAll(".theme-toggle .toggle-btn");
    if (toggleBtns.length > 0) {
        toggleBtns.forEach((btn) => {
            btn.addEventListener("click", async function () {
                toggleBtns.forEach((b) => b.classList.remove("active"));
                this.classList.add("active");
                const nuevoTema = this.dataset.value;
                document.getElementById("tema_interfaz").value = nuevoTema;
                
                // Auto-guardar tema
                if(currentUid) {
                    try {
                        const { updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js");
                        await updateDoc(doc(db, "usuarios", currentUid), { tema_interfaz: nuevoTema });
                    } catch(e) {
                        console.error("Error guardando tema", e);
                    }
                }
            });
        });
    }

    // --- SHOW PASSWORD BUTTON ---
    const btnMostrarPass = document.getElementById("btn-mostrar-pass");
    if (btnMostrarPass) {
        btnMostrarPass.addEventListener("click", () => {
            document.getElementById("change-pass-fields").style.display = "block";
            btnMostrarPass.style.display = 'none';
        });
    }

    // --- OLVIDÉ MI CONTRASEÑA ---
    const btnOlvidePass = document.getElementById("btn-olvide-pass");
    if (btnOlvidePass) {
        btnOlvidePass.addEventListener("click", async (e) => {
            e.preventDefault();
            if(!auth.currentUser?.email) return;
            try {
                await sendPasswordResetEmail(auth, auth.currentUser.email);
                Swal.fire('Correo enviado', 'Te enviamos un enlace de recuperación a ' + auth.currentUser.email, 'success');
            } catch(error) {
                Swal.fire('Error', 'No se pudo enviar el correo de recuperación.', 'error');
            }
        });
    }

    // --- SHOW/HIDE PASSWORD INPUT ---
    document.querySelectorAll(".input-container").forEach((container) => {
        container.addEventListener("click", (event) => {
            if (Array.from(event.target.classList).includes("show-pw")) {
                const inputPW = container.querySelector(".input-pw");
                const showPW = container.querySelector(".show-pw");
                const type = inputPW.getAttribute("type") === "password" ? "text" : "password";
                inputPW.setAttribute("type", type);
                showPW.textContent = type === "password" ? "visibility" : "visibility_off";
            }
        });
    });

    // --- DESCARTAR CAMBIOS ---
    const btnDescartar = document.getElementById("btn-descartar");
    if (btnDescartar) {
        btnDescartar.addEventListener("click", () => location.reload());
    }

    // --- CAMBIAR TELÉFONO (Modal) ---
    const btnCambiarTelefono = document.getElementById("btn-cambiar-telefono");
    const modalCambiarTelefono = document.getElementById("modal-cambiar-telefono");
    if (btnCambiarTelefono && modalCambiarTelefono) {
        btnCambiarTelefono.addEventListener("click", (e) => {
            e.preventDefault();
            const formTelefono = document.getElementById('form-cambiar-telefono');
            if(formTelefono) formTelefono.reset();
            modalCambiarTelefono.classList.add("active");
        });
    }

    document.querySelectorAll('#btn-cerrar-modal-telefono, #btn-cancelar-cambiar-telefono').forEach(btn => {
        btn.addEventListener('click', () => {
            if (modalCambiarTelefono) modalCambiarTelefono.classList.remove("active");
        });
    });

    // --- ENLACES EN CONSTRUCCIÓN ---
    document.querySelectorAll(".coming-soon").forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            Swal.fire({ title: "Próximamente", text: "Esta función estará disponible pronto.", icon: "info", confirmButtonColor: "#059669" });
        });
    });

    // --- MODAL CAMBIAR CORREO ---
    const btnCambiarCorreo = document.getElementById("btn-cambiar-correo");
    const modalCambiarCorreo = document.getElementById("modal-cambiar-correo");
    if (btnCambiarCorreo && modalCambiarCorreo) {
        btnCambiarCorreo.addEventListener("click", (e) => {
            e.preventDefault();
            const formCorreo = document.getElementById('form-cambiar-correo');
            if(formCorreo) formCorreo.reset();
            modalCambiarCorreo.classList.add("active");
        });
    }

    document.querySelectorAll('#btn-cerrar-modal-correo, #btn-cancelar-cambiar-correo').forEach(btn => {
        btn.addEventListener('click', () => {
            if (modalCambiarCorreo) modalCambiarCorreo.classList.remove("active");
        });
    });

    // --- AUTO-GUARDADO Y CONTRASEÑA ---
    const formPerfil = document.getElementById('form-perfil');
    if(formPerfil) {
        // Función auxiliar para auto-guardar
        const autoGuardar = async (campo, valor) => {
            if(!currentUid) return;
            try {
                await updateDoc(doc(db, "usuarios", currentUid), { [campo]: valor });
            } catch(e) {
                console.error("Error auto-guardando", e);
            }
        };

        // Inputs de texto (guardan al quitar el foco)
        const inpNombre = formPerfil.querySelector('input[name="nombre"]');
        if(inpNombre) inpNombre.addEventListener('blur', (e) => autoGuardar('nombre', e.target.value.trim()));
        
        const inpApellido = formPerfil.querySelector('input[name="apellido"]');
        if(inpApellido) inpApellido.addEventListener('blur', (e) => autoGuardar('apellido', e.target.value.trim()));
        
        // Select y switches (guardan al cambiar)
        const selMoneda = formPerfil.querySelector('select[name="moneda_principal"]');
        if(selMoneda) selMoneda.addEventListener('change', (e) => autoGuardar('moneda_principal', e.target.value));
        
        const pushCb = formPerfil.querySelector('input[name="notificaciones_push"]');
        if(pushCb) pushCb.addEventListener('change', (e) => autoGuardar('notificaciones_push', e.target.checked ? 1 : 0));

        // El tema se engancha en la línea 125, así que voy a añadirlo arriba. Pero por si acaso, lo enganchamos al cambiar el hidden input? No, el hidden input no dispara 'change' cuando se altera por JS. Pero ya lo engancharé directamente en la parte del tema.

        // --- CAMBIAR CONTRASEÑA ---
        const btnGuardarPass = document.getElementById("btn-guardar-pass");
        if(btnGuardarPass) {
            btnGuardarPass.addEventListener('click', async (e) => {
                e.preventDefault();
                if(!currentUid) return;

                const pwdActual = formPerfil.querySelector('input[name="contrasena_actual"]')?.value;
                const pwdNew = formPerfil.querySelector('input[name="contrasena_nueva"]')?.value;
                const pwdConfirm = formPerfil.querySelector('input[name="confirmar_contrasena"]')?.value;

                if(!pwdNew) return;

                if(!pwdActual) {
                    Swal.fire('Error', 'Para cambiar tu contraseña, debes escribir tu contraseña actual.', 'warning');
                    return;
                }
                
                if(pwdNew !== pwdConfirm) {
                    Swal.fire('Error', 'Las contraseñas nuevas no coinciden.', 'error');
                    return;
                }

                btnGuardarPass.disabled = true;
                btnGuardarPass.innerText = 'Guardando...';

                try {
                    // Reautenticar
                    await signInWithEmailAndPassword(auth, auth.currentUser.email, pwdActual);
                    // Cambiar
                    await updatePassword(auth.currentUser, pwdNew);
                    
                    formPerfil.querySelector('input[name="contrasena_actual"]').value = "";
                    formPerfil.querySelector('input[name="contrasena_nueva"]').value = "";
                    formPerfil.querySelector('input[name="confirmar_contrasena"]').value = "";
                    document.getElementById("change-pass-fields").style.display = "none";
                    if(btnMostrarPass) btnMostrarPass.style.display = 'inline-flex';
                    
                    Swal.fire('¡Éxito!', 'Contraseña actualizada correctamente', 'success');
                } catch(err) {
                    if(err.code === 'auth/requires-recent-login') {
                        Swal.fire('Por seguridad', 'Debes cerrar sesión y volver a iniciarla para cambiar tu contraseña.', 'warning');
                    } else if(err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                        Swal.fire('Error', 'La contraseña actual ingresada es incorrecta.', 'error');
                    } else {
                        Swal.fire('Error', 'Ocurrió un error: ' + err.message, 'error');
                    }
                } finally {
                    btnGuardarPass.disabled = false;
                    btnGuardarPass.innerText = 'Guardar Contraseña';
                }
            });
        }

        const btnDescartarPass = document.getElementById("btn-descartar-pass");
        if(btnDescartarPass) {
            btnDescartarPass.addEventListener('click', () => {
                formPerfil.querySelector('input[name="contrasena_actual"]').value = "";
                formPerfil.querySelector('input[name="contrasena_nueva"]').value = "";
                formPerfil.querySelector('input[name="confirmar_contrasena"]').value = "";
                document.getElementById("change-pass-fields").style.display = "none";
                if(btnMostrarPass) btnMostrarPass.style.display = 'inline-flex';
            });
        }
    }

    // --- CAMBIAR CORREO (FIRESTORE) ---
    const formCorreo = document.getElementById('form-cambiar-correo');
    if(formCorreo) {
        formCorreo.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formCorreo.querySelector('.btn-modal-submit');
            btn.disabled = true;
            btn.innerText = 'Enviando...';

            const nuevoEmail = formCorreo.querySelector('input[name="nuevo_correo"]').value.trim();
            
            if (nuevoEmail.toLowerCase() === auth.currentUser.email.toLowerCase()) {
                Swal.fire('Atención', 'Este ya es tu correo actual.', 'info');
                btn.disabled = false; btn.innerText = 'Guardar correo';
                return;
            }

            try {
                await verifyBeforeUpdateEmail(auth.currentUser, nuevoEmail);
                Swal.fire('Verificación enviada', `Revisa el correo de ${nuevoEmail} para confirmar el cambio.`, 'info');
                document.getElementById('modal-cambiar-correo').classList.remove('active');
                formCorreo.reset();
            } catch(err) {
                if(err.code === 'auth/requires-recent-login') {
                    Swal.fire('Por seguridad', 'Cierra sesión y vuelve a entrar para cambiar tu correo.', 'warning');
                } else if(err.code === 'auth/email-already-in-use') {
                    Swal.fire('Error', 'Este correo electrónico ya está registrado en otra cuenta.', 'error');
                } else {
                    Swal.fire('Error', 'No se pudo enviar la verificación: ' + err.message, 'error');
                }
            } finally {
                btn.disabled = false; btn.innerText = 'Guardar correo';
            }
        });
    }

    // --- CAMBIAR TELÉFONO (FIRESTORE) ---
    const formTelefono = document.getElementById('form-cambiar-telefono');
    if(formTelefono) {
        formTelefono.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = formTelefono.querySelector('.btn-modal-submit');
            btn.disabled = true;
            btn.innerText = 'Guardando...';

            const nuevoTel = formTelefono.querySelector('input[name="nuevo_telefono"]').value;
            const telLimpio = nuevoTel.replace(/\D/g, '');
            if (telLimpio.length !== 10) {
                Swal.fire('Error', 'El número de teléfono debe tener exactamente 10 dígitos.', 'warning');
                btn.disabled = false;
                btn.innerText = 'Guardar teléfono';
                return;
            }
            
            try {
                // Actualizar en firestore
                await updateDoc(doc(db, "usuarios", currentUid), { telefono: '+57 ' + telLimpio });
                
                Swal.fire('¡Éxito!', 'Número de teléfono actualizado correctamente.', 'success');
                document.getElementById('modal-cambiar-telefono').classList.remove('active');
                formTelefono.reset();
                cargarPerfil(auth.currentUser);
            } catch(err) {
                Swal.fire('Error', 'Error al guardar el teléfono: ' + err.message, 'error');
            } finally {
                btn.disabled = false; btn.innerText = 'Guardar teléfono';
            }
        });
    }

    // --- CAMBIAR FOTO DE PERFIL (BASE64) ---
    const btnCambiarFoto = document.getElementById("btn-cambiar-foto");
    const inputFotoPerfil = document.getElementById("input-foto-perfil");

    if (btnCambiarFoto && inputFotoPerfil) {
        btnCambiarFoto.addEventListener("click", (e) => {
            e.preventDefault();
            inputFotoPerfil.click();
        });

        inputFotoPerfil.addEventListener("change", async (e) => {
            const archivo = e.target.files[0];
            if (!archivo) return;

            const tiposPermitidos = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
            if (!tiposPermitidos.includes(archivo.type)) {
                Swal.fire("Error", "Solo se permiten imágenes (PNG, JPG, WEBP)", "error");
                inputFotoPerfil.value = "";
                return;
            }

            if (archivo.size > 1024 * 1024) { // 1MB Max
                Swal.fire("Archivo muy grande", "Para usar base de datos sin costo, la imagen debe pesar menos de 1MB. Por favor recórtala o comprímela.", "error");
                inputFotoPerfil.value = "";
                return;
            }

            Swal.fire({ title: "Subiendo imagen...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

            const reader = new FileReader();
            reader.onload = async (ev) => {
                const base64 = ev.target.result;
                try {
                    await updateDoc(doc(db, "usuarios", currentUid), { fotoPerfil: base64 });
                    Swal.fire("¡Foto actualizada!", "Tu foto de perfil se ha guardado en Firestore.", "success");
                    cargarPerfil(auth.currentUser);
                } catch (error) {
                    Swal.fire("Error", "No se pudo subir la imagen", "error");
                }
            };
            reader.readAsDataURL(archivo);
            inputFotoPerfil.value = "";
        });
    }
});
