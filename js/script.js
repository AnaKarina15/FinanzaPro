document.addEventListener("DOMContentLoaded", () => {
    const enlaces = document.querySelectorAll(".nav-link");
    const pantallas = document.querySelectorAll(".pantalla");
    const body = document.body;

    enlaces.forEach(enlace => {
        enlace.addEventListener("click", (e) => {
            e.preventDefault(); // Evita que la página salte al hacer click

            // 1. Obtener el ID de la pantalla destino (quitando el '#')
            const destinoId = enlace.getAttribute("href").substring(1);
            
            // 2. Obtener el tema de color desde el atributo data-tema
            const temaColor = enlace.getAttribute("data-tema");

            // 3. Quitar la clase 'activo' de todos los enlaces y 'activa' de todas las pantallas
            enlaces.forEach(l => l.classList.remove("activo"));
            pantallas.forEach(p => p.classList.remove("activa"));

            // 4. Activar el enlace y la pantalla correspondientes
            enlace.classList.add("activo");
            document.getElementById(destinoId).classList.add("activa");

            // 5. Cambiar el color de toda la aplicación actualizando la clase del body
            body.className = temaColor;
        });
    });
});