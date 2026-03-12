document.addEventListener("DOMContentLoaded", () => {
    
    const loginForm = document.querySelector(".login-form");

    // Lógica para el formulario de Login
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault(); // Evita que la página recargue con URL sucia

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            if (email !== "" && password !== "") {
                // Redirigir al dashboard
                window.location.href = "dashboard.html";
            } else {
                alert("Por favor, llena todos los campos.");
            }
        });
    }
});