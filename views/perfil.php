<?php
session_start();
if (!isset($_SESSION['usuario'])) {
    header("Location: ../index.php");
    exit();
}

require_once '../model/Usuario.php';
$usuarioModel = new Usuario();
$usuario = $usuarioModel->obtenerPorId($_SESSION['id_usuario']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre = trim($_POST['nombre'] ?? '');
    $apellido = trim($_POST['apellido'] ?? '');
    $telefono = trim($_POST['telefono'] ?? '');
    $moneda_principal = $_POST['moneda_principal'] ?? 'COP';
    $tema_interfaz = $_POST['tema_interfaz'] ?? 'claro';
    $notificaciones_push = isset($_POST['notificaciones_push']) ? 1 : 0;

    $success = $usuarioModel->actualizarPerfil($_SESSION['id_usuario'], $nombre, $apellido, $telefono, $moneda_principal, $tema_interfaz, $notificaciones_push);

    if (!empty($_POST['contrasena_actual'])) {
        if ($_POST['contrasena_nueva'] !== $_POST['confirmar_contrasena']) {
            $mensaje = "Las contraseñas nuevas no coinciden.";
            $success = false;
        } elseif (!$usuarioModel->cambiarContrasena($_SESSION['id_usuario'], $_POST['contrasena_actual'], $_POST['contrasena_nueva'])) {
            $mensaje = "Error al cambiar la contraseña. Verifica la contraseña actual.";
            $success = false;
        } else {
            $mensaje = "Contraseña cambiada correctamente.";
        }
    }

    if ($success && empty($mensaje)) {
        $usuario = $usuarioModel->obtenerPorId($_SESSION['id_usuario']);
        $_SESSION['nombre_usuario'] = $usuario['nombre'];
        $_SESSION['apellido_usuario'] = $usuario['apellido'];
        $mensaje = "Perfil actualizado correctamente.";
    } elseif (!$success && empty($mensaje)) {
        $mensaje = "Error al actualizar el perfil.";
    }
}
?>
<!doctype html>
<html lang="es">
    <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Perfil - FinanzaPro</title>
    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
    />
    <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
        />
        <link rel="stylesheet" href="./css/global.css" />
        <link rel="stylesheet" href="./css/perfil.css" />
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body>
        <div class="app-container">
        <aside class="navigation-sidebar">
            <div class="logo-container">
            <div class="logo-icon">
                <span class="material-symbols-outlined">payments</span>
            </div>
            <h1 class="logo-text">FinanzaPro</h1>
            </div>
            <nav class="sidebar-nav">
            <a href="dashboard.php" class="nav-link">
                <span class="material-symbols-outlined">grid_view</span> Dashboard
            </a>
            <a href="ingresosGastos.php" class="nav-link active" disabled>
                <span class="material-symbols-outlined">currency_exchange</span>
                Ingresos y Gastos
            </a>
            <a href="#" class="nav-link">
                <span class="material-symbols-outlined">savings</span> Presupuesto y
                Metas
            </a>
            <a href="#" class="nav-link">
                <span class="material-symbols-outlined">analytics</span> Reportes y
                Análisis
            </a>
            <a href="perfil.php" class="nav-link nav-profile">
                <div class="avatar">
                <img src="https://ui-avatars.com/api/?name=<?= urlencode($_SESSION['nombre_usuario'] . ' ' . $_SESSION['apellido_usuario']) ?>&background=059669&color=fff" alt="Foto de perfil" />
                </div>
                <span class="username"><?= htmlspecialchars($_SESSION['nombre_usuario'] . ' ' . $_SESSION['apellido_usuario']) ?></span>
            </a>
            </nav>
        </aside>
        <header class="app-header">
            <div class="view-info">
            <h2 class="view-title">Mi Perfil</h2>
            <p class="view-description">
                Gestiona tu información personal y preferencias de cuenta.
            </p>
            <?php if (isset($mensaje)): ?>
                <p style="color: green; margin-top: 10px;"><?= htmlspecialchars($mensaje) ?></p>
                <script>alert('<?= addslashes($mensaje) ?>');</script>
            <?php endif; ?>
            </div>
            <div class="view-buttons">
            <button class="btn-secondary">
                <span class="material-symbols-outlined">notifications</span>
            </button>
            </div>
        </header>

    <main class="main-content">
        <div class="profile-layout">
            <section class="card profile-header-card">
                <div class="banner-gradient"></div>
                <div class="profile-header-content">
                    <div class="avatar-container">
                        <img src="https://ui-avatars.com/api/?name=<?= urlencode($_SESSION['nombre_usuario'] . ' ' . $_SESSION['apellido_usuario']) ?>&background=059669&color=fff&size=130" alt="Foto de perfil" class="profile-avatar-big">
                        <button class="btn-camera"><span class="material-symbols-outlined">photo_camera</span></button>
                    </div>
                    <div class="profile-summary">
                        <div class="name-row">
                            <h2><?= htmlspecialchars($_SESSION['nombre_usuario'] . ' ' . $_SESSION['apellido_usuario']) ?></h2>
                            <span class="badge-verified"><span class="material-symbols-outlined">check_circle</span> Verificado</span>
                        </div>
                        <p class="user-email"><span class="material-symbols-outlined">mail</span> <?= htmlspecialchars($_SESSION['usuario']) ?></p>
                    </div>
            </section>

            <form method="POST" action="perfil.php">
            <div class="profile-grid">
                <section class="card">
                    <div class="card-header-icon">
                        <span class="material-symbols-outlined icon-green">badge</span>
                        <h3>Datos Personales</h3>
                    </div>
                    <form method="POST" action="">
                    <div class="profile-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label>NOMBRE</label>
                                <input type="text" name="nombre" value="<?= htmlspecialchars($usuario['nombre']) ?>" class="input-profile">
                            </div>
                            <div class="form-group">
                                <label>APELLIDO</label>
                                <input type="text" name="apellido" value="<?= htmlspecialchars($usuario['apellido']) ?>" class="input-profile">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>CORREO ELECTRÓNICO</label>
                            <input type="email" name="correo" value="<?= htmlspecialchars($usuario['correo']) ?>" class="input-profile" readonly>
                            <a href="#" class="link-change">Cambiar correo electrónico</a>
                        </div>

                        <div class="form-group">
                            <label>NÚMERO DE TELÉFONO</label>
                            <div class="phone-input-container">
                                <div class="code-box">+57</div>
                                <input type="text" name="telefono" value="<?= htmlspecialchars($usuario['telefono']) ?>" class="input-profile">
                            </div>
                            <a href="#" class="link-change">Cambiar número de teléfono</a>
                        </div>

                        <button type="button" class="btn-change-pass">
                            <span class="material-symbols-outlined">restart_alt</span>
                            Cambiar contraseña
                        </button>

                        <div class="form-group" id="change-pass-fields" style="display: none;">
                            <label>CONTRASEÑA ACTUAL</label>
                            <input type="password" name="contrasena_actual" class="input-profile">
                            <label>NUEVA CONTRASEÑA</label>
                            <input type="password" name="contrasena_nueva" class="input-profile">
                            <label>CONFIRMAR CONTRASEÑA</label>
                            <input type="password" name="confirmar_contrasena" class="input-profile">
                        </div>
                    </div>
                    </form>
                </section>

                <section class="card">
                    <div class="card-header-icon">
                        <span class="material-symbols-outlined icon-blue">settings</span>
                        <h3>Preferencias de Cuenta</h3>
                    </div>
                    <div class="settings-list">
                        <div class="setting-item">
                            <div class="setting-text">
                                <strong>Moneda Principal</strong>
                                <p>Define el valor por defecto de tus reportes</p>
                            </div>
                            <select name="moneda_principal" class="select-profile">
                                <option value="COP" <?= ($usuario['moneda_principal'] ?? 'COP') == 'COP' ? 'selected' : '' ?>>COP - Peso Colombiano</option>
                                <option value="USD" <?= ($usuario['moneda_principal'] ?? 'COP') == 'USD' ? 'selected' : '' ?>>USD - Dólar Estadounidense</option>
                            </select>
                        </div>
                        <div class="setting-item">
                            <div class="setting-text">
                                <strong>Tema de Interfaz</strong>
                                <p>Alterna entre modo claro y oscuro</p>
                            </div>
                            <div class="theme-toggle">
                                <button type="button" class="toggle-btn <?= ($usuario['tema_interfaz'] ?? 'claro') == 'claro' ? 'active' : '' ?>" data-value="claro">Claro</button>
                                <button type="button" class="toggle-btn <?= ($usuario['tema_interfaz'] ?? 'claro') == 'oscuro' ? 'active' : '' ?>" data-value="oscuro">Oscuro</button>
                                <input type="hidden" name="tema_interfaz" value="<?= $usuario['tema_interfaz'] ?? 'claro' ?>" id="tema_interfaz">
                            </div>
                        </div>
                        <div class="setting-item">
                            <div class="setting-text">
                                <strong>Notificaciones Push</strong>
                                <p>Alertas de gastos inusuales y metas</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" name="notificaciones_push" <?= ($usuario['notificaciones_push'] ?? 1) ? 'checked' : '' ?>>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                </section>
            </div>

            <footer class="profile-actions">
                <button type="button" class="btn-logout-text" onclick="window.location.href='../logout.php'"><span class="material-symbols-outlined">logout</span> Cerrar Sesión</button>
                <div class="group-btns">
                    <button type="button" class="btn-secondary">Descartar</button>
                    <button type="submit" class="btn-primary">Guardar Cambios</button>
                </div>
            </footer>
            </form>
        </div>
    </main>

        </div>
    </body>
    <script>
        document.querySelectorAll('.theme-toggle .toggle-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.theme-toggle .toggle-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                document.getElementById('tema_interfaz').value = this.dataset.value;
            });
        });

        document.querySelector('.btn-secondary').addEventListener('click', () => location.reload());

        document.querySelector('.btn-change-pass').addEventListener('click', function() {
            document.getElementById('change-pass-fields').style.display = 'block';
        });
    </script>
</html>
