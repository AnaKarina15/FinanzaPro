<?php
require_once __DIR__ . '/Conexion.php';

class Usuario {
    private $conexion;

    public function __construct() {
        $this->conexion = (new Conexion())->getConexion();
    }

    public function registrar($nombre, $apellido, $correo, $telefono, $contrasena) {
        $contrasena_hashed = password_hash($contrasena, PASSWORD_DEFAULT);

        // PDO usa parámetros nombrados (:nombre)
        $query = 'INSERT INTO usuarios (nombre, apellido, correo, telefono, contrasena, id_rol)
                  VALUES (:nombre, :apellido, :correo, :telefono, :contrasena, 2)'; // 2 = Rol Usuario por defecto
        
        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':nombre', $nombre, PDO::PARAM_STR);
        $stmt->bindParam(':apellido', $apellido, PDO::PARAM_STR);
        $stmt->bindParam(':correo', $correo, PDO::PARAM_STR);
        $stmt->bindParam(':telefono', $telefono, PDO::PARAM_STR);
        $stmt->bindParam(':contrasena', $contrasena_hashed, PDO::PARAM_STR);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error al registrar usuario: " . $e->getMessage());
            return false;
        }
    }

    public function verificarCredenciales($correo, $contrasena) {
        $query = 'SELECT contrasena FROM usuarios WHERE correo = :correo LIMIT 1';
        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':correo', $correo, PDO::PARAM_STR);
        $stmt->execute();
        
        // PDO devuelve arreglos asociativos automáticamente
        $row = $stmt->fetch();
        
        return $row ? password_verify($contrasena, $row['contrasena']) : false;
    }

    public function obtenerPorCorreo($correo) {
        $query = "SELECT u.*, r.nombre_rol
                  FROM usuarios u
                  INNER JOIN roles r ON u.id_rol = r.id_rol
                  WHERE u.correo = :correo LIMIT 1";

        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':correo', $correo, PDO::PARAM_STR);
        $stmt->execute();

        return $stmt->fetch();
    }

    public function obtenerPorId($id_usuario) {
        $query = "SELECT u.*, r.nombre_rol
                  FROM usuarios u
                  INNER JOIN roles r ON u.id_rol = r.id_rol
                  WHERE u.id_usuario = :id_usuario LIMIT 1";

        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':id_usuario', $id_usuario, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch();
    }

    public function actualizarPerfil($id_usuario, $nombre, $apellido, $telefono, $moneda_principal, $tema_interfaz, $notificaciones_push) {
        $query = 'UPDATE usuarios SET nombre = :nombre, apellido = :apellido, telefono = :telefono, 
                  moneda_principal = :moneda, tema_interfaz = :tema, notificaciones_push = :notificaciones 
                  WHERE id_usuario = :id_usuario';
                  
        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':nombre', $nombre, PDO::PARAM_STR);
        $stmt->bindParam(':apellido', $apellido, PDO::PARAM_STR);
        $stmt->bindParam(':telefono', $telefono, PDO::PARAM_STR);
        $stmt->bindParam(':moneda', $moneda_principal, PDO::PARAM_STR);
        $stmt->bindParam(':tema', $tema_interfaz, PDO::PARAM_STR);
        $stmt->bindParam(':notificaciones', $notificaciones_push, PDO::PARAM_INT);
        $stmt->bindParam(':id_usuario', $id_usuario, PDO::PARAM_INT);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error actualizando perfil: " . $e->getMessage());
            return false;
        }
    }

    public function cambiarContrasena($id_usuario, $contrasena_actual, $contrasena_nueva) {
        // 1. Obtener contraseña actual
        $query = 'SELECT contrasena FROM usuarios WHERE id_usuario = :id_usuario LIMIT 1';
        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':id_usuario', $id_usuario, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch();

        // 2. Verificar que la contraseña actual sea correcta
        if (!$row || !password_verify($contrasena_actual, $row['contrasena'])) {
            return false;
        }

        // 3. Actualizar a la nueva contraseña
        $contrasena_nueva_hashed = password_hash($contrasena_nueva, PASSWORD_DEFAULT);
        $query_update = 'UPDATE usuarios SET contrasena = :contrasena WHERE id_usuario = :id_usuario';
        $stmt_update = $this->conexion->prepare($query_update);
        $stmt_update->bindParam(':contrasena', $contrasena_nueva_hashed, PDO::PARAM_STR);
        $stmt_update->bindParam(':id_usuario', $id_usuario, PDO::PARAM_INT);

        try {
            return $stmt_update->execute();
        } catch (PDOException $e) {
            error_log("Error cambiando contraseña: " . $e->getMessage());
            return false;
        }
    }
}
?>