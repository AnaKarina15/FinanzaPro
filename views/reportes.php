
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

  <link rel="stylesheet" href="./css/global.css?v=1.0.0" />
  <link rel="stylesheet" href="./css/reportes.css?v=1.0.0" />

  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script type="module" src="./js/reportes.js?v=1.0.0"></script>
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
        <a href="ingresosGastos.php" class="nav-link">
          <span class="material-symbols-outlined">currency_exchange</span>
          Ingresos y Gastos
        </a>
        <a href="presupuestosMetas.php" class="nav-link">
          <span class="material-symbols-outlined">savings</span> Presupuestos y Metas
        </a>
        <a href="reportes.php" class="nav-link active" disabled>
          <span class="material-symbols-outlined">analytics</span> Reportes y Análisis
        </a>
        <a href="perfil.php" class="nav-link nav-profile">
          <div class="avatar">
            <img src="https://ui-avatars.com/api/?name=Cargando...&background=059669&color=fff" alt="Foto de perfil" />
          </div>
          <span class="username skeleton-text"></span>
        </a>
      </nav>
    </aside>
    <header class="app-header">
      <div class="view-info">
        <h2 class="view-title">Reportes y Análisis</h2>
        <p class="view-description">
          Monitorea tu salud financiera y progreso de metas en tiempo real.
        </p>
      </div>
      <div class="view-buttons">
        <button class="btn-secondary" id="btn-semestre-actual">
          <span class="material-symbols-outlined">calendar_today</span>
          <span id="label-semestre">
            <?php
              $mesActual = (int) date('n');
              $anioActual = date('Y');
              echo ($mesActual <= 6) ? "1er Semestre $anioActual" : "2do Semestre $anioActual";
            ?>
          </span>
        </button>
        <button class="btn-primary" id="btn-exportar">
          <span class="material-symbols-outlined">download</span> Exportar
        </button>
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
      <div class="reportes-grid">
        <!-- Top section: 3 metric cards -->
        <div class="metrics-row">
          <article class="card metric-card">
            <div class="metric-top">
                <div class="metric-icon bg-green-light text-green"><span class="material-symbols-outlined">account_balance_wallet</span></div>
                <h4 class="metric-title">BALANCE TOTAL</h4>
            </div>
            <div class="metric-body">
              <div class="metric-value-row">
                <span class="badge badge-green" id="balance-trend"><span class="material-symbols-outlined" style="font-size:14px;">trending_up</span> +0%</span>
                <small>vs semestre anterior</small>
              </div>
              <p class="metric-value" id="balance-total">$0</p>
            </div>
          </article>
          <article class="card metric-card">
            <div class="metric-top">
                <div class="metric-icon bg-red-light text-danger"><span class="material-symbols-outlined">trending_down</span></div>
                <h4 class="metric-title">GASTO MENSUAL</h4>
            </div>
            <div class="metric-body">
              <div class="metric-value-row">
                <span class="badge badge-red" id="gasto-trend"><span class="material-symbols-outlined" style="font-size:14px;">trending_down</span> -0%</span>
                <small>vs semestre anterior</small>
              </div>
              <p class="metric-value" id="gasto-mensual">$0</p>
            </div>
          </article>
          <article class="card metric-card">
            <div class="metric-top">
                <div class="metric-icon bg-blue-light text-blue"><span class="material-symbols-outlined">savings</span></div>
                <h4 class="metric-title">TASA DE AHORRO</h4>
            </div>
            <div class="metric-body">
              <div class="metric-value-row">
                <span class="badge badge-blue" id="tasa-trend"><span class="material-symbols-outlined" style="font-size:14px;">trending_up</span> +0%</span>
                <small>vs semestre anterior</small>
              </div>
              <p class="metric-value" id="tasa-ahorro">0%</p>
            </div>
          </article>
        </div>

        <!-- Middle section: 2 charts -->
        <div class="charts-row">
          <article class="card chart-card">
            <div class="chart-header">
              <h3>Distribución de Flujo</h3>
              <p>Ingresos vs Gastos por categoría</p>
            </div>
            <div class="canvas-container">
                <canvas id="flujoChart"></canvas>
            </div>
          </article>
          <article class="card chart-card">
            <div class="chart-header">
              <h3>Trayectoria de Ahorro</h3>
              <p>Proyección de metas combinadas</p>
            </div>
            <div class="canvas-container">
                <canvas id="ahorroChart"></canvas>
            </div>
          </article>
        </div>
        
        <!-- Bottom section: 2 lists -->
        <div class="lists-row">
          <article class="card list-card">
            <h3>Progreso de Metas</h3>
            <div id="progreso-metas-list" class="report-list-container"></div>
          </article>
          <article class="card list-card">
            <h3>Top Categorías de Gasto</h3>
            <div id="top-categorias-list" class="report-list-container"></div>
          </article>
        </div>
        
        <!-- Bottom section: Heatmap -->
        <div class="heatmap-row">
          <article class="card heatmap-card">
            <div class="heatmap-header">
              <div>
                <h3>Mapa de Calor de Gastos</h3>
                <p>Categoría principal de gasto por día</p>
              </div>
              <div class="heatmap-legend" id="heatmap-legend-container">
                <!-- Se genera dinámicamente por JS -->
              </div>
            </div>
            <div id="heatmap-container" class="heatmap-months">
            </div>
          </article>
        </div>
      </div>
    </main>
  </div>
</body>

</html>
