document.addEventListener("DOMContentLoaded", () => {
  // --- LÓGICA DE CERRAR SESIÓN ---
  const btnLogout = document.querySelector(".btn-logout-text");
  if (btnLogout) {
    btnLogout.addEventListener("click", (e) => {
      e.preventDefault();
      Swal.fire({
        title: "¿Cerrar sesión?",
        text: "Saldrás de tu cuenta de FinanzaPro de forma segura.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#059669",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Sí, salir",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "../index.php?action=cerrarSesion";
        }
      });
    });
  }

  // --- LÓGICA DEL TEMA DE INTERFAZ ---
  const toggleBtns = document.querySelectorAll(".theme-toggle .toggle-btn");
  if (toggleBtns.length > 0) {
    toggleBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
        toggleBtns.forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        document.getElementById("tema_interfaz").value = this.dataset.value;
      });
    });
  }

  // --- MOSTRAR CAMPOS DE CONTRASEÑA ---
  const btnMostrarPass = document.getElementById("btn-mostrar-pass");
  if (btnMostrarPass) {
    btnMostrarPass.addEventListener("click", () => {
      document.getElementById("change-pass-fields").style.display = "block";
    });
  }

  // --- DESCARTAR CAMBIOS ---
  const btnDescartar = document.getElementById("btn-descartar");
  if (btnDescartar) {
    btnDescartar.addEventListener("click", () => location.reload());
  }

  // --- ENLACES EN CONSTRUCCIÓN ---
  document.querySelectorAll(".coming-soon").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      Swal.fire({
        title: "Próximamente",
        text: "La edición de datos de contacto estará disponible pronto.",
        icon: "info",
        confirmButtonColor: "#059669",
      });
    });
  });

  const btnCambiarCorreo = document.getElementById("btn-cambiar-correo");
  const modalCambiarCorreo = document.getElementById("modal-cambiar-correo");
  const btnCerrarModalCorreo = document.getElementById(
    "btn-cerrar-modal-correo",
  );
  const btnCancelarCambiarCorreo = document.getElementById(
    "btn-cancelar-cambiar-correo",
  );

  const cerrarModalCorreo = () => {
    if (modalCambiarCorreo) modalCambiarCorreo.classList.remove("active");
  };

  if (btnCambiarCorreo && modalCambiarCorreo) {
    btnCambiarCorreo.addEventListener("click", (e) => {
      e.preventDefault();
      modalCambiarCorreo.classList.add("active");
    });
  }

  if (btnCerrarModalCorreo) {
    btnCerrarModalCorreo.addEventListener("click", cerrarModalCorreo);
  }

  if (btnCancelarCambiarCorreo) {
    btnCancelarCambiarCorreo.addEventListener("click", cerrarModalCorreo);
  }

  // --- SHOW/HIDE PASSWORD ---
  document.querySelectorAll(".input-container").forEach((container) => {
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

  // --- MANEJO DE ALERTAS DEL SERVIDOR ---
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("status")) {
    const status = urlParams.get("status");
    const msg = urlParams.get("msg");

    if (status === "success") {
      Swal.fire(
        "¡Actualizado!",
        msg || "Perfil guardado correctamente.",
        "success",
      );
    } else if (status === "error") {
      Swal.fire("Error", msg || "No se pudo actualizar el perfil.", "error");
    }

    // Limpiar URL
    window.history.replaceState(null, null, window.location.pathname);
  }

  // --- CAMBIAR FOTO DE PERFIL ---
  const btnCambiarFoto = document.getElementById("btn-cambiar-foto");
  const inputFotoPerfil = document.getElementById("input-foto-perfil");
  const avatarPerfil = document.getElementById("avatar-perfil");

  if (btnCambiarFoto && inputFotoPerfil) {
    // Al hacer clic en el botón de cámara, abrir el explorador de archivos
    btnCambiarFoto.addEventListener("click", (e) => {
      e.preventDefault();
      inputFotoPerfil.click();
    });

    // Cuando se seleccione una imagen
    inputFotoPerfil.addEventListener("change", async (e) => {
      const archivo = e.target.files[0];
      
      if (!archivo) {
        return; // No se seleccionó ningún archivo
      }

      // Validar tipo de archivo (solo imágenes)
      const tiposPermitidos = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (!tiposPermitidos.includes(archivo.type)) {
        Swal.fire({
          title: "Formato no válido",
          text: "Solo se permiten archivos de imagen: PNG, JPG y WEBP.",
          icon: "error",
          confirmButtonColor: "#059669",
        });
        inputFotoPerfil.value = ""; // Limpiar input
        return;
      }

      // Validar tamaño (máximo 2MB)
      const tamanoMaximo = 2 * 1024 * 1024; // 2MB
      if (archivo.size > tamanoMaximo) {
        Swal.fire({
          title: "Archivo muy grande",
          text: "La imagen no puede superar los 2MB.",
          icon: "error",
          confirmButtonColor: "#059669",
        });
        inputFotoPerfil.value = ""; // Limpiar input
        return;
      }

      // Mostrar indicador de carga
      Swal.fire({
        title: "Subiendo imagen...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Crear FormData para enviar la imagen
      const formData = new FormData();
      formData.append("foto_perfil", archivo);

      try {
        const response = await fetch("../index.php?action=cambiarFotoPerfil", {
          method: "POST",
          body: formData,
        });

        const datos = await response.json();

        if (datos.status === "success") {
          // Actualizar la imagen del avatar
          avatarPerfil.src = "../" + datos.ruta_foto + "?t=" + new Date().getTime();
          
          // También actualizar la imagen en el sidebar
          const avatarSidebar = document.querySelector(".nav-profile .avatar img");
          if (avatarSidebar) {
            avatarSidebar.src = "../" + datos.ruta_foto + "?t=" + new Date().getTime();
          }

          Swal.fire({
            title: "¡Foto actualizada!",
            text: datos.mensaje,
            icon: "success",
            confirmButtonColor: "#059669",
          });
        } else {
          Swal.fire({
            title: "Error",
            text: datos.mensaje,
            icon: "error",
            confirmButtonColor: "#059669",
          });
        }
      } catch (error) {
        Swal.fire({
          title: "Error de conexión",
          text: "No se pudo subir la imagen. Intenta de nuevo.",
          icon: "error",
          confirmButtonColor: "#059669",
        });
      }

      // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
      inputFotoPerfil.value = "";
    });
  }
});
