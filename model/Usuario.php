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
    $stmt->bind_param( 'sssss', $nombre, $apellido, $correo, $telefono, $contrasena_hashed);

    try {
      $stmt->execute();
      return true;
    } catch (mysqli_sql_exception){
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
}
