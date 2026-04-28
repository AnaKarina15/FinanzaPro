<?php
// 1. EL INTERRUPTOR MAESTRO DE SESIONES (Debe ir estrictamente en la línea 1)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

define('BASE_URL', 'http://localhost/FinanzaPro');

require_once 'controller/UsuarioController.php';
require_once 'controller/TransaccionController.php';

// Determinamos la acción, por defecto enviamos al login
$action = isset($_GET['action']) ? $_GET['action'] : 'default';

switch ($action) {
    // --- RUTAS DE USUARIO ---
    case 'iniciarSesion':
        $controller = new UsuarioController();
        $controller->iniciarSesion($_POST['email'], $_POST['contrasena']);
        break;

    case 'registrar':
        $controller = new UsuarioController();
        $controller->registrarUsuario(
            $_POST['nombre'],
            $_POST['apellido'],
            $_POST['email'],
            $_POST['codigo_pais'],
            $_POST['telefono'],
            $_POST['contrasena']
        );
        break;

    // RUTA: Donde llega el Fetch API desde Javascript
    case 'activarCuenta':
        $controller = new UsuarioController();
        $controller->activarCuenta();
        break;

    case 'solicitarRecuperacion':
        $controller = new UsuarioController();
        $controller->solicitarRecuperacion();
        break;

    case 'restablecerContrasena':
        $controller = new UsuarioController();
        $controller->restablecerContrasena();
        break;

    case 'actualizarPerfil':
        $controller = new UsuarioController();
        $controller->actualizarPerfil();
        break;

    case 'cambiarCorreo':
        $controller = new UsuarioController();
        $controller->cambiarCorreo();
        break;

    case 'cambiarFotoPerfil':
        $controller = new UsuarioController();
        $controller->cambiarFotoPerfil();
        break;

    case 'cerrarSesion':
        $controller = new UsuarioController();
        $controller->cerrarSesion();
        break;

    // --- RUTAS DE TRANSACCIÓN ---
    case 'guardarMovimiento':
        $controller = new TransaccionController();
        $controller->guardarMovimiento();
        break;

    case 'obtenerEstadisticas':
        $controller = new TransaccionController();
        $controller->obtenerEstadisticasJson();
        break;

    case 'eliminarMovimiento':
        // RUTA PARA ELIMINACIÓN DESDE JS
        $controller = new TransaccionController();
        $controller->eliminarMovimiento();
        break;

    // --- RUTA POR DEFECTO ---
    default:
        $controller = new UsuarioController();
        $controller->mostrarLogin();
        break;
}
