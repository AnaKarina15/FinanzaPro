<?php
require_once 'model/Conexion.php';

class Usuario {
  private $conexion;

  public function __construct() {
    $this->conexion = (new Conexion())->getConexion();
  }

  public function registrar($nombre, $apellido, $correo, $telefono, $contrasena) {
    $contrasena_hashed = password_hash($contrasena, PASSWORD_DEFAULT);

    $stmt = $this->conexion->prepare('INSERT INTO usuarios (nombre, apellido, correo, telefono, contrasena) VALUES (?, ?, ?, ?, ?)');
    $stmt->bind_param('sssss', $nombre, $apellido, $correo, $telefono, $contrasena_hashed);

    try {
      $stmt->execute();
      return true;
    } catch (mysqli_sql_exception) {
      return false;
    }
  }

  public function verificarCredenciales($correo, $contrasena) {
    $stmt = $this->conexion->prepare('SELECT contrasena FROM usuarios WHERE correo = ?');
    $stmt->bind_param('s', $correo);
    $stmt->execute();
    $stmt->bind_result($contrasena_hashed);
    $stmt->fetch();
    return password_verify($contrasena, $contrasena_hashed);
  }

  public function obtenerPorCorreo($correo) {
    // Hacemos un JOIN para traer los datos del usuario + el nombre de su rol
    $query = "SELECT u.*, r.nombre_rol 
              FROM usuarios u
              INNER JOIN roles r ON u.id_rol = r.id_rol
              WHERE u.correo = ? LIMIT 1";

    $stmt = $this->conexion->prepare($query);
    $stmt->bind_param('s', $correo);
    $stmt->execute();

    $result = $stmt->get_result();
    return $result->fetch_assoc();
  }
}
