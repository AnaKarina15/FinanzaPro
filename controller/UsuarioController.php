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

    public function obtenerDatosPerfil($id_usuario) {
        require_once 'model/Usuario.php';
        $modelo = new Usuario();
        return $modelo->obtenerPorId($id_usuario);
    }

    public function actualizarPerfil() {
        if (session_status() == PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['id_usuario'])) {
            header("Location: index.php");
            exit();
        }

        require_once 'model/Usuario.php';
        $modelo = new Usuario();
        $id_usuario = $_SESSION['id_usuario'];

        // Recolectar datos
        $nombre = trim($_POST['nombre'] ?? '');
        $apellido = trim($_POST['apellido'] ?? '');
        $telefono = trim($_POST['telefono'] ?? '');
        $moneda = $_POST['moneda_principal'] ?? 'COP';
        $tema = $_POST['tema_interfaz'] ?? 'claro';
        $push = isset($_POST['notificaciones_push']) ? 1 : 0;

        $exito = $modelo->actualizarPerfil($id_usuario, $nombre, $apellido, $telefono, $moneda, $tema, $push);
        $mensaje = "Perfil actualizado correctamente.";

        // Lógica de contraseña
        if (!empty($_POST['contrasena_actual'])) {
            if ($_POST['contrasena_nueva'] !== $_POST['confirmar_contrasena']) {
                $exito = false;
                $mensaje = "Las contraseñas nuevas no coinciden.";
            } elseif (!$modelo->cambiarContrasena($id_usuario, $_POST['contrasena_actual'], $_POST['contrasena_nueva'])) {
                $exito = false;
                $mensaje = "Error al cambiar la contraseña. Verifica tu contraseña actual.";
            } else {
                $mensaje = "Perfil y contraseña actualizados.";
            }
        }

        if ($exito) {
            // Actualizamos la sesión para que el nombre arriba a la izquierda cambie al instante
            $_SESSION['nombre_usuario'] = $nombre;
            $_SESSION['apellido_usuario'] = $apellido;
            header("Location: views/perfil.php?status=success&msg=" . urlencode($mensaje));
        } else {
            header("Location: views/perfil.php?status=error&msg=" . urlencode($mensaje));
        }
        exit();
    }
}
?>