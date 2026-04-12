<?php
define('BASE_URL', 'http://localhost/finanzapro/');
require_once 'controller/usercontroller.php';

$controlador = new ControladorUsuario();

if (isset($_GET['action'])) {
    switch ($_GET['action']) {
        case 'iniciarSesion':
            $controlador->iniciarSesion($_POST['email'], $_POST['password']); 
            break;

        case 'registrar':
            $controlador->registrarUsuario(
                $_POST['nombre'],
                $_POST['apellido'],
                $_POST['email'],
                $_POST['codigo_pais'],
                $_POST['telefono'],
                $_POST['password']
            );
            break;

        case 'mostrarRegistro':
            $controlador->mostrarRegistro();
            break;

        default:
            $controlador->mostrarLogin();
            break;
    }
} else {
    $controlador->mostrarLogin();
}
?>