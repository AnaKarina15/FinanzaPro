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
    <title>Ingresos y Gastos - FinanzaPro</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    
    <link rel="stylesheet" href="./css/global.css" />
    <link rel="stylesheet" href="./css/ingresosGastos.css" />
    
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script type="module" src="./js/ingresosGastos.js"></script>
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
            <span class="material-symbols-outlined">currency_exchange</span> Ingresos y Gastos
          </a>
          <a href="#" class="nav-link">
            <span class="material-symbols-outlined">savings</span> Presupuesto y Metas
          </a>
          <a href="#" class="nav-link">
            <span class="material-symbols-outlined">analytics</span> Reportes y Análisis
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
          <h2 class="view-title">Ingresos y Gastos</h2>
        </div>
        <div class="view-buttons">
          <button class="btn-secondary">
            <span class="material-symbols-outlined">notifications</span>
          </button>
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
        <div class="summary-cards-grid">
          
          <article class="card combined-chart-card">
            <div class="card-header-clean">
              <div>
                <p class="subtitle">Ingresos este mes</p>
                <h2 class="total-monto text-success" id="total-ingresos-view">$0.00</h2>
              </div>
              <div class="icon-up"><span class="material-symbols-outlined">arrow_upward</span></div>
            </div>
            <div class="chart-legend-container">
              <div class="chart-wrapper">
                <canvas id="graficaIngresos"></canvas>
                <div class="chart-center-text"><span id="center-ingresos">$0</span></div>
              </div>
              <div class="legend-wrapper">
                <p class="legend-title">Distribución por categoría</p>
                <div id="legend-ingresos-list" class="legend-list"></div>
              </div>
            </div>
          </article>

          <article class="card combined-chart-card">
            <div class="card-header-clean">
              <div>
                <p class="subtitle">Gastos este mes</p>
                <h2 class="total-monto text-danger" id="total-gastos-view">$0.00</h2>
              </div>
              <div class="icon-down"><span class="material-symbols-outlined">arrow_downward</span></div>
            </div>
            <div class="chart-legend-container">
              <div class="chart-wrapper">
                <canvas id="graficaGastos"></canvas>
                <div class="chart-center-text"><span id="center-gastos">$0</span></div>
              </div>
              <div class="legend-wrapper">
                <p class="legend-title">Distribución por categoría</p>
                <div id="legend-gastos-list" class="legend-list"></div>
              </div>
            </div>
          </article>

        </div>

        <article class="card movimientos-card">
          <div class="card-top movimientos-header">
            <h3 class="movimientos-title">Historial de Transacciones</h3>
            <div class="table-filters">
                <span class="filter-active">Todos</span>
                <span>Ingresos</span>
                <span>Gastos</span>
                <span class="filter-dropdown">Este Mes <span class="material-symbols-outlined filter-icon">expand_more</span></span>
            </div>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th class="col-fecha">FECHA</th>
                  <th class="col-desc">DESCRIPCIÓN</th>
                  <th class="col-cat">CATEGORÍA</th>
                  <th class="col-monto">MONTO</th>
                  <th class="col-acciones">ACCIONES</th>
                </tr>
              </thead>
              <tbody id="tabla-movimientos-body">
                </tbody>
            </table>
          </div>
        </article>
      </main>
    </div>

    <div class="modal-overlay" id="modalNuevoMovimiento">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="modal-titulo">Registro de Movimientos</h3>
          <button class="btn-close" onclick="document.getElementById('modalNuevoMovimiento').classList.remove('active')">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form action="../index.php?action=guardarMovimiento" method="POST" class="formulario" id="form-movimiento">
          <input type="hidden" id="id_transaccion" name="id_transaccion" value="">
          
          <div class="modal-form-group mb-large type-selector">
            <label class="radio-label">
              <input type="radio" name="tipo_movimiento" value="ingreso" checked> Ingreso
            </label>
            <label class="radio-label">
              <input type="radio" name="tipo_movimiento" value="gasto"> Gasto
            </label>
          </div>

          <div class="input-group modal-form-group">
            <label for="monto_visual">Monto</label>
            <div class="input-container">
              <input type="text" id="monto_visual" placeholder="$ 0" required autocomplete="off">
              <input type="hidden" id="monto" name="monto" required>
            </div>
          </div>
          
          <div class="input-row modal-form-group">
            <div class="input-group">
              <label for="fecha">Fecha</label>
              <div class="input-container">
                  <input type="date" id="fecha" name="fecha" required>
              </div>
            </div>
            <div class="input-group">
              <label for="categoria">Categoría</label>
              <div class="input-container">
                <input list="lista-categorias" id="categoria" name="categoria" placeholder="Escribe o selecciona..." autocomplete="off" required>
                <datalist id="lista-categorias">
                  <option value="Alimentación"></option>
                  <option value="Transporte"></option>
                  <option value="Ocio"></option>
                  <option value="Servicios Públicos"></option>
                  <option value="Salario"></option>
                </datalist>
              </div>
            </div>
          </div>

          <div class="input-group modal-form-group mb-large">
            <label for="descripcion">Descripción</label>
            <div class="input-container">
                <input type="text" id="descripcion" name="descripcion" placeholder="Ej. Compra semanal de víveres">
            </div>
          </div>

          <button type="submit" class="btn-primary btn-modal-submit">
            Guardar Transacción
          </button>
        </form>

      </div>
    </div>
  </body>
</html>