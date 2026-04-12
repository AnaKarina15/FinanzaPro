<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dashboard - FinanzaPro</title>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="./css/global.css" />
    <link rel="stylesheet" href="./css/dashboard.css" />
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script type="module" src="./js/dashboard-charts.js"></script>
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
          <a href="dashboard.html" class="nav-link active" disabled>
            <span class="material-symbols-outlined">grid_view</span> Dashboard
          </a>
          <a href="#" class="nav-link">
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
            <span class="username"> { usuario } </span>
          </a>
        </nav>
      </aside>
      <header class="app-header">
        <div class="view-info">
          <h2 class="view-title">Dashboard</h2>
          <p class="view-description">
            Bienvenid@ { usuario }. Aquí tienes el resumen de hoy.
          </p>
        </div>
        <div class="view-buttons">
          <button class="btn-secondary">
            <span class="material-symbols-outlined">notifications</span>
          </button>
          <button class="btn-secondary">
            <span class="material-symbols-outlined">calendar_today</span>
            { fecha }
          </button>
          <button class="btn-primary">
            <span class="material-symbols-outlined">add</span>
            Nuevo Movimiento
          </button>
        </div>
      </header>
      <main class="main-content">
        <div class="metrics-cards">
          <article class="card available-card">
            <div class="card-top">
              <div class="icon-box icon-green">
                <span class="material-symbols-outlined"
                  >account_balance_wallet</span
                >
              </div>
              <p class="card-titulo">Disponible</p>
            </div>
            <p class="card-value texto-primario">$1.800.000</p>
          </article>

          <article class="card incomes-card">
            <div class="card-top">
              <div class="icon-box icon-green">
                <span class="material-symbols-outlined">trending_up</span>
              </div>
              <p class="card-titulo">Total de ingresos</p>
              <span class="badge badge-green">+12.5%</span>
            </div>
            <p class="card-value">$5.000.000</p>
          </article>

          <article class="card outcomes-card">
            <div class="card-top">
              <div class="icon-box icon-blue">
                <span class="material-symbols-outlined">shopping_cart</span>
              </div>
              <p class="card-titulo">Total de gastos</p>
              <span class="badge badge-blue">-5.2%</span>
            </div>
            <p class="card-value">$3.200.000</p>
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
            <span class="material-symbols-outlined bg-icon"
              >health_and_safety</span
            >
          </article>
          <article class="card dashboard-recent-card">
            <div class="card-top">
              <h3>Últimos Movimientos</h3>
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
  </body>
</html>
