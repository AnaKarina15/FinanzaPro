/* SHOW/HIDE PASSWORD LOGIC */
const pwContainers = document.querySelectorAll(".pw-container");

pwContainers.forEach((container) => {
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
  const formVerificar = document.getElementById('form-verificar');
  const inputPin = document.getElementById('codigo_pin');

  // Evitar que escriban letras (Solo números)
  if (inputPin) {
    inputPin.addEventListener('input', function(e) {
      this.value = this.value.replace(/[^0-9]/g, '');
      this.classList.remove('input-error');
    });
  }

  // Atrapar el evento de enviar el PIN
  if (formVerificar) {
      formVerificar.addEventListener('submit', function(e) {
          e.preventDefault();
          
          const correo = document.getElementById('correo_verificacion').value;
          const pin = inputPin.value;

          if (pin.length < 6) {
              inputPin.classList.add('input-error');
              Swal.fire('Atención', 'El código debe tener 6 dígitos.', 'warning');
              return;
          }

          fetch('index.php?action=activarCuenta', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ correo: correo, pin: pin })
          })
          .then(response => response.json())
          .then(data => {
              if (data.status === 'success') {
                  Swal.fire({
                      title: '¡Bienvenido a FinanzaPro!',
                      text: data.mensaje,
                      icon: 'success',
                      timer: 2000,
                      showConfirmButton: false
                  }).then(() => {
                      window.location.href = 'views/dashboard.php';
                  });
              } else {
                  inputPin.classList.add('input-error');
                  inputPin.value = '';
                  inputPin.focus();
                  Swal.fire('Error', data.mensaje, 'error');
              }
          })
          .catch(error => {
              console.error('Error:', error);
              Swal.fire('Error crítico', 'No se pudo contactar con el servidor.', 'error');
          });
      });
  }
});