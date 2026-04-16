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
    if ($this->modeloUsuario->verificarCredenciales($correo, $contrasena)) {
      session_start();
      $_SESSION['usuario'] = $correo;
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
}
