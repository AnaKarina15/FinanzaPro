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
            <a href="#" class="nav-link nav-profile">
                <div class="avatar">
                <img src="" alt="Foto de perfil" />
                </div>
                <span class="username"><?= htmlspecialchars($_SESSION['nombre_usuario'] . ' ' . $_SESSION['apellido_usuario']) ?></span>
            </a>
            </nav>
        </aside>
        <header class="app-header">
            <div class="view-info">
            <h2 class="view-title">Perfil</h2>
            </div>
            <div class="view-buttons">
            <button class="btn-secondary">
                <span class="material-symbols-outlined">notifications</span>
            </button>
            <button class="btn-secondary">
                <span class="material-symbols-outlined">calendar_today</span>
                { fecha }
            </button>
            <button class="btn-primary" onclick="document.getElementById('modalNuevoMovimiento').classList.add('active')">
                <span class="material-symbols-outlined">add</span>
                Nuevo Movimiento
            </button>
            </div>
        </header>

        <main class="main-content">
            
            
        </main>

        </div>
    </body>
</html>
