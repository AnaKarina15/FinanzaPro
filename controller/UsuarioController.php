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

    public function iniciarSesion($correo, $contrasena, $esRegistroNuevo = false) {
        $usuario = $this->modeloUsuario->obtenerPorCorreo($correo);

        // Verificamos que el usuario exista y la contraseña coincida
        if ($usuario && $this->modeloUsuario->verificarCredenciales($correo, $contrasena)) {
            if (session_status() == PHP_SESSION_NONE) session_start();
            
            $_SESSION['usuario'] = $correo;
            $_SESSION['id_usuario'] = $usuario['id_usuario'];
            $_SESSION['nombre_usuario'] = $usuario['nombre'];
            $_SESSION['apellido_usuario'] = $usuario['apellido'];
            $_SESSION['rol'] = $usuario['nombre_rol'];

            $urlDestino = 'http://localhost/FinanzaPro/views/dashboard.php';

            if ($esRegistroNuevo) {
                // Si viene de registrarse, agregamos el parámetro
                header("Location: " . $urlDestino . "?registro=exito");
            } else {
                // Si es un inicio de sesión normal
                header("Location: " . $urlDestino);
            }
            exit();
            
        } else {
            header('Location: http://localhost/FinanzaPro/index.php?login=error');
            exit();
        }
    }

    public function registrarUsuario($nombre, $apellido, $correo, $codigo_pais, $telefono_num, $contrasena) {
        $telefono = $codigo_pais . ' ' . $telefono_num;

        if ($this->modeloUsuario->registrar($nombre, $apellido, $correo, $telefono, $contrasena)) {
            // Esto llamará a iniciarSesion y activará el $esRegistroNuevo = true
            $this->iniciarSesion($correo, $contrasena, true);
        } else {
            header("Location: http://localhost/FinanzaPro/index.php?registro=error");
            exit();
        }
    }
}
?>