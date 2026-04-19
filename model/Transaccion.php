<?php
require_once __DIR__ . '/../config/connection.php';

class Transaccion {
    private $conexion;

    public function __construct() {
        // Instanciamos la conexión tal como lo pide la arquitectura
        $database = new Database();
        $this->conexion = $database->getConnection();
    }

    public function registrarTransaccion($id_usuario, $tipo_movimiento, $monto, $fecha, $nombre_categoria, $descripcion) {
        // 1. Buscar el id_categoria basado en el nombre y tipo
        $queryCat = "SELECT id_categoria FROM categorias WHERE nombre = ? AND tipo = ? LIMIT 1";
        $stmtCat = $this->conexion->prepare($queryCat);
        // PDO:
        $stmtCat->execute([$nombre_categoria, $tipo_movimiento]);
        $categoria = $stmtCat->fetch(PDO::FETCH_ASSOC);
        
        if ($categoria) {
            $id_categoria = $categoria['id_categoria'];
        } else {
            // Si la categoría no existe, la creamos dinámicamente
            $queryInsertCat = "INSERT INTO categorias (id_usuario, nombre, tipo) VALUES (?, ?, ?)";
            $stmtInsertCat = $this->conexion->prepare($queryInsertCat);
            $stmtInsertCat->execute([$id_usuario, $nombre_categoria, $tipo_movimiento]);
            $id_categoria = $this->conexion->lastInsertId();
        }

        // 2. Insertar el movimiento en la tabla transacciones
        $queryTrans = "INSERT INTO transacciones (id_usuario, id_categoria, monto, fecha, descripcion) VALUES (?, ?, ?, ?, ?)";
        $stmtTrans = $this->conexion->prepare($queryTrans);
        
        return $stmtTrans->execute([$id_usuario, $id_categoria, $monto, $fecha, $descripcion]);
    }
}
?>