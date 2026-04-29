import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Forzar el idioma de los correos y las páginas de Firebase a Español
auth.languageCode = 'es';

/* SHOW/HIDE PASSWORD LOGIC */
const pwContainers = document.querySelectorAll(".pw-container");

pwContainers.forEach((container) => {
  container.addEventListener("click", (event) => {
    if (Array.from(event.target.classList).includes("show-pw")) {
      const inputPW = container.querySelector(".input-pw");
      const showPW = container.querySelector(".show-pw");

      const type =
        inputPW.getAttribute("type") === "password" ? "text" : "password";
      inputPW.setAttribute("type", type);

      showPW.textContent =
        type === "password" ? "visibility" : "visibility_off";
    }
  });
});

/* NO ACEPT SPACES ON PASSWORD */
const inputPW = document.querySelectorAll(".input-pw");

inputPW.forEach((input) => {
  input.addEventListener("input", () => {
    const inputValue = input.value;
    const ultimoChar = inputValue.slice(-1);

    if (/[áéíóúÁÉÍÓÚñÑ ]/.test(ultimoChar)) {
      input.value = inputValue.slice(0, -1);
    }
  });
});

/* DEBUG: Log pin generado para testing */
if (window.fetch) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (resource, options) => {
    return originalFetch(resource, options).then(async (response) => {
      const cloned = response.clone();
      try {
        const data = await cloned.json();
        if (data && data.pin_desarrollo) {
          console.log("PIN generado:", data.pin_desarrollo);
        }
      } catch (error) {
        // No es JSON o no tiene pin de desarrollo
      }
      return response;
    });
  };
}

/* SWITCH LOGIN/REGISTER FORM */
const switchForm = document.querySelectorAll(".switch-form");

switchForm.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const loginForm = document.querySelector(".login-form");
    const registerForm = document.querySelector(".register-form");

    loginForm.classList.toggle("hidden");
    registerForm.classList.toggle("hidden");
  });
});

/* FIREBASE LOGIN Y REGISTRO */
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector(".login-form");
  const registerForm = document.querySelector(".register-form");

  // INICIO DE SESIÓN
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email_login").value;
      const password = document.getElementById("login-password").value;
      const btn = loginForm.querySelector("button[type='submit']");
      
      try {
        btn.disabled = true;
        btn.textContent = "Iniciando...";
        
        const { setPersistence, browserLocalPersistence, browserSessionPersistence } = await import("https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js");
        const recordarme = document.getElementById("check-recordarme")?.checked;
        await setPersistence(auth, recordarme ? browserLocalPersistence : browserSessionPersistence);

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Verificamos si el correo está confirmado (Excepto si entró con Google, que ya viene verificado)
        if (!userCredential.user.emailVerified) {
          const { signOut } = await import("https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js");
          await signOut(auth); // Lo sacamos por seguridad
          
          Swal.fire({
            title: "Verifica tu cuenta",
            text: "Aún no has verificado tu correo. Revisa tu bandeja de entrada (o Spam) y haz clic en el enlace que te enviamos.",
            icon: "warning",
            confirmButtonColor: "#059669",
          });
          return;
        }

        // Redirigir al dashboard
        window.location.href = "/FinanzaPro/views/dashboard.php";
      } catch (error) {
        console.error(error);
        let mensaje = "Correo o contraseña incorrectos.";
        if (error.code === 'auth/too-many-requests') mensaje = "Demasiados intentos fallidos. Intenta más tarde.";
        
        Swal.fire({
          title: "Credenciales inválidas",
          text: mensaje,
          icon: "error",
          confirmButtonColor: "#059669",
        });
      } finally {
        btn.disabled = false;
        btn.textContent = "Iniciar Sesión";
      }
    });
  }

  // REGISTRO DE USUARIO
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const nombre = document.getElementById("name").value;
      const apellido = document.getElementById("lastname").value;
      const telefono = document.getElementById("phone").value;
      const codigoPais = document.querySelector(".select-codigo").value;
      const email = document.getElementById("email_registro").value;
      const password = document.getElementById("regster-password").value;
      const btn = registerForm.querySelector("button[type='submit']");

      try {
        btn.disabled = true;
        btn.textContent = "Creando cuenta...";

        // 0. Validar teléfono
        const telLimpio = telefono.replace(/\D/g, '');
        if (telLimpio.length !== 10) {
            Swal.fire('Error', 'El número de teléfono debe tener exactamente 10 dígitos.', 'warning');
            btn.disabled = false;
            btn.textContent = "Crear Cuenta";
            return;
        }

        // 1. Crear el usuario en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Guardar datos adicionales en Firestore
        await setDoc(doc(db, "usuarios", user.uid), {
          nombre: nombre,
          apellido: apellido,
          telefono: `${codigoPais} ${telefono}`,
          email: email,
          fecha_creacion: new Date(),
          rol: "usuario",
          estado: "activo"
        });

        // 3. Enviar correo de verificación y cerrar sesión temporalmente
        const { sendEmailVerification, signOut } = await import("https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js");
        await sendEmailVerification(user);
        await signOut(auth);

        Swal.fire({
          title: "¡Casi listo!",
          text: "Hemos enviado un enlace seguro a tu correo electrónico. Por favor, haz clic en él para verificar tu cuenta antes de iniciar sesión.",
          icon: "info",
          confirmButtonColor: "#059669",
          confirmButtonText: "Entendido"
        }).then(() => {
          // Cambiamos a la vista de login
          registerForm.classList.add("hidden");
          loginForm.classList.remove("hidden");
        });

      } catch (error) {
        console.error(error);
        let mensaje = "Ocurrió un error al registrar.";
        if (error.code === 'auth/email-already-in-use') mensaje = "El correo ya está en uso.";
        if (error.code === 'auth/weak-password') mensaje = "La contraseña es muy débil.";

        Swal.fire({
          title: "Error",
          text: mensaje,
          icon: "error",
          confirmButtonColor: "#059669",
        });
      } finally {
        btn.disabled = false;
        btn.textContent = "Regístrate";
      }
    });
  }

  // --- GOOGLE SIGN IN ---
  const googleProvider = new GoogleAuthProvider();
  
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Verificar si el usuario ya existe en Firestore, si no, crearlo
      const userDocRef = doc(db, "usuarios", user.uid);
      const userDoc = await getDoc(userDocRef);

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
      console.error(error);
      Swal.fire("Error", "No se pudo iniciar sesión con Google.", "error");
    }
  };

  const btnGoogleLogin = document.getElementById("btn-google-login");
  if (btnGoogleLogin) btnGoogleLogin.addEventListener("click", handleGoogleSignIn);

  const btnGoogleRegister = document.getElementById("btn-google-register");
  if (btnGoogleRegister) btnGoogleRegister.addEventListener("click", handleGoogleSignIn);

});

