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
    <title>Presupuesto y Metas - FinanzaPro</title>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="./css/global.css" />
    <link rel="stylesheet" href="./css/ingresosGastos.css" />
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
          <a href="dashboard.php" class="nav-link active" disabled>
            <span class="material-symbols-outlined">grid_view</span> Dashboard
          </a>
          <a href="ingresosGastos.php" class="nav-link">
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
          <h2 class="view-title">Ingresos y Gastos</h2>
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
        
        <div class="layout-dos-columnas">
          
          <div class="columna-izquierda">
            
            <div class="fila-tarjetas">
              
              <article class="card incomesGreen-card">
                <div class="card-top">
                  <div class="clean-icon-container">
                    <span class="material-symbols-outlined trend-icon">trending_up</span>
                  </div>
                  <p class="card-titulo">Ingresos este mes</p>
                </div>
                <p class="card-value income">$4,250.00</p>
                <span class="badge badge-trend">
                  <span class="material-symbols-outlined">arrow_upward</span> 8% vs mes anterior
                </span>
              </article>

              <article class="card outcomes-card">
                <div class="card-top">
                  <div class="clean-icon-container">
                    <span class="material-symbols-outlined trend-icon">trending_down</span>
                  </div>
                  <p class="card-titulo">Gastos este mes</p>
                </div>
                <p class="card-value">$1,840.50</p>
                <span class="badge badge-trend">
                  <span class="material-symbols-outlined">arrow_upward</span> 12% vs mes anterior
                </span>
              </article>
              
            </div>

            <article class="card Expenses-graph-card">
              <div class="chart-container">
                  <canvas id="graficaCategorias"></canvas>
                  <div class="chart-center-text">
                      <span class="total-label">Total</span>
                      <span class="total-value">$0</span>
                  </div>
              </div>
            </article>

          </div>

          <article class="card grafica-alta-card">
            <h3 style="margin-bottom: 16px;">Flujo de Caja Mensual</h3>
            <div class="chart-container">
              <canvas id="graficaBalance"></canvas>
            </div>
          </article>

        </div>

        <article class="card dashboard-recent-card">
          <article class="card movimientos-card">
            <div class="card-top">
              <h3>Historial de Movimientos</h3>
              <a href="#">Ver todo</a>
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
                <tbody>
                  <tr>
                    <td>
                      <div class="table-concept">
                        <span class="material-symbols-outlined concept-icon"
                          >shopping_bag</span
                        >
                        <strong>Suscripción Netflix</strong>
                      </div>
                    </td>
                    <td class="table-date">24 Ene, 2025</td>
                    <td>
                      <span class="table-category">Entretenimiento</span>
                    </td>
                    <td class="table-value">-$15.000</td>
                  </tr>
                  <tr>
                    <td>
                      <div class="table-concept">
                        <span class="material-symbols-outlined concept-icon"
                          >shopping_bag</span
                        >
                        <strong>Suscripción Netflix</strong>
                      </div>
                    </td>
                    <td class="table-date">24 Ene, 2025</td>
                    <td>
                      <span class="table-category">Entretenimiento</span>
                    </td>
                    <td class="table-value">-$15.000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </main>
    </div>
    <div class="modal-overlay" id="modalNuevoMovimiento">
      <div class="modal-content">
        
        <div class="modal-header">
          <h3>Registro de Movimientos</h3>
          <button class="btn-close" onclick="document.getElementById('modalNuevoMovimiento').classList.remove('active')">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form action="../index.php?action=guardarMovimiento" method="POST" class="formulario">
          
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
