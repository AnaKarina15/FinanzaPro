<?php
require_once 'Conexion.php';

class Meta {
    private $conn;

    public function __construct() {
        $conexion = new Conexion();
        $this->conn = $conexion->getConexion();
    }

    public function obtenerMetasPorUsuario($id_usuario) {
        $sql = "SELECT m.*, i.codigo_material 
                FROM metas m 
                LEFT JOIN iconos i ON m.id_icono = i.id_icono 
                WHERE m.id_usuario = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$id_usuario]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function guardarMeta($id_usuario, $id_icono, $nombre, $monto_objetivo, $fecha_limite) {
        $sql = "INSERT INTO metas (id_usuario, id_icono, nombre, monto_objetivo, fecha_limite) 
                VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([$id_usuario, $id_icono, $nombre, $monto_objetivo, $fecha_limite]);
    }

    public function editarMeta($id_meta, $id_usuario, $id_icono, $nombre, $monto_objetivo, $fecha_limite) {
        $sql = "UPDATE metas 
                SET id_icono = ?, nombre = ?, monto_objetivo = ?, fecha_limite = ? 
                WHERE id_meta = ? AND id_usuario = ?";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([$id_icono, $nombre, $monto_objetivo, $fecha_limite, $id_meta, $id_usuario]);
    }

    public function eliminarMeta($id_meta, $id_usuario) {
        $sql = "DELETE FROM metas WHERE id_meta = ? AND id_usuario = ?";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([$id_meta, $id_usuario]);
    }
}
?>
