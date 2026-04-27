<?php
// Capturamos el correo de la URL por seguridad
$correo = $_GET['correo'] ?? '';
if (empty($correo)) {
    header("Location: ../index.php");
    exit();
}
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verificar Cuenta - FinanzaPro</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="./css/global.css" />
    <link rel="stylesheet" href="./css/verificar.css" />
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body>
    <div class="auth-wrapper">
        <div class="verify-card">
            <span class="material-symbols-outlined icon-verify">mark_email_read</span>
            
            <h2>Verifica tu cuenta</h2>
            <p>Hemos generado un código de seguridad para <strong><?= htmlspecialchars($correo) ?></strong>.</p>
            
            <form id="form-verificar">
                <input type="hidden" id="correo_verificacion" value="<?= htmlspecialchars($correo) ?>">
                <input type="text" id="codigo_pin" class="pin-input" maxlength="6" placeholder="123456" required autocomplete="off">
                
                <button type="submit" class="btn-primary btn-verify">Activar Cuenta</button>
            </form>
            
            <p class="verify-footer-text">¿Revisaste tu base de datos para ver el PIN?</p>
        </div>
    </div>
    <script src="./js/verificar.js"></script>
</body>
</html>