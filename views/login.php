<?php
$modo_verificacion = isset($_GET['verificar']) && $_GET['verificar'] == 'true';
$correo_a_verificar = $_GET['correo'] ?? '';
?>
<!doctype html>
<html lang="es">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Iniciar Sesión - FinanzaPro</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
    rel="stylesheet" />
  <link
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
    rel="stylesheet" />
  <link rel="stylesheet" href="./css/global.css?v=<?= time() ?>" />
  <link rel="stylesheet" href="./css/login.css?v=<?= time() ?>" />
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <script type="module" src="./js/login.js?v=<?= time() ?>"></script>
</head>

<body>
  <header>
    <div class="logo-container">
      <div class="logo-icon">
        <span class="material-symbols-outlined">payments</span>
      </div>
      <h1 class="logo-text">FinanzaPro</h1>
    </div>
    <nav>
      <a href="#benefits" class="nav-link">Beneficios</a>
      <a href="#login" class="nav-link">Iniciar Sesión</a>
    </nav>
  </header>
  <main>
    <section id="login">
      <div class="left">
        <h2 class="login-title">
          Domina tu dinero,<br />
          asegura tu futuro
        </h2>
        <p class="login-text">
          La herramienta definitiva para tomar el control de tus ingresos y
          gastos diarios. Organiza tu presupuesto para pasajes, alimentación y
          proyectos sin complicaciones.
        </p>
        <div class="login-image">
          <div class="card floating-card">
            <div class="card-top">
              <div class="icon-box">
                <span class="material-symbols-outlined">account_balance</span>
              </div>
              <p class="card-title">Fondo para el Semestre</p>
              <span class="badge">Ahorro Activo</span>
            </div>
            <p class="card-value">$850.000</p>
            <div class="progress-container">
              <progress max="100" value="85"></progress>
              <span>85% de $1.000.000</span>
            </div>
          </div>
        </div>
      </div>
      <div class="right">

        <form class="card login-form <?= $modo_verificacion ? 'hidden' : '' ?>" id="form-login-auth">
          <div class="form-info">
            <h2 class="form-title">Bienvenido de nuevo</h2>
            <p class="form-subtitle">Ingresa tus datos para continuar</p>
          </div>
          <div class="input-group">
            <label for="email_login">Correo Electrónico</label>
            <div class="input-container">
              <input
                type="email"
                id="email_login"
                name="email"
                autocomplete="email"
                placeholder="nombre@ejemplo.com"
                required />
            </div>
          </div>
          <div class="input-group">
            <label for="login-password">Contraseña</label>
            <div class="input-container pw-container">
              <input
                type="password"
                id="login-password"
                name="contrasena"
                class="input-pw"
                autocomplete="current-password"
                placeholder="••••••••"
                required />
              <button type="button" class="show-pw material-symbols-outlined">
                visibility
              </button>
            </div>
          </div>
          <div class="login-actions">
            <label class="checkbox-container">
              <input type="checkbox" id="check-recordarme" checked /> Recordarme
            </label>
            <a href="#" id="forgot-password-link" class="link-primario">¿Olvidaste tu contraseña?</a>
          </div>
          <button type="submit" class="btn-primary">Iniciar Sesión</button>
          
          <div style="display: flex; align-items: center; text-align: center; margin: 15px 0;">
            <hr style="flex: 1; border: none; border-top: 1px solid #e2e8f0;">
            <span style="padding: 0 10px; color: #64748b; font-size: 0.9rem;">O</span>
            <hr style="flex: 1; border: none; border-top: 1px solid #e2e8f0;">
          </div>
          
          <button type="button" class="btn-secondary" id="btn-google-login" style="display: flex; align-items: center; justify-content: center; gap: 10px; background: white; color: #333; border: 1px solid #e2e8f0; width: 100%; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 500; font-family: inherit; transition: background 0.3s;">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20">
            Continuar con Google
          </button>

          <span class="login-footer">
            <p>
              ¿No tienes cuenta?
              <a href="#" class="switch-form">Regístrate</a>
            </p>
          </span>
        </form>

        <form class="card register-form hidden" id="form-register-auth">
          <div class="form-info">
            <h2 class="form-title">Crea tu cuenta</h2>
            <p class="form-subtitle">
              Únete a FinanzaPro y comienza a organizar tus finanzas
            </p>
          </div>
          <div class="input-row">
            <div class="input-group">
              <label for="name">Nombre</label>
              <div class="input-container">
                <input
                  type="text"
                  id="name"
                  name="nombre"
                  placeholder="Ej. Juan"
                  required />
              </div>
            </div>
            <div class="input-group">
              <label for="lastname">Apellido</label>
              <div class="input-container">
                <input
                  type="text"
                  id="lastname"
                  name="apellido"
                  placeholder="Ej. Pérez"
                  required />
              </div>
            </div>
          </div>
          <div class="input-group">
            <label for="phone">Teléfono</label>
            <div class="input-row">
              <div class="select-container">
                <select name="codigo_pais" class="input-soft select-codigo">
                  <option value="+57">+57</option>
                  <option value="+1">+1</option>
                </select>
              </div>
              <div class="input-container">
                <input
                  type="tel"
                  id="phone"
                  name="telefono"
                  class="input-soft input-tel"
                  placeholder="Ej. 300 456 7890"
                  pattern="^\d{10}$"
                  maxlength="10"
                  title="El número debe tener exactamente 10 dígitos"
                  required />
              </div>
            </div>
          </div>
          <div class="input-group">
            <label for="email_registro">Correo Electrónico</label>
            <div class="input-container">
              <input
                type="email"
                id="email_registro"
                name="email"
                autocomplete="email"
                placeholder="nombre@ejemplo.com"
                required />
            </div>
          </div>
          <div class="input-group">
            <label for="regster-password">Contraseña</label>
            <div class="input-container pw-container">
              <input
                type="password"
                id="regster-password"
                name="contrasena"
                class="input-pw"
                autocomplete="current-password"
                placeholder="••••••••"
                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}"
                title="Mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo (sin tildes ni espacios)."
                required />
              <button type="button" class="show-pw material-symbols-outlined">
                visibility
              </button>
            </div>
            <small for="">Mínimo 8 caracteres, una mayúscula, una minúscula y un número</small>
          </div>
          <div class="login-actions">
            <label class="checkbox-container">
              <input type="checkbox" required />
              Al registrarte, aceptas nuestros <a href="">términos de servicio</a> y <a href="">política de privacidad</a>
            </label>
          </div>
          <button type="submit" class="btn-primary">Regístrate</button>
          
          <div style="display: flex; align-items: center; text-align: center; margin: 15px 0;">
            <hr style="flex: 1; border: none; border-top: 1px solid #e2e8f0;">
            <span style="padding: 0 10px; color: #64748b; font-size: 0.9rem;">O</span>
            <hr style="flex: 1; border: none; border-top: 1px solid #e2e8f0;">
          </div>
          
          <button type="button" class="btn-secondary" id="btn-google-register" style="display: flex; align-items: center; justify-content: center; gap: 10px; background: white; color: #333; border: 1px solid #e2e8f0; width: 100%; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: 500; font-family: inherit; transition: background 0.3s;">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20">
            Registrarse con Google
          </button>

          <span class="login-footer">
            <p>
              ¿Ya tienes cuenta?
              <a href="#" class="switch-form">Iniciar Sesión</a>
            </p>
          </span>
        </form>

        <form class="card verify-form <?= $modo_verificacion ? '' : 'hidden' ?>" id="form-verificar">
          <div class="form-info" style="text-align: center;">
            <span class="material-symbols-outlined" style="font-size: 3rem; color: #059669;">mark_email_read</span>
            <h2 class="form-title">Verifica tu cuenta</h2>
            <p class="form-subtitle">Hemos generado un código para <br><strong><?= htmlspecialchars($correo_a_verificar) ?></strong></p>
          </div>

          <div class="input-group" style="margin-top: 20px;">
            <label for="codigo_pin" style="text-align: center; display: block;">Código de 6 dígitos</label>
            <div class="input-container">
              <input type="hidden" id="correo_verificacion" value="<?= htmlspecialchars($correo_a_verificar) ?>">
              <input
                type="text"
                id="codigo_pin"
                class="pin-input"
                maxlength="6"
                required
                autocomplete="off" />
            </div>
          </div>

          <button type="submit" class="btn-primary" style="margin-top: 20px;">Activar</button>

          <span class="login-footer">
            <p style="color: #64748b; text-align: center;">
              ¿Revisaste tu base de datos para ver el PIN?
              <?php if (!empty($_SESSION['pin_desarrollo'])): ?>
                <br /><strong>PIN de prueba: <?= htmlspecialchars($_SESSION['pin_desarrollo']) ?></strong>
              <?php endif; ?>
            </p>
          </span>
        </form>

        <form class="card reset-form hidden" id="form-restablecer">
          <div class="form-info" style="text-align: left; position: relative; padding-bottom: 8px;">
            <button type="button" class="back-button material-symbols-outlined" id="btn-back-to-login">arrow_back</button>
            <h2 class="form-title">Restablecer contraseña</h2>
            <p class="form-subtitle">Utiliza el PIN de seguridad para cambiar tu contraseña y volver a iniciar sesión.</p>
          </div>

          <div class="reset-step-1">
            <div class="input-group">
              <label for="email_recuperacion">Correo Electrónico</label>
              <div class="input-container">
                <input
                  type="email"
                  id="email_recuperacion"
                  name="email"
                  autocomplete="email"
                  placeholder="nombre@ejemplo.com"
                  required />
              </div>
            </div>
            <button type="submit" class="btn-primary" id="reset-send-pin" style="margin-top: 16px; width: 100%;">Enviar enlace de recuperación</button>
          </div>

          <span class="login-footer">
            <p style="color: #64748b; text-align: center;" id="reset-footer-text">
              Te enviaremos un enlace seguro a tu correo para que puedas elegir una nueva contraseña.
            </p>
          </span>
        </form>

      </div>
    </section>
    <section id="benefits">
      <div class="benefits-info">
        <h2>Diseñado para tu tranquilidad</h2>
        <p>Todo lo que necesitas en un solo lugar, con una interfaz limpia y sin distracciones.</p>
      </div>
      <div class="benefits-cards">
        <article class="card">
          <div class="icon-box ">
            <span class="material-symbols-outlined icon-box icon-blue">donut_small</span>
          </div>
          <h3>Análisis Visual</h3>
          <p>Entiende en qué se va tu dinero con gráficos fáciles de leer. Identifica tus gastos hormiga al instante.</p>
        </article>
        <article class="card">
          <div class="icon-box ">
            <span class="material-symbols-outlined icon-box icon-green">target</span>
          </div>
          <h3>Metas Claras</h3>
          <p>Establece objetivos de ahorro y mira cómo tu progreso avanza día a día de forma automática.</p>
        </article>
        <article class="card">
          <div class="icon-box ">
            <span class="material-symbols-outlined icon-box icon-blue">receipt_long</span>
          </div>
          <h3>Gestión de Deudas</h3>
          <p>Registra lo que debes y lo que te deben. Mantén un historial impecable de tus compromisos.</p>
        </article>
      </div>
    </section>
  </main>
  <footer>
    <div class="logo-container">
      <div class="logo-icon">
        <span class="material-symbols-outlined">payments</span>
      </div>
      <h1 class="logo-text">FinanzaPro</h1>
    </div>
    <small>© 2026 FinanzaPro. Todos los derechos reservados.</small>
  </footer>
</body>

</html>