<?php

require_once "model/Conexion.php";

/**
 * Clase UsuarioDao
 * Capa de acceso a datos para la tabla 'usuarios'.
 */
class UsuarioDAO {
  /**
   * @var PDO Instancia de conexión a la base de datos.
   */
  private $conexion;

  public function __construct() {
    $this->conexion = Conexion::conectar();
  }

  /**
   * Registra un nuevo usuario en el sistema.
   * @return bool Verdadero si el registro fue exitoso.
   */
  public function insertar(array $datos) {
    $sql = "INSERT INTO usuarios (nombre, apellido, correo, telefono, contrasena)
            VALUES (?, ?, ?, ?, ?)";
    try {
      $stmt = $this->conexion->prepare($sql);
      return $stmt->execute([
        $datos["nombre"],
        $datos["apellido"],
        $datos["correo"],
        $datos["telefono"],
        password_hash($datos["contrasena"], PASSWORD_DEFAULT)
      ]);
    } catch (PDOException $error) {
      error_log("Error al registrar usuario: " . $error->getMessage());
      return false;
    }
  }

  /**
   * Obtiene los datos completos de un usuario incluyendo su rol.
   * @return object|bool Devuelve los datos del usuario o falso si el usuario no existe. 
   */
  public function obtenerPorCorreo($correo) {
    $sql = "SELECT u.*, r.nombre_rol 
            FROM usuarios u
            INNER JOIN roles r ON u.id_rol = r.id_rol
            WHERE u.correo = ? LIMIT 1";

    try {
      $stmt = $this->conexion->prepare($sql);
      $stmt->execute([$correo]);
      return $stmt->fetch();
    } catch (PDOException $error) {
      error_log("Error al obtener usuario por correo: " . $error->getMessage());
      return false;
    }
  }

  /**
   * Verifica si un correo ya está registrado.
   * @param string $correo El correo electrónico a consultar.
   * @return bool Verdadero si el correo ya existe, falso si está disponible.
   */
  public function existeCorreo($correo) {
    $sql = "SELECT 1 FROM usuarios WHERE correo = ? LIMIT 1";
    
    try {
      $stmt = $this->conexion->prepare($sql);
      $stmt->execute([$correo]);
      return (bool) $stmt->fetchColumn();
    } catch (PDOException $error) {
      error_log("Error crítico en verificarExistenciaCorreo: " . $error->getMessage());
      return true;
    }
  }

}
