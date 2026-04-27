document.addEventListener("DOMContentLoaded", () => {
    
    // --- LÓGICA DE CERRAR SESIÓN ---
    const btnLogout = document.querySelector('.btn-logout-text');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            Swal.fire({
                title: '¿Cerrar sesión?',
                text: "Saldrás de tu cuenta de FinanzaPro de forma segura.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#059669',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Sí, salir',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '../index.php?action=cerrarSesion';
                }
            });
        });
    }

    // --- LÓGICA DEL TEMA DE INTERFAZ ---
    const toggleBtns = document.querySelectorAll('.theme-toggle .toggle-btn');
    if (toggleBtns.length > 0) {
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                toggleBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                document.getElementById('tema_interfaz').value = this.dataset.value;
            });
        });
    }

    // --- MOSTRAR CAMPOS DE CONTRASEÑA ---
    const btnMostrarPass = document.getElementById('btn-mostrar-pass');
    if (btnMostrarPass) {
        btnMostrarPass.addEventListener('click', () => {
            document.getElementById('change-pass-fields').style.display = 'block';
        });
    }

    // --- DESCARTAR CAMBIOS ---
    const btnDescartar = document.getElementById('btn-descartar');
    if (btnDescartar) {
        btnDescartar.addEventListener('click', () => location.reload());
    }

    // --- ENLACES EN CONSTRUCCIÓN ---
    document.querySelectorAll('.link-change').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            Swal.fire({
                title: 'Próximamente',
                text: 'La edición de datos de contacto estará disponible pronto.',
                icon: 'info',
                confirmButtonColor: '#059669'
            });
        });
    });

    // --- MANEJO DE ALERTAS DEL SERVIDOR ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('status')) {
        const status = urlParams.get('status');
        const msg = urlParams.get('msg');
        
        if (status === 'success') {
            Swal.fire('¡Actualizado!', msg || 'Perfil guardado correctamente.', 'success');
        } else if (status === 'error') {
            Swal.fire('Error', msg || 'No se pudo actualizar el perfil.', 'error');
        }
        
        // Limpiar URL
        window.history.replaceState(null, null, window.location.pathname);
    }
});