/* LÓGICA PRINCIPAL AL CARGAR LA PÁGINA (Alertas y Verificación) */
document.addEventListener("DOMContentLoaded", () => {
  // --- 1. MANEJO DE ALERTAS POR URL ---
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.has("login") && urlParams.get("login") === "error") {
    Swal.fire({
      title: "Credenciales invalidas",
      text: "Revisa que hayas puesto bien tu correo electronico y contraseña.",
      icon: "error",
      confirmButtonColor: "#059669",
      confirmButtonText: "Ok",
    });
    window.history.replaceState(null, null, window.location.pathname);
  }

  if (urlParams.has("registro") && urlParams.get("registro") === "exito") {
    Swal.fire({
      title: "¡Cuenta Creada!",
      text: "Tu registro fue exitoso. Ya puedes iniciar sesión.",
      icon: "success",
      confirmButtonColor: "#059669",
      confirmButtonText: "Genial",
    });
    window.history.replaceState(null, null, window.location.pathname);
  }

  if (urlParams.has("registro") && urlParams.get("registro") === "error") {
    Swal.fire({
      title: "Correo existente",
      text: "Ya existe una cuenta con el correo ingresado.",
      icon: "error",
      confirmButtonColor: "#059669",
      confirmButtonText: "Ok",
    });
    window.history.replaceState(null, null, window.location.pathname);
  }

  // --- 2. LÓGICA DE VERIFICACIÓN DE CUENTA ---
  const formVerificar = document.getElementById("form-verificar");
  const inputPin = document.getElementById("codigo_pin");
  const forgotPasswordLink = document.getElementById("forgot-password-link");
  const btnBackToLogin = document.getElementById("btn-back-to-login");
  const formReset = document.getElementById("form-restablecer");
  const loginForm = document.querySelector(".login-form");
  const registerForm = document.querySelector(".register-form");
  const verifyForm = document.querySelector(".verify-form");

  // Evitar que escriban letras (Solo números)
  if (inputPin) {
    inputPin.addEventListener("input", function (e) {
      this.value = this.value.replace(/[^0-9]/g, "");
      this.classList.remove("input-error");
    });
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", function (event) {
      event.preventDefault();
      if (loginForm) loginForm.classList.add("hidden");
      if (registerForm) registerForm.classList.add("hidden");
      if (verifyForm) verifyForm.classList.add("hidden");
      if (formReset) formReset.classList.remove("hidden");
    });
  }

  const resetStep1 = document.querySelector(".reset-step-1");
  const resetStep2 = document.getElementById("reset-step-2");
  const resetSendPinBtn = document.getElementById("reset-send-pin");
  const resetSubmitBtn = document.getElementById("reset-submit");
  const resetFooterText = document.getElementById("reset-footer-text");
  const emailRecuperacion = document.getElementById("email_recuperacion");

  if (btnBackToLogin) {
    btnBackToLogin.addEventListener("click", function () {
      if (formReset) formReset.classList.add("hidden");
      if (loginForm) loginForm.classList.remove("hidden");
      if (verifyForm) verifyForm.classList.add("hidden");
      if (resetStep1) resetStep1.classList.remove("hidden");
      if (resetStep2) resetStep2.classList.add("hidden");
      if (resetSendPinBtn) resetSendPinBtn.classList.remove("hidden");
      if (resetSubmitBtn) resetSubmitBtn.classList.add("hidden");
      if (emailRecuperacion) {
        emailRecuperacion.disabled = false;
        emailRecuperacion.value = "";
      }
      const pinRec = document.getElementById("pin_recuperacion");
      if (pinRec) pinRec.value = "";
      const nuevaContrasena = document.getElementById("contrasena_nueva");
      if (nuevaContrasena) nuevaContrasena.value = "";
    });
  }

  if (formReset) {
    formReset.addEventListener("submit", async function (e) {
      e.preventDefault();

      const correo = emailRecuperacion.value.trim();

      if (!correo || !correo.includes("@")) {
        Swal.fire("Atención", "Ingresa un correo válido.", "warning");
        return;
      }

      resetSendPinBtn.disabled = true;
      resetSendPinBtn.textContent = "Enviando...";

      try {
        await sendPasswordResetEmail(auth, correo);
        
        Swal.fire({
          title: "¡Correo enviado!",
          text: "Firebase te ha enviado un enlace seguro a tu correo para restablecer tu contraseña. (Revisa tu carpeta de Spam si no lo ves).",
          icon: "success",
          confirmButtonColor: "#059669",
          confirmButtonText: "Entendido",
        }).then(() => {
          // Volvemos al login principal
          formReset.classList.add("hidden");
          loginForm.classList.remove("hidden");
          emailRecuperacion.value = "";
        });

      } catch (error) {
        console.error("Error enviando reset:", error);
        let mensaje = "No se pudo enviar el correo de recuperación.";
        if (error.code === 'auth/user-not-found') {
          mensaje = "No hay ninguna cuenta registrada con este correo.";
        }
        Swal.fire("Error", mensaje, "error");
      } finally {
        resetSendPinBtn.disabled = false;
        resetSendPinBtn.textContent = "Enviar enlace de recuperación";
      }
    });
  }

  // Atrapar el evento de enviar el PIN
  if (formVerificar) {
    formVerificar.addEventListener("submit", function (e) {
      e.preventDefault();

      const correo = document.getElementById("correo_verificacion").value;
      const pin = inputPin.value;

      if (pin.length < 6) {
        inputPin.classList.add("input-error");
        Swal.fire("Atención", "El código debe tener 6 dígitos.", "warning");
        return;
      }

      fetch("index.php?action=activarCuenta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: correo, pin: pin }),
      })
        .then((response) => {
          return response.text().then((text) => {
            if (!response.ok) {
              throw new Error(text || "Error en la respuesta del servidor.");
            }
            try {
              return JSON.parse(text);
            } catch (err) {
              throw new Error("Respuesta JSON inválida: " + text);
            }
          });
        })
        .then((data) => {
          if (data.status === "success") {
            Swal.fire({
              title: "¡Bienvenido a FinanzaPro!",
              text: data.mensaje,
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            }).then(() => {
              window.location.href = "views/dashboard.php";
            });
          } else {
            inputPin.classList.add("input-error");
            inputPin.value = "";
            inputPin.focus();
            Swal.fire("Error", data.mensaje, "error");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          Swal.fire(
            "Error crítico",
            "No se pudo contactar con el servidor.",
            "error",
          );
        });
    });
  }
});
