<?php
require_once __DIR__ . '/Conexion.php';

class Transaccion {
    private $conexion;

    public function __construct() {
        $this->conexion = (new Conexion())->getConexion();
    }

    public function registrarTransaccion($id_usuario, $tipo_movimiento, $monto, $fecha, $nombre_categoria, $descripcion) {
        // 1. Buscar si la categoría ya existe
        $queryCat = "SELECT id_categoria FROM categorias WHERE nombre = ? AND tipo = ? LIMIT 1";
        $stmtCat = $this->conexion->prepare($queryCat);
        
        // mysqli usa bind_param ("ss" significa que le pasamos 2 Strings)
        $stmtCat->bind_param("ss", $nombre_categoria, $tipo_movimiento);
        $stmtCat->execute();
        $resultado = $stmtCat->get_result();
        
        if ($fila = $resultado->fetch_assoc()) {
            $id_categoria = $fila['id_categoria'];
        } else {
            // Si no existe, la creamos
            $queryInsertCat = "INSERT INTO categorias (id_usuario, nombre, tipo) VALUES (?, ?, ?)";
            $stmtInsertCat = $this->conexion->prepare($queryInsertCat);
            // "iss" = Integer, String, String
            $stmtInsertCat->bind_param("iss", $id_usuario, $nombre_categoria, $tipo_movimiento);
            $stmtInsertCat->execute();
            // mysqli usa insert_id para obtener el último ID creado
            $id_categoria = $this->conexion->insert_id;
        }

        // 2. Insertar el movimiento
        $queryTrans = "INSERT INTO transacciones (id_usuario, id_categoria, monto, fecha, descripcion) VALUES (?, ?, ?, ?, ?)";
        $stmtTrans = $this->conexion->prepare($queryTrans);
        // "iiiss" = Integer, Integer, Integer, String, String
        $stmtTrans->bind_param("iiiss", $id_usuario, $id_categoria, $monto, $fecha, $descripcion);
        
        return $stmtTrans->execute();
    }

    // Función para obtener los totales de ingresos y gastos de las tarjetas
    public function obtenerTotales($id_usuario) {
        $query = "SELECT 
                    SUM(CASE WHEN c.tipo = 'ingreso' THEN t.monto ELSE 0 END) as total_ingresos,
                    SUM(CASE WHEN c.tipo = 'gasto' THEN t.monto ELSE 0 END) as total_gastos
                  FROM transacciones t
                  JOIN categorias c ON t.id_categoria = c.id_categoria
                  WHERE t.id_usuario = ?";
                  
        $stmt = $this->conexion->prepare($query);
        $stmt->bind_param("i", $id_usuario);
        $stmt->execute();
        $resultado = $stmt->get_result();
        
        // Si no hay datos, devolvemos 0
        $fila = $resultado->fetch_assoc();
        return [
            'ingresos' => $fila['total_ingresos'] ?? 0,
            'gastos' => $fila['total_gastos'] ?? 0
        ];
    }

    // Función para obtener los datos de la gráfica de dona
    public function obtenerGastosPorCategoria($id_usuario) {
        $query = "SELECT c.nombre, SUM(t.monto) as total
                  FROM transacciones t
                  JOIN categorias c ON t.id_categoria = c.id_categoria
                  WHERE t.id_usuario = ? AND c.tipo = 'gasto'
                  GROUP BY c.id_categoria";
                  
        $stmt = $this->conexion->prepare($query);
        $stmt->bind_param("i", $id_usuario);
        $stmt->execute();
        $resultado = $stmt->get_result();
        
        $datos = [];
        while($fila = $resultado->fetch_assoc()) {
            $datos[] = $fila;
        }
        return $datos;
    }
}
?>