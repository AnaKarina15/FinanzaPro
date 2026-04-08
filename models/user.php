<?php
class Usuario {
    private $conn;
    private $table_name = "usuarios";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function registrar($nombre, $apellido, $correo, $telefono, $pass_hash) {
        $query = "INSERT INTO " . $this->table_name . "
                    (nombre, apellido, correo, telefono, contrasena)
                    VALUES (:nombre, :apellido, :correo, :telefono, :pass)";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':nombre', $nombre);
        $stmt->bindParam(':apellido', $apellido);
        $stmt->bindParam(':correo', $correo);
        $stmt->bindParam(':telefono', $telefono);
        $stmt->bindParam(':pass', $pass_hash);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function obtenerPorCorreo($correo) {
        // Hacemos un JOIN para traer los datos del usuario + el nombre de su rol
        $query = "SELECT u.*, r.nombre_rol 
                    FROM " . $this->table_name . " u
                    INNER JOIN roles r ON u.id_rol = r.id_rol
                    WHERE u.correo = :correo LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':correo', $correo);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>