// Espera a que todo el HTML de la página termine de cargar antes de ejecutar este código
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. MANEJO DE VISTAS (LOGIN VS REGISTRO)
    
    // Seleccionamos los elementos de las tarjetas y los botones del HTML
    const tarjetaLogin = document.getElementById("tarjeta-login");
    const tarjetaRegistro = document.getElementById("tarjeta-registro");
    const btnIrRegistro = document.getElementById("btn-ir-registro");
    const btnIrLogin = document.getElementById("btn-ir-login");
    const btnHeaderLogin = document.getElementById("btn-header-login");

    // Función para mostrar la tarjeta de Login y ocultar la de Registro
    const mostrarLogin = (e) => {
        if(e) e.preventDefault(); // Evita que la página se recargue al hacer clic
        tarjetaRegistro.style.display = "none";
        tarjetaLogin.style.display = "flex";
        tarjetaLogin.style.flexDirection = "column";
        tarjetaLogin.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Desliza la pantalla hacia la tarjeta
    };

    // Asignamos los eventos de "clic" a los botones para cambiar entre pantallas
    if (btnIrRegistro && btnIrLogin) {
        // Al hacer clic en "Regístrate"
        btnIrRegistro.addEventListener("click", (e) => {
            e.preventDefault();
            tarjetaLogin.style.display = "none";
            tarjetaRegistro.style.display = "flex";
            tarjetaRegistro.style.flexDirection = "column";
            tarjetaRegistro.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        
        // Al hacer clic en "Inicia Sesión"
        btnIrLogin.addEventListener("click", mostrarLogin);
        if(btnHeaderLogin) btnHeaderLogin.addEventListener("click", mostrarLogin);
    }

    // 2. VALIDACIONES DE FORMULARIOS

    // Validación básica para el formulario de Login (evita que se envíe vacío)
    const loginForm = document.querySelector(".login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            // Si el correo o la contraseña están vacíos, detiene el envío y muestra una alerta
            if (email === "" || password === "") {
                e.preventDefault(); 
                alert("Por favor, llena todos los campos.");
            }
        });
    }

    // Validación avanzada para el formulario de Registro (seguridad de contraseña)
    const registroForm = document.querySelector(".formulario-registro");
    if (registroForm) {
        registroForm.addEventListener("submit", (e) => {
            const inputPassword = document.getElementById("password-registro");
            const mensajeError = document.getElementById("mensaje-error-pass");
            const password = inputPassword.value;
            
            // Expresión regular que exige: 1 minúscula, 1 mayúscula, 1 número y mínimo 8 caracteres
            const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

            // Si la contraseña no cumple las reglas, detiene el envío y muestra el texto en rojo
            if (!regexPassword.test(password)) {
                e.preventDefault(); 
                inputPassword.classList.add("input-error");
                mensajeError.classList.add("texto-error");
                mensajeError.innerHTML = '<span class="material-symbols-outlined" style="font-size: 14px;">error</span> mínimo 8 caracteres, una mayúscula, minúscula y número';
            } else {
                // Si la contraseña es válida, quita los estilos de error
                inputPassword.classList.remove("input-error");
                mensajeError.classList.remove("texto-error");
            }
        });
    }


    // 3. RESTRICCIONES DE ESCRITURA EN INPUTS

    // Función que elimina cualquier número o carácter especial, dejando solo letras y espacios
    const limpiarLetras = (evento) => { 
        evento.target.value = evento.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    };
    
    // Aplicamos la limpieza a los campos de Nombre y Apellido cada vez que el usuario escribe algo
    const inputNombre = document.getElementById('name');
    if (inputNombre) inputNombre.addEventListener('input', limpiarLetras);
    
    const inputApellido = document.getElementById('lastname');
    if (inputApellido) inputApellido.addEventListener('input', limpiarLetras);

    // Evitamos que se escriban letras en el campo de Teléfono (solo permite números)
    const inputTelefono = document.getElementById('phone');
    if (inputTelefono) {
        inputTelefono.addEventListener('input', (evento) => {
            evento.target.value = evento.target.value.replace(/\D/g, ''); // \D significa "todo lo que no sea dígito"
        });
    }

});