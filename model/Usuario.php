<?php
require_once __DIR__ . '/Conexion.php';

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
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    return $row ? password_verify($contrasena, $row['contrasena']) : false;
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

  public function obtenerPorId($id_usuario) {
    $query = "SELECT u.*, r.nombre_rol
              FROM usuarios u
              INNER JOIN roles r ON u.id_rol = r.id_rol
              WHERE u.id_usuario = ? LIMIT 1";

    $stmt = $this->conexion->prepare($query);
    $stmt->bind_param('i', $id_usuario);
    $stmt->execute();

    $result = $stmt->get_result();
    return $result->fetch_assoc();
  }

  public function actualizarPerfil($id_usuario, $nombre, $apellido, $telefono, $moneda_principal, $tema_interfaz, $notificaciones_push) {
    $stmt = $this->conexion->prepare('UPDATE usuarios SET nombre = ?, apellido = ?, telefono = ?, moneda_principal = ?, tema_interfaz = ?, notificaciones_push = ? WHERE id_usuario = ?');
    $stmt->bind_param('sssssii', $nombre, $apellido, $telefono, $moneda_principal, $tema_interfaz, $notificaciones_push, $id_usuario);

    try {
      $stmt->execute();
      return true;
    } catch (mysqli_sql_exception) {
      return false;
    }
  }

  public function cambiarContrasena($id_usuario, $contrasena_actual, $contrasena_nueva) {
    $stmt = $this->conexion->prepare('SELECT contrasena FROM usuarios WHERE id_usuario = ?');
    $stmt->bind_param('i', $id_usuario);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();

    // Verificar que la contraseña actual es correcta
    if (!$row || !password_verify($contrasena_actual, $row['contrasena'])) {
      return false;
    }

    // Actualizar a la nueva contraseña
    $contrasena_nueva_hashed = password_hash($contrasena_nueva, PASSWORD_DEFAULT);
    $stmt_update = $this->conexion->prepare('UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?');
    $stmt_update->bind_param('si', $contrasena_nueva_hashed, $id_usuario);

    try {
      $stmt_update->execute();
      return true;
    } catch (mysqli_sql_exception) {
      return false;
    }
  }
}
