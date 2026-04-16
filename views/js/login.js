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

/* Ventanas Emergentes */
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("login") && urlParams.get("login") === "error") {
    Swal.fire({
      title: "Credenciales invalidas",
      text: "Revisa que hayas puesto bien tu correo electronico y contraseña.",
      icon: "error",
      confirmButtonColor: "#059669",
      confirmButtonText: "Ok",
    });

    // Esto limpia la URL para que no vuelva a salir si recargan la página
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

    // Esto limpia la URL para que no vuelva a salir si recargan la página
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

    // Esto limpia la URL para que no vuelva a salir si recargan la página
    window.history.replaceState(null, null, window.location.pathname);
  }
});
