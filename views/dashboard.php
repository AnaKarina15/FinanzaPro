<?php
session_start();
// Si alguien intenta entrar sin iniciar sesión, lo devuelve al index
if (!isset($_SESSION['id_usuario'])) {
    header("Location: index.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dashboard - FinanzaPro</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/dashboard.css">
</head>

<body>
    <div class="app-container">
        <aside class="sidebar">
            <div class="logo-container">
                <div class="logo-icon"><span class="material-symbols-outlined">payments</span></div>
                <h1>FinanzaPro</h1>
            </div>

            <nav class="navegacion">
                <a href="dashboard.php" class="nav-link activo">
                    <span class="material-symbols-outlined">grid_view</span> Dashboard
                </a>
                <a href="#" class="nav-link">
                    <span class="material-symbols-outlined">currency_exchange</span> Ingresos y Gastos
                </a>
                <a href="#" class="nav-link">
                    <span class="material-symbols-outlined">savings</span> Presupuesto y Metas
                </a>
                <a href="#" class="nav-link">
                    <span class="material-symbols-outlined">analytics</span> Reportes y Análisis
                </a>
                <?php if ($_SESSION['rol'] === 'Admin'): ?>
                <a href="#" class="nav-link" style="color: #059669; font-weight: bold; background-color: #ecfdf5; border-radius: 8px;">
                    <span class="material-symbols-outlined">admin_panel_settings</span> Panel de Administrador
                </a>
                <?php endif; ?>
                <a href="#" class="profile-link mt-auto">
                    <div class="avatar">
                        <img src="https://ui-avatars.com/api/?name=<?php echo urlencode($_SESSION['nombre_usuario'] . ' ' . $_SESSION['apellido_usuario']); ?>&background=059669&color=fff" alt="Foto de perfil" class="avatar-grande" style="border-radius: 50%;">
                        <span class="nombre"><?php echo htmlspecialchars($_SESSION['nombre_usuario']. ' ' . $_SESSION['apellido_usuario']); ?></span>
                    </div>
                </a>
            </nav>
        </aside>

        <div class="container">
            <header class="header-pantalla">
                <div>
                    <h2>Dashboard</h2>
                    <p>Bienvenid@, <?php echo htmlspecialchars($_SESSION['nombre_usuario']); ?>. Aquí tienes el resumen de hoy.</p>
                </div>
                <div class="header-botones">
                    <button class="btn-secundario btn-notifications">
                        <span class="material-symbols-outlined">notifications</span>
                    </button>
                    <button class="btn btn-secundario">
                        <span class="material-symbols-outlined text-sm">calendar_today</span> <?php echo date('M Y'); ?>
                    </button>
                    <button class="btn btn-primario shadow-btn">
                        <span class="material-symbols-outlined text-sm">add</span> Nuevo Movimiento
                    </button>
                </div>
            </header>

            <main class="main-content">
                <section class="pantalla activa">
                    <section class="grid-tarjetas">
                        <article class="card available-card">
                            <header class="card-top">
                                <div class="icon-box icon-primary"><span class="material-symbols-outlined">account_balance_wallet</span></div>
                                <p class="card-titulo">Disponible</p>
                            </header>
                            <p class="card-valor texto-primario">$1.800.000</p>
                        </article>
                        <article class="card">
                            <header class="card-top">
                                <div class="icon-box icon-emerald"><span class="material-symbols-outlined">trending_up</span></div>
                                <p class="card-titulo">Total de ingresos</p>
                                <span class="badge badge-emerald">+12.5%</span>
                            </header>
                            <p class="card-valor">$5.000.000</p>
                        </article>
                        <article class="card ">
                            <header class="card-top">
                                <div class="icon-box icon-blue"><span class="material-symbols-outlined">shopping_cart</span></div>
                                <p class="card-titulo">Total de gastos</p>
                                <span class="badge badge-rose">-5.2%</span>
                            </header>
                            <p class="card-valor">$3.200.000</p>
                        </article>
                    </section>

                    <div class="grid-layout-principal">
                        <section class="col-izquierda">
                            <article class="card">
                                <header class="card-header-border flex-between">
                                    <h3>Gastos por mes</h3>
                                    <div class="legend">
                                        <span class="dot ingresos"></span> Ingresos
                                        <span class="dot gastos"></span> Gastos
                                    </div>
                                </header>
                                <div class="chart-bars">
                                    <div class="bar-group">
                                        <div class="bar-wrapper">
                                            <div class="bar bar-ingresos" style="height: 60%;"></div>
                                            <div class="bar bar-gastos" style="height: 40%;"></div>
                                        </div>
                                        <span class="bar-label">Ene</span>
                                    </div>
                                    <div class="bar-group">
                                        <div class="bar-wrapper">
                                            <div class="bar bar-ingresos" style="height: 80%;"></div>
                                            <div class="bar bar-gastos" style="height: 50%;"></div>
                                        </div>
                                        <span class="bar-label">Feb</span>
                                    </div>
                                    <div class="bar-group">
                                        <div class="bar-wrapper">
                                            <div class="bar bar-ingresos" style="height: 90%;"></div>
                                            <div class="bar bar-gastos" style="height: 30%;"></div>
                                        </div>
                                        <span class="bar-label">Mar</span>
                                    </div>
                                    <div class="bar-group">
                                        <div class="bar-wrapper">
                                            <div class="bar bar-ingresos" style="height: 45%;"></div>
                                            <div class="bar bar-gastos" style="height: 20%;"></div>
                                        </div>
                                        <span class="bar-label">Abr</span>
                                    </div>
                                </div>
                            </article>

                            <article class="card card-no-padding">
                                <header class="card-header-border flex-between">
                                    <h3>Últimos movimientos</h3>
                                    <a href="#" class="link-primario">Ver todo</a>
                                </header>
                                <div class="table-responsive">
                                    <table class="tabla-moderna">
                                        <thead>
                                            <tr>
                                                <th>Concepto</th>
                                                <th>Fecha</th>
                                                <th>Categoría</th>
                                                <th class="text-right">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <div class="flex-align">
                                                        <div class="icon-small"><span class="material-symbols-outlined">shopping_bag</span></div>
                                                        <strong>Suscripción Netflix</strong>
                                                    </div>
                                                </td>
                                                <td>24 Ene, 2025</td>
                                                <td><span class="badge badge-blue">Entretenimiento</span></td>
                                                <td class="text-right text-rose font-bold">-$15.000</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </article>
                        </section>

                        <aside class="col-derecha">
                            <article class="card-gradient">
                                <div class="z-index-content">
                                    <h3>Salud Financiera</h3>
                                    <p>Vas por buen camino. Este mes has ahorrado un 15% más que el anterior.</p>
                                </div>
                                <span class="material-symbols-outlined bg-icon">health_and_safety</span>
                            </article>

                            <article class="card">
                                <header class="card-title-icon">
                                    <span class="material-symbols-outlined texto-primario">lightbulb</span>
                                    <h4>Tips de Ahorro</h4>
                                </header>
                                <ul class="tips-lista">
                                    <li class="tip-item">
                                        <span class="tip-tag">Regla 50/30/20</span>
                                        <p>Destina el 20% de tus ingresos hoy mismo a tu cuenta de ahorros.</p>
                                    </li>
                                    <li class="tip-item">
                                        <span class="tip-tag">Gasto Hormiga</span>
                                        <p>Reduce las suscripciones que no has usado.</p>
                                    </li>
                                </ul>
                            </article>
                        </aside>
                    </div>
                </section>
            </main>
        </div>
    </div>

    <script src="js/script.js"></script>
</body>

</html>