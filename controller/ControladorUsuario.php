<?php
require_once 'model/Usuario.php';

class ControladorUsuario {
  private $modeloUsuario;

  public function __construct() {
    $this->modeloUsuario = new Usuario();
  }

  public function mostrarLogin() {
    require 'views/login.php';
  }

  public function iniciarSesion($correo, $contrasena) {
    $usuario = $this->modeloUsuario->obtenerPorCorreo($correo);

    if ($this->modeloUsuario->verificarCredenciales($correo, $contrasena)) {
      session_start();

      $_SESSION['usuario'] = $correo;
      $_SESSION['id_usuario'] = $usuario['id_usuario'];
      $_SESSION['nombre_usuario'] = $usuario['nombre'];
      $_SESSION['apellido_usuario'] = $usuario['apellido'];
      $_SESSION['rol'] = $usuario['nombre_rol'];


      header('Location: views/dashboard.php');
    } else {
      header('Location: index.php?login=error');
    }
  }

  public function registrarUsuario($nombre, $apellido, $correo, $codigo_pais, $telefono_num, $contrasena) {
    $telefono = $codigo_pais . ' ' . $telefono_num;

    if ($this->modeloUsuario->registrar($nombre, $apellido, $correo, $telefono, $contrasena)) {
            // Si el registro es exitoso, redirigimos al login (ahora manejado por el enrutador)
            header("Location: index.php?registro=exito");
            exit();
        } else {
            header("Location: index.php?registro=error");
        }
  }

  public function guardarMovimiento($tipo_movimiento, $monto, $fecha, $categoria, $descripcion) {
      session_start();
      
      // Verificamos por seguridad que la sesión del usuario exista
      if (!isset($_SESSION['id_usuario'])) {
          header('Location: index.php');
          exit();
      }

      // Requerimos el modelo de Transacción para registrar el movimiento
      require_once __DIR__ . '/../models/Transaccion.php';
      $modeloTransaccion = new Transaccion();

      $id_usuario = $_SESSION['id_usuario'];

      // Intentamos registrar la transacción
      if ($modeloTransaccion->registrarTransaccion($id_usuario, $tipo_movimiento, $monto, $fecha, $categoria, $descripcion)) {
          // Si es exitoso, redirigimos de vuelta a la vista de ingresos
          header("Location: views/ingresosGastos.php?guardado=exito");
          exit();
      } else {
          header("Location: views/ingresosGastos.php?guardado=error");
          exit();
      }
  }
}
