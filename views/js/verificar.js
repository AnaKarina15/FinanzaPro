document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-verificar");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const correo = document.getElementById("correo_verificacion").value;
      const pin = document.getElementById("codigo_pin").value;

      // Enviamos los datos a nuestro Controlador a través de Fetch API
      fetch("../index.php?action=activarCuenta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
              title: "¡Cuenta Activada!",
              text: "Tu cuenta ha sido verificada correctamente. Ya puedes iniciar sesión.",
              icon: "success",
              confirmButtonColor: "#059669",
            }).then(() => {
              // Lo enviamos al login
              window.location.href = "../index.php?registro=exito";
            });
          } else {
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
