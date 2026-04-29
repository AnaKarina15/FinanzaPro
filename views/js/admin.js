/**
 * Admin Panel - Gestión de Usuarios
 * FinanzaPro
 */

const BASE_URL = '/FinanzaPro/index.php';

// Estado global
let paginaActual = 1;
let totalPaginas = 1;
let busquedaActual = '';
let debounceTimer = null;

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    cargarEstadisticas();
    cargarUsuarios();
    inicializarEventos();
});

// ========== EVENTOS ==========
function inicializarEventos() {
    // Botones de agregar usuario
    document.getElementById('btn-agregar-usuario').addEventListener('click', abrirModalCrear);

    // Modal
    document.getElementById('btn-cerrar-modal').addEventListener('click', cerrarModal);
    document.getElementById('btn-cancelar-modal').addEventListener('click', cerrarModal);
    document.getElementById('form-usuario').addEventListener('submit', guardarUsuario);

    // Cerrar modal al hacer clic fuera
    document.getElementById('modal-usuario').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) cerrarModal();
    });

    // Búsqueda con debounce
    document.getElementById('search-input').addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            busquedaActual = e.target.value.trim();
            paginaActual = 1;
            cargarUsuarios();
        }, 400);
    });

    // Paginación
    document.getElementById('btn-prev').addEventListener('click', () => {
        if (paginaActual > 1) {
            paginaActual--;
            cargarUsuarios();
        }
    });

    document.getElementById('btn-next').addEventListener('click', () => {
        if (paginaActual < totalPaginas) {
            paginaActual++;
            cargarUsuarios();
        }
    });

    // ESC cierra modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModal();
    });
}

