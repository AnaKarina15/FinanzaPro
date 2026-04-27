<?php
require_once __DIR__ . '/Conexion.php';

class Usuario {
  private $db;

  public function __construct() {
    $this->db = (new Conexion())->getConexion();
  }

  public function registrar($nombre, $apellido, $correo, $telefono, $contrasena) {
    $contrasena_hashed = password_hash($contrasena, PASSWORD_DEFAULT);

    $sql = 'INSERT INTO usuarios (nombre, apellido, correo, telefono, contrasena) VALUES (:nombre, :apellido, :correo, :telefono, :contrasena)';
    
    try {
      $stmt = $this->db->prepare($sql);
      $stmt->bindParam(':nombre', $nombre, PDO::PARAM_STR);
      $stmt->bindParam(':apellido', $apellido, PDO::PARAM_STR);
      $stmt->bindParam(':correo', $correo, PDO::PARAM_STR);
      $stmt->bindParam(':telefono', $telefono, PDO::PARAM_STR);
      $stmt->bindParam(':contrasena', $contrasena_hashed, PDO::PARAM_STR);

      return $stmt->execute();
    } catch (PDOException $e) {
      return false;
    }
  }

  public function verificarCredenciales($correo, $contrasena) {
    $sql = 'SELECT contrasena FROM usuarios WHERE correo = :correo';
    $stmt = $this->db->prepare($sql);
    $stmt->bindParam(':correo', $correo, PDO::PARAM_STR);
    $stmt->execute();
    
    $resultado = $stmt->fetch();
    
    if ($resultado) {
        return password_verify($contrasena, $resultado['contrasena']);
    }
    return false;
  }

  public function obtenerPorCorreo($correo) {
    $query = "SELECT u.*, r.nombre_rol
              FROM usuarios u
              INNER JOIN roles r ON u.id_rol = r.id_rol
              WHERE u.correo = :correo LIMIT 1";

    $stmt = $this->db->prepare($query);
    $stmt->bindParam(':correo', $correo, PDO::PARAM_STR);
    $stmt->execute();

    return $stmt->fetch();
  }
}
?>