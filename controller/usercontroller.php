<?php
require_once __DIR__ . '/../config/connection.php';
require_once __DIR__ . '/../models/user.php';

class ControladorUsuario {
    private $usuarioModel;

    public function __construct() {
        // Inicializamos la conexión y el modelo al instanciar el controlador
        $database = new Database();
        $db = $database->getConnection();
        $this->usuarioModel = new Usuario($db);
    }

    // --- REGISTRO ---
    public function registrarUsuario($nombre, $apellido, $correo, $codigo_pais, $telefono_num, $password) {
        $telefono = $codigo_pais . " " . $telefono_num;
        $pass_hash = password_hash($password, PASSWORD_DEFAULT);

        if ($this->usuarioModel->registrar($nombre, $apellido, $correo, $telefono, $pass_hash)) {
            // Si el registro es exitoso, redirigimos al login (ahora manejado por el enrutador)
            header("Location: index.php?registro=exito");
            exit();
        } else {
            echo "<script>alert('Error: El correo ya está registrado.'); window.location='index.php?action=mostrarRegistro';</script>";
        }
    }

    // --- LOGIN ---
    public function iniciarSesion($correo, $password) {
        $usuario = $this->usuarioModel->obtenerPorCorreo($correo);

        if ($usuario && password_verify($password, $usuario['contrasena'])) {
            session_start(); // Iniciamos la sesión aquí
            $_SESSION['id_usuario'] = $usuario['id_usuario'];
            $_SESSION['nombre_usuario'] = $usuario['nombre'];
            $_SESSION['apellido_usuario'] = $usuario['apellido'];
            $_SESSION['rol'] = $usuario['nombre_rol']; 
            
            // Redirección al dashboard de la vista
            header("Location: views/dashboard.php");
            exit();
        } else {
            echo "<script>alert('Credenciales incorrectas o correo no registrado.'); window.location='index.php';</script>";
        }
    }

    // --- VISTAS ---
    public function mostrarLogin() {
        require 'views/login.php'; 
    }

    public function mostrarRegistro() {
        require 'views/registro.php'; 
    }
}
?>