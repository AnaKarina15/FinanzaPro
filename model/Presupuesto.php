<?php
require_once 'Conexion.php';

class Presupuesto {
    private $conn;

    public function __construct() {
        $conexion = new Conexion();
        $this->conn = $conexion->getConexion();
    }

    public function obtenerPresupuestosPorUsuario($id_usuario, $mes, $anio) {
        $sql = "SELECT p.*, i.codigo_material, c.nombre as nombre_categoria, 
                       COALESCE(SUM(t.monto), 0) as monto_consumido
                FROM presupuestos p 
                LEFT JOIN iconos i ON p.id_icono = i.id_icono 
                LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
                LEFT JOIN transacciones t ON p.id_categoria = t.id_categoria 
                      AND t.id_usuario = p.id_usuario 
                      AND MONTH(t.fecha) = ? 
                      AND YEAR(t.fecha) = ?
                WHERE p.id_usuario = ?
                GROUP BY p.id_presupuesto";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$mes, $anio, $id_usuario]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function obtenerConsumido($id_usuario, $id_categoria, $mes, $anio) {
        $sql = "SELECT SUM(monto) as total 
                FROM transacciones 
                WHERE id_usuario = ? AND id_categoria = ? 
                AND MONTH(fecha) = ? AND YEAR(fecha) = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute([$id_usuario, $id_categoria, $mes, $anio]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'] ? $result['total'] : 0.00;
    }

    public function guardarPresupuesto($id_usuario, $id_categoria, $id_icono, $nombre, $monto_limite, $alerta_80_porciento) {
        $sql = "INSERT INTO presupuestos (id_usuario, id_categoria, id_icono, nombre, monto_limite, alerta_80_porciento) 
                VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([$id_usuario, $id_categoria, $id_icono, $nombre, $monto_limite, $alerta_80_porciento]);
    }

    public function editarPresupuesto($id_presupuesto, $id_usuario, $id_categoria, $id_icono, $nombre, $monto_limite, $alerta_80_porciento) {
        $sql = "UPDATE presupuestos 
                SET id_categoria = ?, id_icono = ?, nombre = ?, monto_limite = ?, alerta_80_porciento = ? 
                WHERE id_presupuesto = ? AND id_usuario = ?";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([$id_categoria, $id_icono, $nombre, $monto_limite, $alerta_80_porciento, $id_presupuesto, $id_usuario]);
    }

    public function eliminarPresupuesto($id_presupuesto, $id_usuario) {
        $sql = "DELETE FROM presupuestos WHERE id_presupuesto = ? AND id_usuario = ?";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute([$id_presupuesto, $id_usuario]);
    }
}
?>
