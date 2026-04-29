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

    public function actualizarFotoPerfil($id_usuario, $ruta_foto) {
        $query = 'UPDATE usuarios SET foto_perfil = :foto_perfil WHERE id_usuario = :id_usuario';
        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':foto_perfil', $ruta_foto, PDO::PARAM_STR);
        $stmt->bindParam(':id_usuario', $id_usuario, PDO::PARAM_INT);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error actualizando foto de perfil: " . $e->getMessage());
            return false;
        }
    }

    // ===== MÉTODOS DE ADMINISTRACIÓN =====

    public function listarUsuarios($pagina = 1, $porPagina = 10, $busqueda = '') {
        $offset = ($pagina - 1) * $porPagina;

        // Contar total
        if (!empty($busqueda)) {
            $queryCount = "SELECT COUNT(*) as total FROM usuarios u 
                           INNER JOIN roles r ON u.id_rol = r.id_rol
                           WHERE u.nombre LIKE :busqueda OR u.apellido LIKE :busqueda2 OR u.correo LIKE :busqueda3";
            $stmtCount = $this->conexion->prepare($queryCount);
            $like = "%$busqueda%";
            $stmtCount->bindParam(':busqueda', $like, PDO::PARAM_STR);
            $stmtCount->bindParam(':busqueda2', $like, PDO::PARAM_STR);
            $stmtCount->bindParam(':busqueda3', $like, PDO::PARAM_STR);
        } else {
            $queryCount = "SELECT COUNT(*) as total FROM usuarios";
            $stmtCount = $this->conexion->prepare($queryCount);
        }
        $stmtCount->execute();
        $total = (int) $stmtCount->fetch()['total'];

        // Obtener registros paginados
        if (!empty($busqueda)) {
            $query = "SELECT u.*, r.nombre_rol FROM usuarios u
                      INNER JOIN roles r ON u.id_rol = r.id_rol
                      WHERE u.nombre LIKE :busqueda OR u.apellido LIKE :busqueda2 OR u.correo LIKE :busqueda3
                      ORDER BY u.id_usuario DESC LIMIT :limite OFFSET :offset";
            $stmt = $this->conexion->prepare($query);
            $stmt->bindParam(':busqueda', $like, PDO::PARAM_STR);
            $stmt->bindParam(':busqueda2', $like, PDO::PARAM_STR);
            $stmt->bindParam(':busqueda3', $like, PDO::PARAM_STR);
        } else {
            $query = "SELECT u.*, r.nombre_rol FROM usuarios u
                      INNER JOIN roles r ON u.id_rol = r.id_rol
                      ORDER BY u.id_usuario DESC LIMIT :limite OFFSET :offset";
            $stmt = $this->conexion->prepare($query);
        }
        $stmt->bindParam(':limite', $porPagina, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'usuarios' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total' => $total,
            'pagina' => $pagina,
            'porPagina' => $porPagina,
            'totalPaginas' => ceil($total / $porPagina)
        ];
    }

    public function estadisticasAdmin() {
        $total = $this->conexion->query("SELECT COUNT(*) as c FROM usuarios")->fetch()['c'];
        $activos = $this->conexion->query("SELECT COUNT(*) as c FROM usuarios WHERE cuenta_verificada = 1")->fetch()['c'];
        $nuevos = $this->conexion->query("SELECT COUNT(*) as c FROM usuarios WHERE fecha_registro >= DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetch()['c'];

        return [
            'totalUsuarios' => (int) $total,
            'activos' => (int) $activos,
            'nuevosSemana' => (int) $nuevos
        ];
    }

    public function crearUsuarioAdmin($nombre, $apellido, $correo, $telefono, $contrasena, $id_rol) {
        $contrasena_hashed = password_hash($contrasena, PASSWORD_DEFAULT);
        $query = "INSERT INTO usuarios (nombre, apellido, correo, telefono, contrasena, id_rol, cuenta_verificada)
                  VALUES (:nombre, :apellido, :correo, :telefono, :contrasena, :id_rol, 1)";

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
            error_log("Error creando usuario admin: " . $e->getMessage());
            return false;
        }
    }

    public function actualizarUsuarioAdmin($id_usuario, $nombre, $apellido, $correo, $telefono, $id_rol) {
        $query = "UPDATE usuarios SET nombre = :nombre, apellido = :apellido, correo = :correo,
                  telefono = :telefono, id_rol = :id_rol WHERE id_usuario = :id_usuario";

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
            error_log("Error actualizando usuario admin: " . $e->getMessage());
            return false;
        }
    }

    public function eliminarUsuario($id_usuario) {
        $query = "DELETE FROM usuarios WHERE id_usuario = :id_usuario";
        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':id_usuario', $id_usuario, PDO::PARAM_INT);

        try {
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error eliminando usuario: " . $e->getMessage());
            return false;
        }
    }
}
