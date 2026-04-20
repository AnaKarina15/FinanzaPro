<?php
class Conexion {
    private $host = "localhost";
    private $user = "root";
    private $password = "";
    private $db = "finanzaprophp";
    private $conexion;

    public function getConexion() {
        $this->conexion = new mysqli($this->host, $this->user, $this->password, $this->db);
        
        if ($this->conexion->connect_error) {
            die("Error de conexión a MySQL: " . $this->conexion->connect_error);
        }
        
        $this->conexion->set_charset("utf8mb4");
        
        return $this->conexion;
    }
}
?>