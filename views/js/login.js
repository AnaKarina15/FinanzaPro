import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Idioma de Firebase en Español
auth.languageCode = 'es';

// ═══════════════════════════════════════════════
// MOSTRAR / OCULTAR CONTRASEÑA
// ═══════════════════════════════════════════════
document.querySelectorAll(".pw-container").forEach((container) => {
  container.addEventListener("click", (event) => {
    if (event.target.classList.contains("show-pw")) {
      const inputPW = container.querySelector(".input-pw");
      const showPW  = container.querySelector(".show-pw");
      const isPass  = inputPW.getAttribute("type") === "password";
      inputPW.setAttribute("type", isPass ? "text" : "password");
      showPW.textContent = isPass ? "visibility_off" : "visibility";
    }
  });
});

// No permitir espacios ni tildes en contraseña
document.querySelectorAll(".input-pw").forEach((input) => {
  input.addEventListener("input", () => {
    const v = input.value;
    if (/[áéíóúÁÉÍÓÚñÑ ]/.test(v.slice(-1))) {
      input.value = v.slice(0, -1);
    }
  });
});

// ═══════════════════════════════════════════════
// ALTERNAR ENTRE FORMULARIOS (Login ↔ Registro)
// ═══════════════════════════════════════════════
document.querySelectorAll(".switch-form").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelector(".login-form")?.classList.toggle("hidden");
    document.querySelector(".register-form")?.classList.toggle("hidden");
  });
});

// ═══════════════════════════════════════════════
// REFERENCIAS A FORMULARIOS
// ═══════════════════════════════════════════════
const loginForm    = document.querySelector(".login-form");
const registerForm = document.querySelector(".register-form");
const formReset    = document.getElementById("form-restablecer");

// ═══════════════════════════════════════════════
// INICIO DE SESIÓN
// ═══════════════════════════════════════════════
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email    = document.getElementById("email_login").value.trim();
    const password = document.getElementById("login-password").value;
    const btn      = loginForm.querySelector("button[type='submit']");

    btn.disabled    = true;
    btn.textContent = "Iniciando...";

    try {
      const recordarme = document.getElementById("check-recordarme")?.checked;
      await setPersistence(auth, recordarme ? browserLocalPersistence : browserSessionPersistence);

      const { user } = await signInWithEmailAndPassword(auth, email, password);

      if (!user.emailVerified) {
        await signOut(auth);
        Swal.fire({
          title: "Verifica tu cuenta",
          text: "Revisa tu bandeja de entrada (o Spam) y haz clic en el enlace que te enviamos.",
          icon: "warning",
          confirmButtonColor: "#059669",
        });
        return;
      }

      window.location.href = "/FinanzaPro/views/dashboard.php";

    } catch (error) {
      console.error("Error login:", error.code, error.message);
      let mensaje = "Correo o contraseña incorrectos.";
      if (error.code === "auth/too-many-requests") mensaje = "Demasiados intentos fallidos. Intenta más tarde.";
      if (error.code === "auth/user-not-found")    mensaje = "No existe una cuenta con ese correo.";
      if (error.code === "auth/wrong-password")    mensaje = "Contraseña incorrecta.";

      Swal.fire({ title: "Error al iniciar sesión", text: mensaje, icon: "error", confirmButtonColor: "#059669" });
    } finally {
      btn.disabled    = false;
      btn.textContent = "Iniciar Sesión";
    }
  });
}

// ═══════════════════════════════════════════════
// REGISTRO DE USUARIO
// ═══════════════════════════════════════════════
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre     = document.getElementById("name").value.trim();
    const apellido   = document.getElementById("lastname").value.trim();
    const telefono   = document.getElementById("phone").value.trim();
    const codigoPais = document.querySelector(".select-codigo")?.value || "+57";
    const email      = document.getElementById("email_registro").value.trim();
    const password   = document.getElementById("regster-password").value;
    const btn        = registerForm.querySelector("button[type='submit']");

    // Validar teléfono
    const telLimpio = telefono.replace(/\D/g, "");
    if (telLimpio.length !== 10) {
      Swal.fire("Atención", "El número de teléfono debe tener exactamente 10 dígitos.", "warning");
      return;
    }

    btn.disabled    = true;
    btn.textContent = "Creando cuenta...";

    try {
      // 1. Crear usuario en Firebase Auth
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Guardar perfil en Firestore
      await setDoc(doc(db, "usuarios", user.uid), {
        nombre,
        apellido,
        telefono: `${codigoPais} ${telefono}`,
        email,
        fotoPerfil: "",
        fecha_creacion: new Date(),
        rol: "usuario",
        estado: "activo"
      });

      // 3. Enviar correo de verificación y cerrar sesión temporal
      await sendEmailVerification(user);
      await signOut(auth);

      await Swal.fire({
        title: "¡Casi listo!",
        text: "Te enviamos un enlace de verificación a tu correo. Haz clic en él antes de iniciar sesión.",
        icon: "info",
        confirmButtonColor: "#059669",
        confirmButtonText: "Entendido"
      });

      // Volver al formulario de login
      registerForm.classList.add("hidden");
      loginForm?.classList.remove("hidden");

    } catch (error) {
      console.error("Error registro:", error.code, error.message);
      let mensaje = "Ocurrió un error al registrar.";
      if (error.code === "auth/email-already-in-use") mensaje = "El correo ya está registrado.";
      if (error.code === "auth/weak-password")        mensaje = "La contraseña es muy débil (mínimo 6 caracteres).";
      if (error.code === "auth/invalid-email")        mensaje = "El correo no es válido.";

      Swal.fire({ title: "Error", text: mensaje, icon: "error", confirmButtonColor: "#059669" });
    } finally {
      btn.disabled    = false;
      btn.textContent = "Regístrate";
    }
  });
}

