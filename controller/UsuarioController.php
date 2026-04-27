<?php
require_once __DIR__ . '/../model/Usuario.php';

class UsuarioController {
    private $modeloUsuario;

    public function __construct() {
        $this->modeloUsuario = new Usuario();
    }

    public function mostrarLogin() {
        require __DIR__ . '/../views/login.php';
    }

    public function iniciarSesion($correo, $contrasena) {
        $usuario = $this->modeloUsuario->obtenerPorCorreo($correo);

        // Verificamos que el usuario exista y la contraseña coincida
        if ($usuario && $this->modeloUsuario->verificarCredenciales($correo, $contrasena)) {
            if (session_status() == PHP_SESSION_NONE) session_start();
            
            $_SESSION['usuario'] = $correo;
            $_SESSION['id_usuario'] = $usuario['id_usuario'];
            $_SESSION['nombre_usuario'] = $usuario['nombre'];
            $_SESSION['apellido_usuario'] = $usuario['apellido'];
            $_SESSION['rol'] = $usuario['nombre_rol'];

            header('Location: views/dashboard.php');
            exit();
        } else {
            header('Location: index.php?login=error');
            exit();
        }
    }

    public function registrarUsuario($nombre, $apellido, $correo, $codigo_pais, $telefono_num, $contrasena) {
        $telefono = $codigo_pais . ' ' . $telefono_num;

        if ($this->modeloUsuario->registrar($nombre, $apellido, $correo, $telefono, $contrasena)) {
            $this->iniciarSesion($correo, $contrasena);
            exit();
        } else {
            header("Location: index.php?registro=error");
            exit();
        }
    }
}
?>