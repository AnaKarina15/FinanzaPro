<?php
session_start();
// TEMPORAL: Como estamos usando Firebase, PHP ya no controla la sesión.
// if (!isset($_SESSION['usuario'])) {
//   header("Location: ../index.php");
//   exit();
// }

// Valores por defecto temporales para no romper el HTML
$_SESSION['nombre_usuario'] = $_SESSION['nombre_usuario'] ?? 'Cargando...';
$_SESSION['apellido_usuario'] = $_SESSION['apellido_usuario'] ?? '';
$_SESSION['usuario'] = $_SESSION['usuario'] ?? 'cargando@...';
$_SESSION['foto_perfil'] = $_SESSION['foto_perfil'] ?? null;

// Obtenemos los datos frescos del usuario usando el controlador
// require_once '../controller/UsuarioController.php';
// $controller = new UsuarioController();
// $usuario = $controller->obtenerDatosPerfil($_SESSION['id_usuario']);
$usuario = []; // Placeholder temporal para no romper HTML
?>
<!doctype html>
<html lang="es">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Perfil - FinanzaPro</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="./css/global.css?v=<?= time() ?>" />
    <link rel="stylesheet" href="./css/perfil.css?v=<?= time() ?>" />
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script type="module" src="./js/perfil.js?v=<?= time() ?>"></script>
</head>

