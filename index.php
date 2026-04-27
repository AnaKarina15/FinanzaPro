<?php
define('BASE_URL', 'http://localhost/FinanzaPro');

// Importamos nuestros controladores segmentados
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
            $_POST['nombre'], $_POST['apellido'], $_POST['email'], 
            $_POST['codigo_pais'], $_POST['telefono'], $_POST['contrasena']
        );
        break;

    // --- RUTAS DE TRANSACCIÓN ---
    case 'guardarMovimiento':
        $controller = new TransaccionController();
        $controller->guardarMovimiento(
            $_POST['tipo_movimiento'], $_POST['monto'], $_POST['fecha'], 
            $_POST['categoria'], $_POST['descripcion']
        );
        break;

    case 'obtenerEstadisticas':
        $controller = new TransaccionController();
        $controller->obtenerEstadisticasJson();
        break;

    // --- RUTA POR DEFECTO ---
    default:
        $controller = new UsuarioController();
        $controller->mostrarLogin();
        break;
}
?>