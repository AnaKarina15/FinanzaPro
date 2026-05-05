<!doctype html>
<html lang="es">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Perfil Administrador - FinanzaPro</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="./css/global.css?v=1.0.0" />
    <link rel="stylesheet" href="./css/admin.css?v=1.0.0" />
    <link rel="stylesheet" href="./css/perfil.css?v=1.0.0" />
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script type="module" src="./js/perfil_admin.js?v=1.0.0"></script>
    <style>
        /* Admin profile overrides */
        .admin-profile-layout {
            display: flex;
            flex-direction: column;
            gap: 24px;
            max-width: 900px;
            margin: 0 auto;
            width: 100%;
        }

        .admin-banner {
            background: linear-gradient(135deg, #059669 0%, #065f46 100%);
            border-radius: 20px 20px 0 0;
            height: 90px;
            position: relative;
        }

        .admin-header-card {
            padding: 0;
            overflow: hidden;
        }

        .admin-header-content {
            display: flex;
            align-items: flex-end;
            gap: 20px;
            padding: 0 28px 24px;
            margin-top: -36px;
        }

        .admin-avatar-wrap {
            position: relative;
            flex-shrink: 0;
        }

        .admin-avatar-big {
            width: 90px;
            height: 90px;
            border-radius: 50%;
            border: 4px solid #fff;
            object-fit: cover;
            box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        }

        .admin-role-badge {
            position: absolute;
            bottom: 2px;
            right: 2px;
            background: #059669;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #fff;
        }

        .admin-role-badge span {
            font-size: 13px;
            color: #fff;
        }

        .admin-info h2 {
            font-size: 22px;
            font-weight: 800;
            color: var(--text-primary);
            margin: 0 0 4px;
        }

        .admin-info .admin-tag {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #d1fae5;
            color: #065f46;
            font-size: 12px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 20px;
            letter-spacing: 0.04em;
        }

        .settings-section-title {
            font-size: 11px;
            font-weight: 700;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            padding: 0 0 12px;
            border-bottom: 1px solid var(--border-color);
            margin-bottom: 4px;
        }

        .setting-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 0;
            border-bottom: 1px solid var(--border-color);
            gap: 16px;
        }

        .setting-row:last-child {
            border-bottom: none;
        }

        .setting-row-left {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .setting-icon-box {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .icon-bg-blue   { background: #eff6ff; color: #2563eb; }
        .icon-bg-amber  { background: #fffbeb; color: #d97706; }
        .icon-bg-purple { background: #f5f3ff; color: #7c3aed; }
        .icon-bg-red    { background: #fff1f2; color: #e11d48; }
        .icon-bg-green  { background: #ecfdf5; color: #059669; }
        .icon-bg-slate  { background: #f8fafc; color: #475569; }

        .setting-text strong {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
            display: block;
        }

        .setting-text p {
            font-size: 12px;
            color: var(--text-secondary);
            margin: 2px 0 0;
        }

        .btn-setting-action {
            padding: 8px 16px;
            border-radius: 12px;
            border: 1px solid var(--border-color);
            background: #fff;
            font-size: 13px;
            font-weight: 600;
            color: var(--text-primary);
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
        }

        .btn-setting-action:hover {
            border-color: var(--primary);
            color: var(--primary);
            background: #f0fdf4;
        }

        .btn-setting-danger {
            border-color: #fecdd3;
            color: #e11d48;
            background: #fff1f2;
        }

        .btn-setting-danger:hover {
            background: #ffe4e6;
            border-color: #e11d48;
        }

        .two-factor-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 20px;
        }

        .status-enabled  { background: #dcfce7; color: #166534; }
        .status-disabled { background: #fee2e2; color: #991b1b; }

        .admin-actions-footer {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            padding-top: 8px;
        }

        /* Admin editable inputs: white background + subtle border */
        .admin-profile-layout .input-profile {
            background: #ffffff;
            border: 1.5px solid var(--border-color);
            transition: all 0.2s;
        }

        .admin-profile-layout .input-profile:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
            outline: none;
        }

        /* Admin readonly inputs: keep gray (read-only look) */
        .admin-profile-layout .input-profile[readonly] {
            background: #f0f4f9;
            border-color: transparent;
            cursor: default;
        }

        @media (max-width: 640px) {
            .admin-header-content { flex-direction: column; align-items: flex-start; }
            .admin-actions-footer { flex-direction: column; }
        }
    </style>
</head>

<body>
    <div class="app-container admin-layout">
        <!-- SIDEBAR -->
        <aside class="navigation-sidebar">
            <div class="logo-container">
                <div class="logo-icon"><span class="material-symbols-outlined">payments</span></div>
                <h1 class="logo-text">FinanzaPro</h1>
            </div>
            <nav class="sidebar-nav">
                <a href="admin.php" class="nav-link">
                    <span class="material-symbols-outlined">people</span> Usuarios
                </a>
                <div class="nav-link nav-profile active" style="cursor:default;">
                    <div class="avatar">
                        <img src="https://ui-avatars.com/api/?name=Admin&background=059669&color=fff" alt="Admin" id="admin-nav-avatar" />
                    </div>
                    <span class="username skeleton-text" id="admin-nav-username"></span>
                </div>
            </nav>
        </aside>

        <!-- MAIN -->
        <main class="admin-main">
            <!-- Page Header -->
            <div class="page-header">
                <div class="page-header-text">
                    <h1>Perfil de Administrador</h1>
                    <p>Gestiona tu cuenta, seguridad y preferencias del sistema.</p>
                </div>
                <div class="page-header-actions">
                    <!-- Notificaciones -->
                    <div class="notif-wrapper">
                        <button class="btn-icon-circle" id="btn-notificaciones" style="position:relative;">
                            <span class="material-symbols-outlined">notifications</span>
                            <span id="notif-badge" style="display:none;"></span>
                        </button>
                        <div id="notif-panel">
                            <div class="notif-panel-header">
                                <h4>Notificaciones</h4>
                                <div style="display:flex;gap:8px;align-items:center;">
                                    <button id="btn-marcar-todas">Marcar leídas</button>
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
            </div>

            <!-- Admin Profile Layout -->
            <div class="admin-profile-layout">

                <!-- Header Card -->
                <section class="card admin-header-card">
                    <div class="admin-banner"></div>
                    <div class="admin-header-content">
                        <div class="admin-avatar-wrap">
                            <img src="https://ui-avatars.com/api/?name=Admin&background=059669&color=fff&size=130"
                                 alt="Avatar Admin" class="admin-avatar-big" id="avatar-admin">
                            <div class="admin-role-badge">
                                <span class="material-symbols-outlined">shield</span>
                            </div>
                        </div>
                        <div class="admin-info">
                            <h2 class="skeleton-text" id="admin-nombre-header">&nbsp;</h2>
                            <span class="admin-tag">
                                <span class="material-symbols-outlined" style="font-size:14px;">verified_user</span>
                                Administrador del Sistema
                            </span>
                        </div>
                    </div>
                </section>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">

                    <!-- Datos Personales -->
                    <section class="card">
                        <div class="card-header-icon">
                            <span class="material-symbols-outlined icon-blue">badge</span>
                            <h3>Datos Personales</h3>
                        </div>
                        <div class="profile-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>NOMBRE</label>
                                    <input type="text" id="admin-input-nombre" class="input-profile" autocomplete="off">
                                </div>
                                <div class="form-group">
                                    <label>APELLIDO</label>
                                    <input type="text" id="admin-input-apellido" class="input-profile" autocomplete="off">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>CORREO ELECTRÓNICO</label>
                                <input type="email" id="admin-input-correo" class="input-profile" readonly>
                            </div>
                            <div style="display:flex; gap:12px; margin-top:8px;">
                                <button type="button" class="btn-primary" id="btn-guardar-datos" style="flex:1;">
                                    <span class="material-symbols-outlined">save</span> Guardar
                                </button>
                                <button type="button" class="btn-change-pass" id="btn-cambiar-pass-admin" style="flex:1;">
                                    <span class="material-symbols-outlined">lock_reset</span> Cambiar contraseña
                                </button>
                            </div>
                        </div>
                    </section>

                    <!-- Seguridad -->
                    <section class="card">
                        <div class="card-header-icon">
                            <span class="material-symbols-outlined icon-blue">security</span>
                            <h3>Seguridad Avanzada</h3>
                        </div>
                        <p class="settings-section-title">Autenticación</p>

                        <div class="setting-row">
                            <div class="setting-row-left">
                                <div class="setting-icon-box icon-bg-red">
                                    <span class="material-symbols-outlined">devices</span>
                                </div>
                                <div class="setting-text">
                                    <strong>Sesiones Activas</strong>
                                    <p>Gestiona los dispositivos donde tienes la cuenta abierta</p>
                                </div>
                            </div>
                            <button class="btn-setting-action" id="btn-gestionar-sesiones">
                                Gestionar
                            </button>
                        </div>
                    </section>

                    <!-- Alertas del Sistema -->
                    <section class="card">
                        <div class="card-header-icon">
                            <span class="material-symbols-outlined icon-blue">notifications_active</span>
                            <h3>Alertas del Sistema</h3>
                        </div>
                        <p class="settings-section-title">Cuándo notificarte</p>

                        <div class="settings-list">
                            <div class="setting-item">
                                <div class="setting-text">
                                    <strong>Nuevo registro de usuario</strong>
                                    <p>Cuando alguien crea una cuenta nueva</p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="notif-nuevo-usuario" checked>
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <div class="setting-item">
                                <div class="setting-text">
                                    <strong>Inicio de sesión sospechoso</strong>
                                    <p>Accesos desde ubicaciones inusuales</p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="notif-sesion-sospechosa" checked>
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <div class="setting-item">
                                <div class="setting-text">
                                    <strong>Errores críticos en la base de datos</strong>
                                    <p>Fallos en operaciones de Firestore</p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="notif-errores-db" checked>
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <div class="setting-item">
                                <div class="setting-text">
                                    <strong>Cuenta de usuario desactivada</strong>
                                    <p>Cuando un admin cambia el estado de un usuario</p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="notif-cuenta-desactivada">
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>

                        <button type="button" class="btn-primary" id="btn-guardar-alertas" style="width:100%; margin-top:16px;">
                            <span class="material-symbols-outlined">save</span> Guardar preferencias
                        </button>
                    </section>

                    <!-- Preferencias de Interfaz -->
                    <section class="card">
                        <div class="card-header-icon">
                            <span class="material-symbols-outlined icon-blue">palette</span>
                            <h3>Preferencias de Interfaz</h3>
                        </div>
                        <p class="settings-section-title">Apariencia</p>

                        <div class="setting-row">
                            <div class="setting-row-left">
                                <div class="setting-icon-box icon-bg-slate">
                                    <span class="material-symbols-outlined">contrast</span>
                                </div>
                                <div class="setting-text">
                                    <strong>Tema del Panel</strong>
                                    <p>Alterna entre modo claro y oscuro</p>
                                </div>
                            </div>
                            <div class="theme-toggle">
                                <button type="button" class="toggle-btn active" id="tema-claro" data-value="claro">Claro</button>
                                <button type="button" class="toggle-btn" id="tema-oscuro" data-value="oscuro">Oscuro</button>
                                <input type="hidden" id="admin-tema" value="claro">
                            </div>
                        </div>



                        <p class="settings-section-title" style="margin-top:20px;">Zona Peligrosa</p>
                        <div class="setting-row">
                            <div class="setting-row-left">
                                <div class="setting-icon-box icon-bg-red">
                                    <span class="material-symbols-outlined">logout</span>
                                </div>
                                <div class="setting-text">
                                    <strong>Cerrar sesión</strong>
                                    <p>Salir del panel de administración</p>
                                </div>
                            </div>
                            <button class="btn-setting-action btn-setting-danger" id="btn-cerrar-sesion-admin">
                                Cerrar sesión
                            </button>
                        </div>
                    </section>

                </div>
            </div>
        </main>
    </div>
</body>

</html>
