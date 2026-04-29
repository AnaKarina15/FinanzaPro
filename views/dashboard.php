<?php
// Validamos una sola vez
if (session_status() === PHP_SESSION_NONE) {
  session_start();
}

// TEMPORAL: Como estamos usando Firebase, PHP ya no controla la sesión.
// if (!isset($_SESSION['usuario'])) {
//   header("Location: ../index.php");
//   exit();
// }

// Valores por defecto temporales para no romper el HTML
$_SESSION['nombre_usuario'] = $_SESSION['nombre_usuario'] ?? 'Cargando...';
$_SESSION['apellido_usuario'] = $_SESSION['apellido_usuario'] ?? '';
$_SESSION['foto_perfil'] = $_SESSION['foto_perfil'] ?? null;

// Si es admin (id_rol = 1), no debe tener acceso a las vistas de usuario normal
if (($_SESSION['id_rol'] ?? 0) == 1) {
  header("Location: admin.php");
  exit();
}
?>
<!doctype html>
<html lang="es">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard - FinanzaPro</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
    rel="stylesheet" />
  <link
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
    rel="stylesheet" />

  <link rel="stylesheet" href="./css/global.css?v=<?php echo time(); ?>" />
  <link rel="stylesheet" href="./css/dashboard.css?v=<?php echo time(); ?>" />

  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <script type="module" src="./js/dashboard.js?v=<?php echo time(); ?>"></script>
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
        <a href="dashboard.php" class="nav-link active" disabled>
          <span class="material-symbols-outlined">grid_view</span> Dashboard
        </a>
        <a href="ingresosGastos.php" class="nav-link">
          <span class="material-symbols-outlined">currency_exchange</span>
          Ingresos y Gastos
        </a>
        <a href="presupuestosMetas.php" class="nav-link">
          <span class="material-symbols-outlined">savings</span> Presupuestos y Metas
        </a>
        <a href="reportes.php" class="nav-link">
          <span class="material-symbols-outlined">analytics</span> Reportes y Análisis
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
    <header class="app-header">
      <div class="view-info">
        <h2 class="view-title">Dashboard</h2>
        <p class="view-description">
          Bienvenid@ <?= $_SESSION['nombre_usuario'] . ' ' . $_SESSION['apellido_usuario'] ?>. Aquí tienes el resumen de hoy.
        </p>
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
              <button id="btn-marcar-todas">Marcar todas como leídas</button>
            </div>
            <div id="notif-lista"></div>
            <div id="notif-empty">
              <span class="material-symbols-outlined">notifications_none</span>
              Sin notificaciones nuevas
            </div>
          </div>
        </div>
        <button class="btn-secondary">
          <span class="material-symbols-outlined">calendar_today</span>
          <?php
          $meses = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          echo date('j') . ' ' . $meses[date('n')] . ', ' . date('Y');
          ?>
        </button>
        <button class="btn-primary" id="btn-abrir-modal">
          <span class="material-symbols-outlined">add</span> Nuevo Movimiento
        </button>
      </div>
    </header>
    <main class="main-content">
      <div class="metrics-cards">
        <article class="card available-card">
          <div class="card-top">
            <div class="icon-box icon-green">
              <span class="material-symbols-outlined">account_balance_wallet</span>
            </div>
            <p class="card-titulo">Disponible</p>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; margin-top: 8px;">
            <p class="card-value texto-primario" id="monto-disponible" style="margin: 0;">$0</p>
            <p style="font-size: 14px; color: var(--text-secondary); font-weight: 500; margin: 0;">Total <span id="monto-total-real">$0</span></p>
          </div>
        </article>

        <article class="card incomes-card">
          <div class="card-top">
            <div class="icon-box icon-green">
              <span class="material-symbols-outlined">trending_up</span>
            </div>
            <p class="card-titulo">Total de ingresos</p>
            <span class="badge badge-green">+0%</span>
          </div>
          <p class="card-value text-success" id="monto-ingresos">$0</p>
        </article>

        <article class="card outcomes-card">
          <div class="card-top">
            <div class="icon-box icon-blue">
              <span class="material-symbols-outlined">shopping_cart</span>
            </div>
            <p class="card-titulo">Total de gastos</p>
            <span class="badge badge-blue">-0%</span>
          </div>
          <p class="card-value text-danger" id="monto-gastos">$0</p>
        </article>
        <article class="card dashboard-chart-card">
          <h3>Ingresos vs Gastos</h3>
          <canvas class="incomes-outcomes-chart"></canvas>
        </article>
        <article class="card dashboard-health-card">
          <div>
            <h3>Salud Financiera</h3>
            <p>
              Vas por buen camino. Este mes has ahorrado un 15% más que el
              anterior.
            </p>
          </div>
          <span class="material-symbols-outlined bg-icon">health_and_safety</span>
        </article>
        <article class="card dashboard-recent-card">
          <div class="card-top">
            <h3>Últimos Movimientos</h3>
            <a href="ingresosGastos.php">Ver todo</a>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>CONCEPTO</th>
                  <th>FECHA</th>
                  <th>CATEGORÍA</th>
                  <th>MONTO</th>
                </tr>
              </thead>
              <tbody class="movimientos-tabla-cuerpo">
              </tbody>
            </table>
          </div>
        </article>
        <article class="card dashboard-tips-card">
          <h3>Tips Financieros</h3>
          <ul class="tips-list">
            <li class="tip-item">
              <small class="tip-tag">Regla 50/30/20</small>
              <p>
                Destina el 20% de tus ingresos hoy mismo a tu cuenta de
                ahorros.
              </p>
            </li>
            <li class="tip-item">
              <small class="tip-tag">Gasto Hormiga</small>
              <p>Reduce las suscripciones que no has usado.</p>
            </li>
          </ul>
        </article>
      </div>
    </main>
  </div>

  <div class="modal-overlay" id="modalNuevoMovimiento">
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="modal-titulo">Registro de Movimientos</h3>
        <button class="btn-close" id="btn-cerrar-modal">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <form action="../index.php?action=guardarMovimiento" method="POST" class="formulario" id="form-movimiento">
        <input type="hidden" id="id_transaccion" name="id_transaccion" value="">

        <div class="modal-form-group type-selector">
          <label class="radio-label">
            <input type="radio" name="tipo_movimiento" value="ingreso" checked>
            <span>Ingreso</span>
          </label>
          <label class="radio-label">
            <input type="radio" name="tipo_movimiento" value="gasto">
            <span>Gasto</span>
          </label>
        </div>

        <div class="modal-form-group">
          <label for="monto_visual">Monto</label>
          <div class="input-container">
            <input type="text" id="monto_visual" placeholder="$ 0" autocomplete="off">
            <input type="hidden" id="monto" name="monto">
          </div>
          <span class="error-text" id="error-monto">Obligatorio</span>
        </div>

        <div class="input-row modal-form-group">
          <div class="input-group">
            <label for="fecha">Fecha</label>
            <div class="input-container">
              <input type="date" id="fecha" name="fecha">
            </div>
            <span class="error-text" id="error-fecha">Obligatorio</span>
          </div>
          <div class="input-group">
            <label for="categoria">Categoría</label>
            <div class="input-container">
              <input list="lista-categorias" id="categoria" name="categoria" placeholder="Escribe..." autocomplete="off">
              <datalist id="lista-categorias">
                <option value="Alimentación"></option>
                <option value="Transporte"></option>
                <option value="Ocio"></option>
                <option value="Servicios Públicos"></option>
                <option value="Salario"></option>
              </datalist>
            </div>
            <span class="error-text" id="error-categoria">Obligatorio</span>
          </div>
        </div>

        <div class="modal-form-group">
          <label for="descripcion">Descripción</label>
          <div class="input-container">
            <input type="text" id="descripcion" name="descripcion" placeholder="Ej. Compra de víveres">
          </div>
        </div>

        <button type="submit" class="btn-modal-submit">Guardar Transacción</button>
      </form>
    </div>
  </div>
</body>

</html>