// ========== CARGAR ESTADÍSTICAS ==========
async function cargarEstadisticas() {
    try {
        const resp = await fetch(`${BASE_URL}?action=adminEstadisticas`);
        const data = await resp.json();

        if (data.status === 'success') {
            animarNumero('stat-total', data.totalUsuarios);
            animarNumero('stat-activos', data.activos);
            document.getElementById('stat-nuevos').textContent = `+${data.nuevosSemana}`;
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

/**
 * Anima un número de 0 al valor final
 */
function animarNumero(elementId, valorFinal) {
    const el = document.getElementById(elementId);
    const duracion = 800;
    const inicio = performance.now();

    function step(timestamp) {
        const progreso = Math.min((timestamp - inicio) / duracion, 1);
        const eased = 1 - Math.pow(1 - progreso, 3); // easeOutCubic
        el.textContent = Math.floor(eased * valorFinal).toLocaleString('es-CO');

        if (progreso < 1) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
}

// ========== CARGAR USUARIOS ==========
async function cargarUsuarios() {
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = `
        <tr class="loading-row">
            <td colspan="5">
                <div class="loading-spinner"></div>
                <p>Cargando usuarios...</p>
            </td>
        </tr>
    `;

    try {
        const params = new URLSearchParams({
            action: 'adminListarUsuarios',
            pagina: paginaActual,
            porPagina: 10,
            busqueda: busquedaActual
        });

        const resp = await fetch(`${BASE_URL}?${params.toString()}`);
        const data = await resp.json();

        if (data.status === 'success') {
            renderizarTabla(data.usuarios);
            actualizarPaginacion(data);
        } else {
            tbody.innerHTML = `
                <tr><td colspan="5" class="empty-state">
                    <span class="material-symbols-outlined">error</span>
                    <p>${data.mensaje || 'Error al cargar usuarios'}</p>
                </td></tr>
            `;
        }
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        tbody.innerHTML = `
            <tr><td colspan="5" class="empty-state">
                <span class="material-symbols-outlined">cloud_off</span>
                <p>Error de conexión</p>
            </td></tr>
        `;
    }
}

// ========== RENDERIZAR TABLA ==========
function renderizarTabla(usuarios) {
    const tbody = document.getElementById('users-tbody');

    if (!usuarios || usuarios.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="5">
                <div class="empty-state">
                    <span class="material-symbols-outlined">person_off</span>
                    <p>No se encontraron usuarios</p>
                </div>
            </td></tr>
        `;
        return;
    }

    tbody.innerHTML = usuarios.map((u, i) => {
        const nombreCompleto = `${u.nombre} ${u.apellido}`;
        const iniciales = `${u.nombre.charAt(0)}${u.apellido.charAt(0)}`.toUpperCase();
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto)}&background=059669&color=fff&size=80`;

        // Role badge class
        let roleClass = 'role-other';
        if (u.id_rol == 1) roleClass = 'role-admin';
        else if (u.id_rol == 2) roleClass = 'role-usuario';

        // Status
        const isActive = u.cuenta_verificada == 1;
        const statusClass = isActive ? 'status-active' : 'status-inactive';
        const statusText = isActive ? 'Active' : 'Inactive';

        return `
            <tr style="animation: fadeInUp 0.3s ease forwards; animation-delay: ${i * 0.04}s; opacity: 0;">
                <td>
                    <div class="user-cell">
                        <div class="user-avatar">
                            <img src="${avatarUrl}" alt="${nombreCompleto}" />
                        </div>
                        <span class="user-name">${escapeHtml(nombreCompleto)}</span>
                    </div>
                </td>
                <td>${escapeHtml(u.correo)}</td>
                <td><span class="role-badge ${roleClass}">${escapeHtml(u.nombre_rol)}</span></td>
                <td>
                    <span class="status-badge ${statusClass}">
                        <span class="status-dot"></span>
                        ${statusText}
                    </span>
                </td>
                <td>
                    <div class="actions-cell">
                        <button class="btn-action btn-edit" onclick="editarUsuario(${u.id_usuario})" title="Editar">
                            <span class="material-symbols-outlined">edit</span>
                        </button>
                        <button class="btn-action btn-delete" onclick="eliminarUsuario(${u.id_usuario}, '${escapeHtml(nombreCompleto)}')" title="Eliminar">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ========== PAGINACIÓN ==========
function actualizarPaginacion(data) {
    totalPaginas = data.totalPaginas || 1;

    const inicio = ((data.pagina - 1) * data.porPagina) + 1;
    const fin = Math.min(data.pagina * data.porPagina, data.total);

    document.getElementById('table-info').textContent =
        data.total > 0
            ? `Showing ${inicio}-${fin} of ${data.total.toLocaleString('es-CO')} users`
            : 'No users found';

    document.getElementById('btn-prev').disabled = paginaActual <= 1;
    document.getElementById('btn-next').disabled = paginaActual >= totalPaginas;
}

// ========== MODAL: CREAR ==========
function abrirModalCrear() {
    document.getElementById('modal-titulo').textContent = 'Agregar Usuario';
    document.getElementById('btn-guardar').textContent = 'Guardar Usuario';
    document.getElementById('form-usuario').reset();
    document.getElementById('input-id-usuario').value = '';
    document.getElementById('input-id-rol').value = '2';

    // Mostrar campo contraseña
    document.getElementById('grupo-contrasena').style.display = 'block';
    document.getElementById('input-contrasena').required = true;

    document.getElementById('modal-usuario').classList.add('active');
    document.getElementById('input-nombre').focus();
}

// ========== MODAL: EDITAR ==========
window.editarUsuario = async function(id) {
    try {
        const resp = await fetch(`${BASE_URL}?action=adminObtenerUsuario&id=${id}`);
        const data = await resp.json();

        if (data.status === 'success') {
            const u = data.usuario;
            document.getElementById('modal-titulo').textContent = 'Editar Usuario';
            document.getElementById('btn-guardar').textContent = 'Actualizar Usuario';
            document.getElementById('input-id-usuario').value = u.id_usuario;
            document.getElementById('input-nombre').value = u.nombre;
            document.getElementById('input-apellido').value = u.apellido;
            document.getElementById('input-correo').value = u.correo;
            document.getElementById('input-telefono').value = u.telefono || '';
            document.getElementById('input-id-rol').value = u.id_rol;

            // Ocultar campo contraseña en edición
            document.getElementById('grupo-contrasena').style.display = 'none';
            document.getElementById('input-contrasena').required = false;

            document.getElementById('modal-usuario').classList.add('active');
            document.getElementById('input-nombre').focus();
        } else {
            Swal.fire('Error', data.mensaje, 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'No se pudo cargar el usuario.', 'error');
    }
};

// ========== GUARDAR (Crear o Actualizar) ==========
async function guardarUsuario(e) {
    e.preventDefault();

    const idUsuario = document.getElementById('input-id-usuario').value;
    const esEdicion = idUsuario !== '';

    const payload = {
        nombre: document.getElementById('input-nombre').value.trim(),
        apellido: document.getElementById('input-apellido').value.trim(),
        correo: document.getElementById('input-correo').value.trim(),
        telefono: document.getElementById('input-telefono').value.trim(),
        id_rol: parseInt(document.getElementById('input-id-rol').value)
    };

    if (esEdicion) {
        payload.id_usuario = parseInt(idUsuario);
    } else {
        payload.contrasena = document.getElementById('input-contrasena').value;
    }

    const action = esEdicion ? 'adminActualizarUsuario' : 'adminCrearUsuario';

    try {
        const resp = await fetch(`${BASE_URL}?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await resp.json();

        if (data.status === 'success') {
            cerrarModal();
            Swal.fire({
                icon: 'success',
                title: esEdicion ? 'Actualizado' : 'Creado',
                text: data.mensaje,
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
            cargarUsuarios();
            cargarEstadisticas();
        } else {
            Swal.fire('Error', data.mensaje, 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'Error de conexión al servidor.', 'error');
    }
}

// ========== ELIMINAR ==========
window.eliminarUsuario = async function(id, nombre) {
    const result = await Swal.fire({
        title: '¿Eliminar usuario?',
        html: `Estás a punto de eliminar a <strong>${nombre}</strong>.<br>Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const resp = await fetch(`${BASE_URL}?action=adminEliminarUsuario`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_usuario: id })
            });

            const data = await resp.json();

            if (data.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminado',
                    text: data.mensaje,
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
                cargarUsuarios();
                cargarEstadisticas();
            } else {
                Swal.fire('Error', data.mensaje, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de conexión al servidor.', 'error');
        }
    }
};

// ========== CERRAR MODAL ==========
function cerrarModal() {
    document.getElementById('modal-usuario').classList.remove('active');
}

// ========== UTILIDADES ==========
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}