// ═══════════════════════════════════════════════
// INICIAR SESIÓN CON GOOGLE
// ═══════════════════════════════════════════════
const googleProvider = new GoogleAuthProvider();

const handleGoogleSignIn = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user   = result.user;

    const userDocRef = doc(db, "usuarios", user.uid);
    const userDoc    = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      const nombres = user.displayName ? user.displayName.split(" ") : ["Usuario", ""];
      await setDoc(userDocRef, {
        nombre: nombres[0] || "Usuario",
        apellido: nombres.slice(1).join(" ") || "",
        telefono: user.phoneNumber || "",
        email: user.email,
        fotoPerfil: user.photoURL || "",
        fecha_creacion: new Date(),
        rol: "usuario",
        estado: "activo"
      });
    }

    window.location.href = "/FinanzaPro/views/dashboard.php";
  } catch (error) {
    console.error("Error Google:", error.code, error.message);
    if (error.code !== "auth/popup-closed-by-user") {
      Swal.fire("Error", "No se pudo iniciar sesión con Google.", "error");
    }
  }
};

document.getElementById("btn-google-login")?.addEventListener("click", handleGoogleSignIn);
document.getElementById("btn-google-register")?.addEventListener("click", handleGoogleSignIn);

// ═══════════════════════════════════════════════
// RECUPERAR CONTRASEÑA
// ═══════════════════════════════════════════════
const forgotPasswordLink = document.getElementById("forgot-password-link");
const btnBackToLogin     = document.getElementById("btn-back-to-login");
const resetSendPinBtn    = document.getElementById("reset-send-pin");
const emailRecuperacion  = document.getElementById("email_recuperacion");

forgotPasswordLink?.addEventListener("click", (e) => {
  e.preventDefault();
  loginForm?.classList.add("hidden");
  registerForm?.classList.add("hidden");
  formReset?.classList.remove("hidden");
});

btnBackToLogin?.addEventListener("click", () => {
  formReset?.classList.add("hidden");
  loginForm?.classList.remove("hidden");
  if (emailRecuperacion) emailRecuperacion.value = "";
});

if (formReset) {
  formReset.addEventListener("submit", async (e) => {
    e.preventDefault();

    const correo = emailRecuperacion?.value.trim();
    if (!correo || !correo.includes("@")) {
      Swal.fire("Atención", "Ingresa un correo válido.", "warning");
      return;
    }

    if (resetSendPinBtn) {
      resetSendPinBtn.disabled    = true;
      resetSendPinBtn.textContent = "Enviando...";
    }

    try {
      await sendPasswordResetEmail(auth, correo);
      await Swal.fire({
        title: "¡Correo enviado!",
        text: "Revisa tu bandeja de entrada (o Spam) y sigue el enlace para restablecer tu contraseña.",
        icon: "success",
        confirmButtonColor: "#059669",
        confirmButtonText: "Entendido"
      });
      formReset.classList.add("hidden");
      loginForm?.classList.remove("hidden");
      if (emailRecuperacion) emailRecuperacion.value = "";
    } catch (error) {
      console.error("Error reset:", error.code);
      let mensaje = "No se pudo enviar el correo de recuperación.";
      if (error.code === "auth/user-not-found") mensaje = "No hay ninguna cuenta con ese correo.";
      Swal.fire("Error", mensaje, "error");
    } finally {
      if (resetSendPinBtn) {
        resetSendPinBtn.disabled    = false;
        resetSendPinBtn.textContent = "Enviar enlace de recuperación";
      }
    }
  });
}

// ═══════════════════════════════════════════════
// ALERTAS POR URL PARAMS (compatibilidad)
// ═══════════════════════════════════════════════
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("login") === "error") {
  Swal.fire({ title: "Credenciales inválidas", text: "Revisa tu correo y contraseña.", icon: "error", confirmButtonColor: "#059669" });
  window.history.replaceState(null, null, window.location.pathname);
}
