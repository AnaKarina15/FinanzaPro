document.addEventListener("DOMContentLoaded", () => {
    
//lógica para cambiar entre login y registro
    const tarjetaLogin = document.getElementById("tarjeta-login");
    const tarjetaRegistro = document.getElementById("tarjeta-registro");
    const btnIrRegistro = document.getElementById("btn-ir-registro");
    const btnIrLogin = document.getElementById("btn-ir-login");

    if (btnIrRegistro && btnIrLogin) {
        // al hacer clic en "regístrate"
        btnIrRegistro.addEventListener("click", (e) => {
            e.preventDefault();
            tarjetaLogin.style.display = "none";
            tarjetaRegistro.style.display = "flex";
            tarjetaRegistro.style.flexDirection = "column";
            
            // esto hace el scroll suave justo después del header
            tarjetaRegistro.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        
        // al hacer clic en "inicia sesión"
        btnIrLogin.addEventListener("click", (e) => {
            e.preventDefault();
            tarjetaRegistro.style.display = "none";
            tarjetaLogin.style.display = "flex";
            tarjetaLogin.style.flexDirection = "column";
            
            // volvemos a centrar la vista en el login
            tarjetaLogin.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    // lógica para el formulario de login
    const loginForm = document.querySelector(".login-form");
    
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault(); 

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            if (email !== "" && password !== "") {
                window.location.href = "./views/dashboard.html";
            } else {
                alert("por favor, llena todos los campos.");
            }
        });
    }

    //lógica para el formulario de registro
    const registroForm = document.querySelector(".formulario-registro");
    
    if (registroForm) {
        registroForm.addEventListener("submit", (e) => {
            e.preventDefault(); 

            const inputPassword = document.getElementById("password-registro");
            const mensajeError = document.getElementById("mensaje-error-pass");
            const password = inputPassword.value;

            const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

            if (!regexPassword.test(password)) {
                // si falla: pintamos de rojo y agregamos el icono
                inputPassword.classList.add("input-error");
                mensajeError.classList.add("texto-error");
                mensajeError.innerHTML = '<span class="material-symbols-outlined" style="font-size: 14px;">error</span> mínimo 8 caracteres, una mayúscula, una minúscula y un número';
                return;
            } else {
                // si pasa: quitamos el error y mostramos éxito
                inputPassword.classList.remove("input-error");
                mensajeError.classList.remove("texto-error");
                mensajeError.innerHTML = 'mínimo 8 caracteres, una mayúscula, una minúscula y un número';
                
                const btnSubmit = registroForm.querySelector('button[type="submit"]');
                btnSubmit.style.backgroundColor = '#059669'; 
                btnSubmit.style.color = 'white';
                btnSubmit.innerHTML = '¡cuenta creada! <span class="material-symbols-outlined" style="margin-left: 8px;">check_circle</span>';
                btnSubmit.disabled = true;
                
                setTimeout(() => {
                    tarjetaRegistro.style.display = 'none';
                    tarjetaLogin.style.display = 'flex';
                    tarjetaLogin.style.flexDirection = 'column';
                    
                    registroForm.reset();
                    
                    btnSubmit.style.backgroundColor = '';
                    btnSubmit.innerHTML = 'registrarse <span class="material-symbols-outlined" style="margin-left: 8px;">arrow_forward</span>';
                    btnSubmit.disabled = false;
                }, 2500);
            }
        });
    }

    //validaciones en el formulario de registro
    const inputNombre = document.getElementById('name');
    const inputApellido = document.getElementById('lastname');
    const inputTelefono = document.getElementById('phone');

    // función para permitir solo letras (incluye tildes, la ñ y espacios)
    const limpiarLetras = (evento) => {
        evento.target.value = evento.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    };

    if (inputNombre) {
        inputNombre.addEventListener('input', limpiarLetras);
    }
    
    if (inputApellido) {
        inputApellido.addEventListener('input', limpiarLetras);
    }

    // función para permitir solo números en el teléfono
    if (inputTelefono) {
        inputTelefono.addEventListener('input', (evento) => {
            evento.target.value = evento.target.value.replace(/\D/g, '');
        });
    }
});