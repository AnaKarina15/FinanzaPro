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

    public function existeCorreo($correo) {
        $query = 'SELECT COUNT(*) as total FROM usuarios WHERE correo = :correo';
        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':correo', $correo, PDO::PARAM_STR);
        $stmt->execute();
        $row = $stmt->fetch();

        return $row ? (int)$row['total'] > 0 : false;
    }

    public function cambiarCorreo($id_usuario, $nuevo_correo) {
        $query = 'UPDATE usuarios SET correo = :correo WHERE id_usuario = :id_usuario';
        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':correo', $nuevo_correo, PDO::PARAM_STR);
        $stmt->bindParam(':id_usuario', $id_usuario, PDO::PARAM_INT);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error cambiando correo: " . $e->getMessage());
            return false;
        }
    }

    // ========== MÉTODOS DE ADMINISTRACIÓN ==========

    /**
     * Lista todos los usuarios con paginación y búsqueda
     */
    public function listarTodos($pagina = 1, $porPagina = 10, $busqueda = '') {
        $offset = ($pagina - 1) * $porPagina;

        $where = '';
        $params = [];

        if (!empty($busqueda)) {
            $where = " WHERE u.nombre LIKE :busqueda OR u.apellido LIKE :busqueda2 OR u.correo LIKE :busqueda3";
            $params[':busqueda'] = "%$busqueda%";
            $params[':busqueda2'] = "%$busqueda%";
            $params[':busqueda3'] = "%$busqueda%";
        }

        $query = "SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.telefono, u.id_rol, 
                         u.cuenta_verificada, u.fecha_registro, r.nombre_rol
                  FROM usuarios u
                  INNER JOIN roles r ON u.id_rol = r.id_rol
                  $where
                  ORDER BY u.fecha_registro DESC
                  LIMIT :limite OFFSET :offset";

        $stmt = $this->conexion->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, PDO::PARAM_STR);
        }
        $stmt->bindValue(':limite', (int)$porPagina, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Cuenta el total de usuarios (para paginación)
     */
    public function contarUsuarios($busqueda = '') {
        $where = '';
        $params = [];

        if (!empty($busqueda)) {
            $where = " WHERE u.nombre LIKE :busqueda OR u.apellido LIKE :busqueda2 OR u.correo LIKE :busqueda3";
            $params[':busqueda'] = "%$busqueda%";
            $params[':busqueda2'] = "%$busqueda%";
            $params[':busqueda3'] = "%$busqueda%";
        }

        $query = "SELECT COUNT(*) as total FROM usuarios u $where";
        $stmt = $this->conexion->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, PDO::PARAM_STR);
        }
        $stmt->execute();
        $row = $stmt->fetch();
        return (int)$row['total'];
    }

    /**
     * Cuenta usuarios con cuenta_verificada = 1
     */
    public function contarUsuariosActivos() {
        $query = "SELECT COUNT(*) as total FROM usuarios WHERE cuenta_verificada = 1";
        $stmt = $this->conexion->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch();
        return (int)$row['total'];
    }

    /**
     * Cuenta usuarios registrados en los últimos 7 días
     */
    public function contarUsuariosNuevosSemana() {
        $query = "SELECT COUNT(*) as total FROM usuarios WHERE fecha_registro >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        $stmt = $this->conexion->prepare($query);
        $stmt->execute();
        $row = $stmt->fetch();
        return (int)$row['total'];
    }

    /**
     * Crea un usuario desde el panel de admin (con rol personalizable)
     */
    public function crearUsuarioAdmin($nombre, $apellido, $correo, $telefono, $contrasena, $id_rol) {
        $contrasena_hashed = password_hash($contrasena, PASSWORD_DEFAULT);

        $query = 'INSERT INTO usuarios (nombre, apellido, correo, telefono, contrasena, id_rol, cuenta_verificada)
                  VALUES (:nombre, :apellido, :correo, :telefono, :contrasena, :id_rol, 1)';

        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':nombre', $nombre, PDO::PARAM_STR);
        $stmt->bindParam(':apellido', $apellido, PDO::PARAM_STR);
        $stmt->bindParam(':correo', $correo, PDO::PARAM_STR);
        $stmt->bindParam(':telefono', $telefono, PDO::PARAM_STR);
        $stmt->bindParam(':contrasena', $contrasena_hashed, PDO::PARAM_STR);
        $stmt->bindParam(':id_rol', $id_rol, PDO::PARAM_INT);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error al crear usuario (admin): " . $e->getMessage());
            return false;
        }
    }

    /**
     * Actualiza un usuario desde el panel de admin (incluye rol)
     */
    public function actualizarUsuarioAdmin($id_usuario, $nombre, $apellido, $correo, $telefono, $id_rol) {
        $query = 'UPDATE usuarios SET nombre = :nombre, apellido = :apellido, correo = :correo, 
                  telefono = :telefono, id_rol = :id_rol 
                  WHERE id_usuario = :id_usuario';

        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':nombre', $nombre, PDO::PARAM_STR);
        $stmt->bindParam(':apellido', $apellido, PDO::PARAM_STR);
        $stmt->bindParam(':correo', $correo, PDO::PARAM_STR);
        $stmt->bindParam(':telefono', $telefono, PDO::PARAM_STR);
        $stmt->bindParam(':id_rol', $id_rol, PDO::PARAM_INT);
        $stmt->bindParam(':id_usuario', $id_usuario, PDO::PARAM_INT);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error actualizando usuario (admin): " . $e->getMessage());
            return false;
        }
    }

    /**
     * Elimina un usuario por su ID
     */
    public function eliminarUsuario($id_usuario) {
        $query = 'DELETE FROM usuarios WHERE id_usuario = :id_usuario';
        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':id_usuario', $id_usuario, PDO::PARAM_INT);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error eliminando usuario: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtiene todos los roles disponibles
     */
    public function obtenerRoles() {
        $query = 'SELECT * FROM roles ORDER BY id_rol ASC';
        $stmt = $this->conexion->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
