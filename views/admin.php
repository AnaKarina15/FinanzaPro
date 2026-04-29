<?php
session_start();
// Solo accesible si está logueado Y es admin (id_rol = 1)
if (!isset($_SESSION['usuario']) || ($_SESSION['id_rol'] ?? 0) != 1) {
    header("Location: ../index.php");
    exit();
}
?>
<!doctype html>
<html lang="es">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Admin - Gestión de Usuarios | FinanzaPro</title>
    <meta name="description" content="Panel de administración de FinanzaPro. Gestiona usuarios, roles y accesos de la plataforma." />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="./css/global.css?v=<?= time() ?>" />
    <link rel="stylesheet" href="./css/admin.css?v=<?= time() ?>" />
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script type="module" src="./js/admin.js?v=<?= time() ?>"></script>
</head>

<body>
    <div class="app-container admin-layout">
        <!-- SIDEBAR -->
        <aside class="navigation-sidebar">
            <div class="logo-container">
                <div class="logo-icon"><span class="material-symbols-outlined">payments</span></div>
                <h1 class="logo-text">FinanzaPro</h1>
            </div>
            <nav class="sidebar-nav">
                <a href="admin.php" class="nav-link active">
                    <span class="material-symbols-outlined">people</span> Usuarios
                </a>
                <a href="perfil.php" class="nav-link nav-profile">
                    <div class="avatar">
                        <?php
                        $nav_foto = $_SESSION['foto_perfil'] ?? null;
                        $nav_avatar_src = $nav_foto
                            ? '../' . htmlspecialchars($nav_foto)
                            : 'https://ui-avatars.com/api/?name=' . urlencode($_SESSION['nombre_usuario'] . ' ' . $_SESSION['apellido_usuario']) . '&background=059669&color=fff';
                        ?>
                        <img src="<?= $nav_avatar_src ?>" alt="Foto de perfil" />
                    </div>
                    <span class="username"><?= htmlspecialchars($_SESSION['nombre_usuario'] . ' ' . $_SESSION['apellido_usuario']) ?></span>
                </a>
            </nav>
        </aside>

        <!-- MAIN CONTENT -->
        <main class="admin-main">
            <!-- Page Header -->
            <div class="page-header">
                <div class="page-header-text">
                    <h1>Gestión de Usuarios</h1>
                    <p>Gestiona el acceso a la plataforma y los roles de los usuarios.</p>
                </div>
                <div class="page-header-actions">
                    <button class="btn-icon-circle" id="btn-notifications">
                        <span class="material-symbols-outlined">notifications</span>
                    </button>
                    <button class="btn-primary btn-agregar-usuario" id="btn-agregar-usuario">
                        <span class="material-symbols-outlined">person_add</span> Agregar Usuario
                    </button>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="stats-grid">
                <article class="stat-card">
                    <div class="stat-icon stat-icon-blue">
                        <span class="material-symbols-outlined">groups</span>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">USUARIOS TOTALES</span>
                        <span class="stat-value" id="stat-total">0</span>
                    </div>
                </article>
                <article class="stat-card">
                    <div class="stat-icon stat-icon-green">
                        <span class="material-symbols-outlined">person</span>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">ACTIVOS AHORA</span>
                        <span class="stat-value" id="stat-activos">0</span>
                    </div>
                </article>
                <article class="stat-card">
                    <div class="stat-icon stat-icon-emerald">
                        <span class="material-symbols-outlined">trending_up</span>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">NUEVOS ESTA SEMANA</span>
                        <div class="stat-value-row">
                            <span class="stat-value" id="stat-nuevos">+0</span>
                        </div>
                    </div>
                </article>
            </div>

            <!-- User Directory Table -->
            <section class="card users-card">
                <div class="users-card-header">
                    <h2>Directorio de Usuarios</h2>
                    <div class="users-card-actions">
                        <div class="search-box">
                            <span class="material-symbols-outlined search-icon">search</span>
                            <input type="text" id="search-input" placeholder="Buscar usuario..." />
                        </div>
                    </div>
                </div>
                <div class="table-container">
                    <table id="users-table">
                        <thead>
                            <tr>
                                <th>USUARIO</th>
                                <th>CORREO</th>
                                <th>ROL</th>
                                <th>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody id="users-tbody">
                            <!-- Populated by JS -->
                        </tbody>
                    </table>
                </div>
                <div class="table-footer">
                    <span class="table-info" id="table-info">Mostrando 0 de 0 usuarios</span>
                    <div class="pagination">
                        <button class="btn-page" id="btn-prev" disabled>
                            <span class="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button class="btn-page" id="btn-next" disabled>
                            <span class="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </div>
            </section>
        </main>
    </div>

    <!-- MODAL: Crear / Editar Usuario -->
    <div class="modal-overlay" id="modal-usuario">
        <div class="modal-content modal-admin">
            <div class="modal-header">
                <h3 id="modal-titulo">Agregar Usuario</h3>
                <button class="btn-close" type="button" id="btn-cerrar-modal">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <form id="form-usuario">
                <input type="hidden" id="input-id-usuario" value="" />
                <div class="modal-body">
                    <div class="input-row">
                        <div class="modal-form-group">
                            <label for="input-nombre">NOMBRE</label>
                            <div class="input-container">
                                <input type="text" id="input-nombre" placeholder="Nombre" required />
                            </div>
                        </div>
                        <div class="modal-form-group">
                            <label for="input-apellido">APELLIDO</label>
                            <div class="input-container">
                                <input type="text" id="input-apellido" placeholder="Apellido" required />
                            </div>
                        </div>
                    </div>
                    <div class="modal-form-group">
                        <label for="input-correo">CORREO ELECTRÓNICO</label>
                        <div class="input-container">
                            <input type="email" id="input-correo" placeholder="correo@ejemplo.com" required />
                        </div>
                    </div>
                    <div class="input-row">
                        <div class="modal-form-group">
                            <label for="input-telefono">TELÉFONO</label>
                            <div class="input-container">
                                <input type="text" id="input-telefono" placeholder="+57 300 000 0000" />
                            </div>
                        </div>
                        <div class="modal-form-group">
                            <label for="input-id-rol">ROL (ID)</label>
                            <div class="input-container">
                                <input type="number" id="input-id-rol" min="1" value="2" required />
                            </div>
                        </div>
                    </div>
                    <div class="modal-form-group" id="grupo-contrasena">
                        <label for="input-contrasena">CONTRASEÑA</label>
                        <div class="input-container">
                            <input type="password" id="input-contrasena" placeholder="Mínimo 8 caracteres" />
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" id="btn-cancelar-modal">Cancelar</button>
                    <button type="submit" class="btn-primary btn-modal-submit" id="btn-guardar">Guardar Usuario</button>
                </div>
            </form>
        </div>
    </div>
</body>

</html>
