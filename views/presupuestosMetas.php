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
  <title>Presupuesto y Metas - FinanzaPro</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

  <link rel="stylesheet" href="./css/global.css?v=<?php echo time(); ?>" />
  <link rel="stylesheet" href="./css/presupuestosMetas.css?v=<?php echo time(); ?>" />
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
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
        <a href="presupuestosMetas.php" class="nav-link active">
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
        <h2 class="view-title">Presupuestos y Metas</h2>
        <p class="view-description">Administra tus límites de gasto y ahorros.</p>
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
                <button id="btn-eliminar-todas" style="color:#ef4444;">Eliminar todas</button>
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

      <section class="presupuestos-section">
        <div class="section-header">
          <h3>
            <span class="material-symbols-outlined icon-blue" style="background-color: transparent; padding:0; color: #2563eb;">pie_chart</span> 
            Presupuestos
          </h3>
          <div style="display: flex; gap: 16px; align-items: center;">
            <a href="#" class="link-ver-todas" id="btn-ver-todos-presupuestos">Ver todos</a>
            <div class="toggle-switch" id="toggle-presupuesto-filtro">
              <button class="toggle-btn active" data-filtro="mensual">Mensual</button>
              <button class="toggle-btn" data-filtro="anual">Anual</button>
              <button class="toggle-btn" data-filtro="todos">Todos</button>
            </div>
          </div>
        </div>

        <div class="cards-grid" id="grid-presupuestos">
          <!-- Nuevo Presupuesto (Placeholder) -->
          <article class="card new-card" id="btn-nuevo-presupuesto">
            <div class="icon-circle">
              <span class="material-symbols-outlined">add</span>
            </div>
            <p>Nuevo Presupuesto</p>
          </article>
        </div>
      </section>

      <section class="metas-section">
        <div class="section-header">
          <h3>
            <span class="material-symbols-outlined icon-green">stars</span> Metas de Ahorro
          </h3>
          <div style="display: flex; gap: 16px; align-items: center;">
            <a href="#" class="link-ver-todas" id="btn-ver-todas-metas">Ver todas</a>
            <div class="toggle-switch" id="toggle-meta-filtro">
              <button class="toggle-btn" data-filtro="mensual">Mensual</button>
              <button class="toggle-btn" data-filtro="anual">Anual</button>
              <button class="toggle-btn active" data-filtro="todas">Todas</button>
            </div>
          </div>
        </div>
        
        <div class="cards-grid" id="grid-metas">
          <!-- Nueva Meta (Placeholder) -->
          <article class="card new-card" id="btn-nueva-meta">
            <div class="icon-circle">
              <span class="material-symbols-outlined">add</span>
            </div>
            <p>Nueva Meta</p>
          </article>
        </div>
      </section>

    </main>
  </div>

  <!-- MODAL NUEVA META -->
  <div class="modal-overlay" id="modalNuevaMeta">
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="modal-titulo-meta">Nueva Meta de Ahorro</h3>
        <button class="btn-close" id="btn-cerrar-meta">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <p style="font-size: 14px; color: var(--text-secondary); margin-top: -16px; margin-bottom: 24px;">Define tu próximo gran paso financiero.</p>
      
      <form action="../index.php?action=guardarMeta" method="POST" id="form-meta">
        <input type="hidden" name="id_meta" id="id_meta" value="">
        <div class="input-group modal-form-group">
          <label>Nombre de la Meta</label>
          <div class="input-container">
            <input type="text" name="nombre" placeholder="Ej. Ahorro para Casa" required autocomplete="off">
          </div>
        </div>
        
        <div class="input-row">
          <div class="input-group modal-form-group">
            <label>Monto Objetivo</label>
            <div class="input-container">
              <input type="text" name="monto_objetivo" placeholder="$ 0" required autocomplete="off">
            </div>
          </div>
          <div class="input-group modal-form-group">
            <label>Fecha Límite</label>
            <div class="input-container">
              <input type="date" name="fecha_limite" required>
            </div>
          </div>
        </div>

        <div class="input-group modal-form-group">
          <label>Elegir Ícono</label>
          <div class="icon-selector-row">
            <label class="icon-option active">
              <input type="radio" name="id_icono" value="3" checked style="display:none;">
              <span class="material-symbols-outlined">home</span>
            </label>
            <label class="icon-option">
              <input type="radio" name="id_icono" value="2" style="display:none;">
              <span class="material-symbols-outlined">directions_car</span>
            </label>
            <label class="icon-option">
              <input type="radio" name="id_icono" value="11" style="display:none;">
              <span class="material-symbols-outlined">flight</span>
            </label>
            <label class="icon-option">
              <input type="radio" name="id_icono" value="12" style="display:none;">
              <span class="material-symbols-outlined">laptop_mac</span>
            </label>
            <label class="icon-option">
              <input type="radio" name="id_icono" value="5" style="display:none;">
              <span class="material-symbols-outlined">school</span>
            </label>
            <label class="icon-option">
              <input type="radio" name="id_icono" value="13" style="display:none;">
              <span class="material-symbols-outlined">favorite</span>
            </label>
            <label class="icon-option">
              <input type="radio" name="id_icono" value="14" style="display:none;">
              <span class="material-symbols-outlined">directions_bus</span>
            </label>
          </div>
        </div>

        <button type="submit" class="btn-primary btn-modal-submit mt-4" id="btn-submit-meta">Crear Meta</button>
      </form>
    </div>
  </div>

  <!-- MODAL NUEVO PRESUPUESTO -->
  <div class="modal-overlay" id="modalNuevoPresupuesto">
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="modal-titulo-presupuesto">Nuevo Presupuesto</h3>
        <button class="btn-close" id="btn-cerrar-presupuesto">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <p style="font-size: 14px; color: var(--text-secondary); margin-top: -16px; margin-bottom: 24px;">Establece límites inteligentes para tus gastos.</p>

      <form action="../index.php?action=guardarPresupuesto" method="POST" id="form-presupuesto">
        <input type="hidden" name="id_presupuesto" id="id_presupuesto" value="">
        <div class="input-row">
          <div class="input-group modal-form-group">
            <label>Nombre de la Categoría</label>
            <div class="input-container">
              <input list="lista-categorias-presupuesto" name="nombre" placeholder="Ej. Salud, Educación..." required autocomplete="off">
              <datalist id="lista-categorias-presupuesto">
                  <option value="Alimentación"></option>
                  <option value="Transporte"></option>
                  <option value="Ocio"></option>
                  <option value="Servicios Públicos"></option>
              </datalist>
            </div>
          </div>

          <div class="input-group modal-form-group">
            <label>Límite</label>
            <div class="input-container">
              <input type="text" name="monto_limite" placeholder="$ 0" required autocomplete="off">
            </div>
          </div>
        </div>

        <div class="input-row">
          <div class="input-group modal-form-group">
            <label>Tipo de Presupuesto</label>
            <div class="input-container" style="display:flex; align-items:center; gap:16px; padding: 12px 16px;">
              <label style="display:flex; align-items:center; gap:4px; margin:0; cursor:pointer;"><input type="radio" name="tipo_periodo" value="mensual" checked> Mensual</label>
              <label style="display:flex; align-items:center; gap:4px; margin:0; cursor:pointer;"><input type="radio" name="tipo_periodo" value="anual"> Anual</label>
            </div>
          </div>
          <div class="input-group modal-form-group" id="grupo_periodo_presupuesto">
            <label id="label_periodo_presupuesto">Mes</label>
            <div class="input-container">
              <input type="month" name="periodo" id="periodo_presupuesto" required>
            </div>
          </div>
        </div>

        <div class="input-group modal-form-group">
          <label>Elegir Ícono</label>
          <div class="icon-selector-row">
            <label class="icon-option active">
              <input type="radio" name="id_icono" value="1" checked style="display:none;">
              <span class="material-symbols-outlined">restaurant</span>
            </label>
            <label class="icon-option">
              <input type="radio" name="id_icono" value="4" style="display:none;">
              <span class="material-symbols-outlined">shopping_bag</span>
            </label>
            <label class="icon-option">
              <input type="radio" name="id_icono" value="6" style="display:none;">
              <span class="material-symbols-outlined">local_hospital</span>
            </label>
            <label class="icon-option">
              <input type="radio" name="id_icono" value="8" style="display:none;">
              <span class="material-symbols-outlined">sports_esports</span>
            </label>
            <label class="icon-option">
              <input type="radio" name="id_icono" value="9" style="display:none;">
              <span class="material-symbols-outlined">checkroom</span>
            </label>
            <label class="icon-option">
              <input type="radio" name="id_icono" value="2" style="display:none;">
              <span class="material-symbols-outlined">directions_car</span>
            </label>
            <label class="icon-option">
              <input type="radio" name="id_icono" value="14" style="display:none;">
              <span class="material-symbols-outlined">directions_bus</span>
            </label>
          </div>
        </div>

        <div class="notification-toggle-box" style="margin-top: 16px;">
          <div class="icon-box-sm icon-green-bg">
            <span class="material-symbols-outlined">notifications_active</span>
          </div>
          <div class="toggle-texts">
            <strong style="font-size: 13px;">Notificar al llegar al 80%</strong>
            <p style="font-size: 11px;">Evita sobrepasar tu presupuesto</p>
          </div>
          <label class="switch">
             <input type="checkbox" name="alerta_80_porciento" checked>
             <span class="slider"></span>
          </label>
        </div>

        <button type="submit" class="btn-primary btn-modal-submit mt-4" id="btn-submit-presupuesto">
          <span class="material-symbols-outlined" style="margin-right: 8px;">check_circle</span> <span id="text-submit-presupuesto">Asignar Presupuesto</span>
        </button>
      </form>
    </div>
  </div>
  <!-- MODAL AGREGAR GASTO A PRESUPUESTO -->
  <div class="modal-overlay" id="modalGastoPresupuesto">
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="modal-titulo-gasto-presupuesto">Registrar Gasto</h3>
        <button class="btn-close" id="btn-cerrar-gasto-presupuesto">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <p style="font-size: 14px; color: var(--text-secondary); margin-top: -16px; margin-bottom: 24px;">El gasto se asociará a la categoría: <strong id="nombre-categoria-presupuesto"></strong></p>

      <form action="#" method="POST" id="form-gasto-presupuesto">
        <input type="hidden" name="categoria_gasto" id="categoria_gasto" value="">

        <!-- Saldo disponible (mismo estilo que metas) -->
        <div style="display:flex; align-items:center; gap:8px; padding:10px 14px; border-radius:10px; background:#f0fdf4; border:1px solid #bbf7d0; margin-bottom:16px;">
          <span class="material-symbols-outlined" style="color:#059669; font-size:20px;">account_balance_wallet</span>
          <span id="info-disponible-presupuesto" style="font-size:14px; font-weight:600; color:#059669;">Calculando saldo...</span>
        </div>

        <div class="input-group modal-form-group">
          <label>Monto</label>
          <div class="input-container">
            <input type="text" name="monto_gasto" id="monto_gasto" placeholder="$ 0" required autocomplete="off"
              style="font-size:24px; font-weight:800; color:var(--text-primary); text-align:center;">
          </div>
        </div>
        <div class="input-group modal-form-group">
          <label>Descripción</label>
          <div class="input-container">
            <input type="text" name="descripcion_gasto" id="descripcion_gasto" placeholder="Detalle del gasto (opcional)" autocomplete="off">
          </div>
        </div>
        <button type="submit" class="btn-primary btn-modal-submit mt-4" id="btn-submit-gasto-presupuesto">Registrar Gasto</button>
      </form>
    </div>
  </div>

  <!-- MODAL GESTIONAR META (Depositar / Retirar) -->
  <div class="modal-overlay" id="modalAbonoMeta">
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="modal-titulo-abono-meta">Gestionar Meta</h3>
        <button class="btn-close" id="btn-cerrar-abono-meta">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <p style="font-size: 14px; color: var(--text-secondary); margin-top: -16px; margin-bottom: 16px;">
        <strong id="nombre-meta-abono"></strong>
      </p>

      <!-- Tabs tipo pill -->
      <div style="display:flex; background:#f1f5f9; border-radius:10px; padding:4px; gap:4px; margin-bottom:20px;">
        <button id="tab-depositar" onclick="cambiarTabMeta('depositar')"
          style="flex:1; padding:8px 12px; border:none; border-radius:8px; background:#059669; color:#fff; font-weight:700; font-size:14px; cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:6px;">
          <span class="material-symbols-outlined" style="font-size:16px;">arrow_downward</span> Depositar
        </button>
        <button id="tab-retirar" onclick="cambiarTabMeta('retirar')"
          style="flex:1; padding:8px 12px; border:none; border-radius:8px; background:transparent; color:#64748b; font-weight:700; font-size:14px; cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:6px;">
          <span class="material-symbols-outlined" style="font-size:16px;">arrow_upward</span> Retirar
        </button>
      </div>

      <!-- Panel Depositar -->
      <div id="panel-depositar">
        <form action="#" method="POST" id="form-abono-meta">
          <input type="hidden" name="id_meta_abono" id="id_meta_abono" value="">
          <div style="display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; margin-bottom: 16px;">
            <span class="material-symbols-outlined" style="color: #059669; font-size: 20px;">account_balance_wallet</span>
            <span id="info-disponible-abono" style="font-size: 14px; font-weight: 600; color: #059669;">Calculando saldo...</span>
          </div>
          <div class="input-group modal-form-group">
            <label>Monto a depositar</label>
            <div class="input-container">
              <input type="text" name="monto_abono" id="monto_abono" placeholder="$ 0" required autocomplete="off"
                style="font-size:24px; font-weight:800; color:var(--text-primary); text-align:center;">
            </div>
          </div>
          <button type="submit" class="btn-primary btn-modal-submit mt-4" id="btn-submit-abono-meta">Depositar</button>
        </form>
      </div>

      <!-- Panel Retirar -->
      <div id="panel-retirar" style="display:none;">
        <form action="#" method="POST" id="form-retirar-meta">
          <input type="hidden" id="id_meta_retiro" value="">
          <div style="display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 10px; background: #eff6ff; border: 1px solid #bfdbfe; margin-bottom: 16px;">
            <span class="material-symbols-outlined" style="color: #3b82f6; font-size: 20px;">savings</span>
            <span id="info-ahorrado-meta" style="font-size: 14px; font-weight: 600; color: #3b82f6;">$0</span>
          </div>
          <div class="input-group modal-form-group">
            <label>Monto a retirar</label>
            <div class="input-container">
              <input type="text" name="monto_retiro" id="monto_retiro" placeholder="$ 0" required autocomplete="off"
                style="font-size:24px; font-weight:800; color:var(--text-primary); text-align:center;">
            </div>
          </div>
          <button type="submit" class="btn-primary btn-modal-submit mt-4" id="btn-submit-retiro-meta"
            style="background: linear-gradient(135deg, #2563eb, #3b82f6); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);">
            Retirar
          </button>
        </form>
      </div>

    </div>
  </div>

  <!-- MODAL RETIRAR DINERO DE META -->
  <div class="modal-overlay" id="modalRetirarMeta">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Retirar dinero de meta</h3>
        <button class="btn-close" id="btn-cerrar-retirar-meta">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <p style="font-size: 14px; color: var(--text-secondary); margin-top: -16px; margin-bottom: 24px;">
        Retiras de: <strong id="nombre-meta-retiro"></strong>
      </p>

      <form action="#" method="POST" id="form-retirar-meta">
        <input type="hidden" id="id_meta_retiro" value="">
        <div style="display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 10px; background: #fff7ed; border: 1px solid #fed7aa; margin-bottom: 16px;">
          <span class="material-symbols-outlined" style="color: #ea580c; font-size: 20px;">savings</span>
          <span id="info-ahorrado-meta" style="font-size: 14px; font-weight: 600; color: #ea580c;">$0</span>
        </div>
        <div class="input-group modal-form-group">
          <label>Monto a retirar</label>
          <div class="input-container">
            <input type="text" name="monto_retiro" id="monto_retiro" placeholder="$ 0" required autocomplete="off">
          </div>
        </div>
        <button type="submit" class="btn-primary btn-modal-submit mt-4" id="btn-submit-retiro-meta"
          style="background: linear-gradient(135deg, #ea580c, #f97316);">
          Retirar dinero
        </button>
      </form>
    </div>
  </div>

  <script type="module" src="./js/presupuestosMetas.js?v=<?php echo time(); ?>"></script>
</body>

</html>