<body>
    <div class="app-container">
        <aside class="navigation-sidebar">
            <div class="logo-container">
                <div class="logo-icon"><span class="material-symbols-outlined">payments</span></div>
                <h1 class="logo-text">FinanzaPro</h1>
            </div>
            <nav class="sidebar-nav">
                <?php if (($_SESSION['id_rol'] ?? 0) == 1): ?>
                <a href="admin.php" class="nav-link"><span class="material-symbols-outlined">people</span> Usuarios</a>
                <?php else: ?>
                <a href="dashboard.php" class="nav-link"><span class="material-symbols-outlined">grid_view</span> Dashboard</a>
                <a href="ingresosGastos.php" class="nav-link"><span class="material-symbols-outlined">currency_exchange</span> Ingresos y Gastos</a>
                <a href="presupuestosMetas.php" class="nav-link"><span class="material-symbols-outlined">savings</span> Presupuestos y Metas</a>
                <a href="reportes.php" class="nav-link"><span class="material-symbols-outlined">analytics</span> Reportes y Análisis</a>
                <?php endif; ?>
                <a href="perfil.php" class="nav-link nav-profile active">
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

        <header class="app-header">
            <div class="view-info">
                <h2 class="view-title">Mi Perfil</h2>
                <p class="view-description">Gestiona tu información personal y preferencias de cuenta.</p>
            </div>
            <div class="view-buttons">
                <div class="notif-wrapper">
                    <button class="btn-secondary" id="btn-notificaciones">
                        <span class="material-symbols-outlined">notifications</span>
                        <span id="notif-badge" style="display:none;"></span>
                    </button>
                    <div id="notif-panel">
                        <div class="notif-panel-header">
                            <h4>Notificaciones</h4>
                            <div style="display:flex;gap:8px;align-items:center;">
                                <button id="btn-marcar-todas">Marcar todas como leídas</button>
                                <button id="btn-eliminar-todas" title="Eliminar todas"><span class="material-symbols-outlined" style="font-size:20px;">delete</span></button>
                            </div>
                        </div>
                        <div id="notif-lista"></div>
                        <div id="notif-empty">
                            <span class="material-symbols-outlined">notifications_none</span>
                            Sin notificaciones nuevas
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <main class="main-content">
            <div class="profile-layout">
                <section class="card profile-header-card">
                    <div class="banner-gradient"></div>
                    <div class="profile-header-content">
                        <div class="avatar-container">
                            <?php 
                            $foto_perfil = $_SESSION['foto_perfil'] ?? null;
                            $ruta_foto = $foto_perfil ? '../' . htmlspecialchars($foto_perfil) : 'https://ui-avatars.com/api/?name=' . urlencode($_SESSION['nombre_usuario'] . ' ' . $_SESSION['apellido_usuario']) . '&background=059669&color=fff&size=130';
                            ?>
                            <img src="<?= $ruta_foto ?>" alt="Foto de perfil" class="profile-avatar-big" id="avatar-perfil">
                            <input type="file" id="input-foto-perfil" name="foto_perfil" accept="image/png,image/jpeg,image/jpg,image/webp" style="display: none;">
                            <button type="button" class="btn-camera" id="btn-cambiar-foto" title="Cambiar foto de perfil"><span class="material-symbols-outlined">photo_camera</span></button>
                        </div>
                        <div class="profile-summary">
                            <div class="name-row">
                                <h2><?= htmlspecialchars($_SESSION['nombre_usuario'] . ' ' . $_SESSION['apellido_usuario']) ?></h2>
                                <span class="badge-verified"><span class="material-symbols-outlined">check_circle</span> Verificado</span>
                            </div>
                            <p class="user-email"><span class="material-symbols-outlined">mail</span> <?= htmlspecialchars($_SESSION['usuario']) ?></p>
                        </div>
                    </div>
                </section>

                <div id="form-perfil">
                    <div class="profile-grid">
                        <section class="card">
                            <div class="card-header-icon">
                                <span class="material-symbols-outlined icon-green">badge</span>
                                <h3>Datos Personales</h3>
                            </div>
                            <div class="profile-form">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>NOMBRE</label>
                                        <input type="text" name="nombre" value="<?= htmlspecialchars($usuario['nombre'] ?? '') ?>" class="input-profile">
                                    </div>
                                    <div class="form-group">
                                        <label>APELLIDO</label>
                                        <input type="text" name="apellido" value="<?= htmlspecialchars($usuario['apellido'] ?? '') ?>" class="input-profile">
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label>CORREO ELECTRÓNICO</label>
                                    <input type="email" name="correo" value="<?= htmlspecialchars($usuario['correo'] ?? '') ?>" class="input-profile" readonly>
                                    <a href="#" id="btn-cambiar-correo" class="link-change">Cambiar correo electrónico</a>
                                </div>

                                <div class="form-group">
                                    <label>NÚMERO DE TELÉFONO</label>
                                    <div class="phone-input-container">
                                        <div class="code-box">+57</div>
                                        <input type="tel" name="telefono" value="<?= htmlspecialchars($usuario['telefono'] ?? '') ?>" class="input-profile readonly" id="input-telefono" placeholder="3001234567" readonly>
                                    </div>
                                    <a href="#" class="link-change" id="btn-cambiar-telefono">Cambiar número de teléfono</a>
                                </div>

                                <button type="button" class="btn-change-pass" id="btn-mostrar-pass">
                                    <span class="material-symbols-outlined">restart_alt</span> Cambiar contraseña
                                </button>

                                <div class="form-group" id="change-pass-fields" style="display: none;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                        <label style="margin-bottom: 0;">CONTRASEÑA ACTUAL</label>
                                        <a href="#" id="btn-olvide-pass" class="link-change" style="font-size: 0.85rem;">¿Olvidaste tu contraseña?</a>
                                    </div>
                                    <div class="input-container">
                                        <input type="password" name="contrasena_actual" class="input-profile input-pw" value="">
                                        <span class="material-symbols-outlined show-pw">visibility</span>
                                    </div>

                                    <label>NUEVA CONTRASEÑA</label>
                                    <div class="input-container">
                                        <input type="password" name="contrasena_nueva" class="input-profile input-pw" value="" autocomplete="new-password">
                                        <span class="material-symbols-outlined show-pw">visibility</span>
                                    </div>

                                    <label>CONFIRMAR CONTRASEÑA</label>
                                    <div class="input-container">
                                        <input type="password" name="confirmar_contrasena" class="input-profile input-pw" value="" autocomplete="new-password">
                                        <span class="material-symbols-outlined show-pw">visibility</span>
                                    </div>
                                    <div class="group-btns" style="margin-top: 15px;">
                                        <button type="button" class="btn-secondary" id="btn-descartar-pass">Cancelar</button>
                                        <button type="button" class="btn-primary" id="btn-guardar-pass">Guardar Contraseña</button>
                                    </div>
                                </div>
                            </div>
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
                </div>

                <div class="profile-actions">
                    <button class="btn-logout-text" id="btn-cerrar-sesion">
                        <span class="material-symbols-outlined">logout</span> Cerrar Sesión
                    </button>
                    <button class="btn-danger" id="btn-borrar-cuenta">
                        <span class="material-symbols-outlined">delete_forever</span> Borrar cuenta
                    </button>
                </div>

                <div class="modal-overlay" id="modal-cambiar-correo">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Cambiar correo electrónico</h3>
                            <button class="btn-close" type="button" id="btn-cerrar-modal-correo">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form id="form-cambiar-correo">
                            <div class="modal-form-group">
                                <label>NUEVO CORREO ELECTRÓNICO</label>
                                <input type="email" name="nuevo_correo" class="input-profile" placeholder="nuevo@correo.com" required>
                            </div>
                            <div class="modal-actions">
                                <button type="button" class="btn-secondary" id="btn-cancelar-cambiar-correo">Cancelar</button>
                                <button type="submit" class="btn-primary btn-modal-submit">Guardar correo</button>
                            </div>
                        </form>
                    </div>
                </div>

                <div class="modal-overlay" id="modal-cambiar-telefono">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Cambiar número de teléfono</h3>
                            <button class="btn-close" type="button" id="btn-cerrar-modal-telefono">
                                <span class="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form id="form-cambiar-telefono">
                            <div class="modal-form-group">
                                <label>NUEVO TELÉFONO</label>
                                <input type="tel" name="nuevo_telefono" class="input-profile" placeholder="3001234567" pattern="^\d{10}$" maxlength="10" title="El número debe tener exactamente 10 dígitos" required>
                            </div>
                            <div class="modal-actions">
                                <button type="button" class="btn-secondary" id="btn-cancelar-cambiar-telefono">Cancelar</button>
                                <button type="submit" class="btn-primary btn-modal-submit">Guardar teléfono</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    </div>
</body>

</html>
