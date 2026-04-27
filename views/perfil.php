<?php
session_start();
if (!isset($_SESSION['usuario'])) {
    header("Location: ../index.php");
    exit();
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
                                <input type="text" value="Ana Karina" class="input-profile readonly" readonly>
                            </div>
                            <div class="form-group">
                                <label>APELLIDO</label>
                                <input type="text" value="Rivera" class="input-profile readonly" readonly>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>CORREO ELECTRÓNICO</label>
                            <input type="email" value="akrivera@unimagdalena.edu.co" class="input-profile readonly" readonly>
                            <a href="#" class="link-change">Cambiar correo electrónico</a>
                        </div>

                        <div class="form-group">
                            <label>NÚMERO DE TELÉFONO</label>
                            <div class="phone-input-container">
                                <div class="code-box">+57</div>
                                <input type="text" value="321 456 7890" class="input-profile readonly" readonly>
                            </div>
                            <a href="#" class="link-change">Cambiar número de teléfono</a>
                        </div>

                        <button type="button" class="btn-change-pass">
                            <span class="material-symbols-outlined">restart_alt</span>
                            Cambiar contraseña
                        </button>
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
                            <select class="select-profile">
                                <option>COP - Peso Colombiano</option>
                                <option>USD - Dólar Estadounidense</option>
                            </select>
                        </div>
                        <div class="setting-item">
                            <div class="setting-text">
                                <strong>Tema de Interfaz</strong>
                                <p>Alterna entre modo claro y oscuro</p>
                            </div>
                            <div class="theme-toggle">
                                <button class="toggle-btn active">Claro</button>
                                <button class="toggle-btn">Oscuro</button>
                            </div>
                        </div>
                        <div class="setting-item">
                            <div class="setting-text">
                                <strong>Notificaciones Push</strong>
                                <p>Alertas de gastos inusuales y metas</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                </section>
            </div>

            <footer class="profile-actions">
                <button class="btn-logout-text"><span class="material-symbols-outlined">logout</span> Cerrar Sesión</button>
                <div class="group-btns">
                    <button class="btn-secondary">Descartar</button>
                    <button class="btn-primary">Guardar Cambios</button>
                </div>
            </footer>
        </div>
    </main>

        </div>
    </body>
</html>
