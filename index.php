<?php
define('BASE_URL', 'http://localhost/FinanzaPro');
require_once 'controller/ControladorUsuario.php';

$controlador = new ControladorUsuario();

if (isset($_GET['action'])) {
  switch ($_GET['action']) {
    case 'iniciarSesion':
      $controlador->iniciarSesion(
        $_POST['email'],
        $_POST['contrasena']
      );
      break;

    case 'registrar':
      $controlador->registrarUsuario(
        $_POST['nombre'],
        $_POST['apellido'],
        $_POST['email'],
        $_POST['codigo_pais'],
        $_POST['telefono'],
        $_POST['contrasena']
      );
      break;

    case 'guardarMovimiento':
      $controlador->guardarMovimiento(
        $_POST['tipo_movimiento'], // Gasto o Ingreso
        $_POST['monto'],
        $_POST['fecha'],
        $_POST['categoria'],
        $_POST['descripcion']
      );
      break;
    // ----------------------------------------------------

    default:
      $controlador->mostrarLogin();
      break;
  }
} else {
  $controlador->mostrarLogin();
}
?>