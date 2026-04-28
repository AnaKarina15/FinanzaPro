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
      const confirmarContrasena = document.getElementById(
        "confirmar_contrasena",
      );
      if (confirmarContrasena) confirmarContrasena.value = "";
      if (resetFooterText) {
        resetFooterText.innerHTML = `Si el PIN es correcto, te devolveremos al login.<br />¿Revisaste tu base de datos para ver el PIN?`;
      }
    });
  }

  if (formReset) {
    formReset.addEventListener("submit", function (e) {
      e.preventDefault();

      const correo = emailRecuperacion.value.trim();
      const pin = document.getElementById("pin_recuperacion").value.trim();
      const nuevaContrasena = document.getElementById("contrasena_nueva").value;
      const confirmarContrasena = document.getElementById(
        "confirmar_contrasena",
      ).value;
      const inputPinRec = document.getElementById("pin_recuperacion");

      if (!correo || !correo.includes("@")) {
        Swal.fire("Atención", "Ingresa un correo válido.", "warning");
        return;
      }

      if (resetStep2 && resetStep2.classList.contains("hidden")) {
        // Primer paso: solicitar el PIN de recuperación
        fetch("index.php?action=solicitarRecuperacion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo: correo }),
        })
          .then((response) => response.text())
          .then((text) => {
            try {
              return JSON.parse(text);
            } catch (err) {
              throw new Error("Respuesta JSON inválida: " + text);
            }
          })
          .then((data) => {
            if (data.status === "success") {
              if (resetStep1) resetStep1.classList.add("hidden");
              resetStep2.classList.remove("hidden");
              resetSendPinBtn.classList.add("hidden");
              resetSubmitBtn.classList.remove("hidden");
              emailRecuperacion.disabled = true;
              const sanitizedCorreo = correo
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
              resetFooterText.innerHTML = `Se envió un PIN al correo <strong>${sanitizedCorreo}</strong>.<br />¿Revisaste tu base de datos para ver el PIN?`;
              if (data.pin_desarrollo) {
                resetFooterText.innerHTML += `<br /><strong>PIN de prueba: ${data.pin_desarrollo}</strong>`;
              }
            } else {
              Swal.fire(
                "Atención",
                data.mensaje || "No se pudo enviar el PIN.",
                "warning",
              );
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

        return;
      }

      // Segundo paso: cambiar la contraseña
      if (pin.length < 6 || /[^0-9]/.test(pin)) {
        if (inputPinRec) inputPinRec.classList.add("input-error");
        Swal.fire(
          "Atención",
          "El código PIN debe tener 6 dígitos numéricos.",
          "warning",
        );
        return;
      }

      if (nuevaContrasena.length < 8) {
        Swal.fire(
          "Atención",
          "La nueva contraseña debe tener al menos 8 caracteres.",
          "warning",
        );
        return;
      }

      if (nuevaContrasena !== confirmarContrasena) {
        Swal.fire("Atención", "Las contraseñas no coinciden.", "warning");
        return;
      }

      fetch("index.php?action=restablecerContrasena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: correo,
          pin: pin,
          nueva_contrasena: nuevaContrasena,
        }),
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
              title: "Contraseña actualizada",
              text: data.mensaje,
              icon: "success",
              timer: 2000,
              showConfirmButton: false,
            }).then(() => {
              window.location.href = "index.php";
            });
          } else {
            Swal.fire({
              title: "No se pudo cambiar la contraseña",
              text: data.mensaje,
              icon: "error",
              confirmButtonColor: "#059669",
              confirmButtonText: "Volver al login",
            }).then(() => {
              window.location.href = "index.php";
            });
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          Swal.fire({
            title: "Error crítico",
            text: "No se pudo contactar con el servidor.",
            icon: "error",
            confirmButtonColor: "#059669",
            confirmButtonText: "Volver al login",
          }).then(() => {
            window.location.href = "index.php";
          });
        });
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
