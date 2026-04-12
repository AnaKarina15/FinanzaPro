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
