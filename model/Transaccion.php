<?php
require_once __DIR__ . '/Conexion.php';

class Transaccion {
    private $db;

    public function __construct() {
        $this->db = (new Conexion())->getConexion();
    }

public function registrarTransaccion($id_usuario, $tipo_movimiento, $monto, $fecha, $nombre_categoria, $descripcion) {
        try {
            $this->db->beginTransaction();
            
            // 1. Obtener o crear la categoría primero
            $queryCat = "SELECT id_categoria FROM categorias WHERE nombre = :nombre AND tipo = :tipo AND (id_usuario = :id_usuario OR id_usuario IS NULL) LIMIT 1";
            $stmtCat = $this->db->prepare($queryCat);
            $stmtCat->execute([
                ':nombre' => $nombre_categoria, 
                ':tipo' => $tipo_movimiento, 
                ':id_usuario' => $id_usuario
            ]);
            
            $categoria = $stmtCat->fetch();
            if ($categoria) {
                $id_categoria = $categoria['id_categoria'];
            } else {
                // Si la categoría no existe, la creamos
                $queryInsertCat = "INSERT INTO categorias (id_usuario, nombre, tipo) VALUES (:id_usuario, :nombre, :tipo)";
                $stmtInsertCat = $this->db->prepare($queryInsertCat);
                $stmtInsertCat->execute([
                    ':id_usuario' => $id_usuario, 
                    ':nombre' => $nombre_categoria, 
                    ':tipo' => $tipo_movimiento
                ]);
                $id_categoria = $this->db->lastInsertId();
            }

            // 2. Insertar el movimiento en transacciones
            $queryTrans = "INSERT INTO transacciones (id_usuario, id_categoria, monto, fecha, descripcion) VALUES (:id_usuario, :id_categoria, :monto, :fecha, :descripcion)";
            $stmtTrans = $this->db->prepare($queryTrans);
            $stmtTrans->execute([
                ':id_usuario' => $id_usuario,
                ':id_categoria' => $id_categoria,
                ':monto' => $monto,
                ':fecha' => $fecha,
                ':descripcion' => $descripcion
            ]);
            
            $this->db->commit();
            return true;
        } catch (PDOException $e) {
            $this->db->rollBack();
            // Esto imprimirá en el archivo de errores de PHP si algo falla en la base de datos
            error_log("Error guardando movimiento: " . $e->getMessage()); 
            return false;
        }
    }

    public function obtenerTotales($id_usuario) {
        $query = "SELECT
                    SUM(CASE WHEN c.tipo = 'ingreso' THEN t.monto ELSE 0 END) as total_ingresos,
                    SUM(CASE WHEN c.tipo = 'gasto' THEN t.monto ELSE 0 END) as total_gastos
                FROM transacciones t
                JOIN categorias c ON t.id_categoria = c.id_categoria
                WHERE t.id_usuario = :id_usuario";
                
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":id_usuario", $id_usuario, PDO::PARAM_INT);
        $stmt->execute();
        
        $fila = $stmt->fetch();
        return [
            'ingresos' => $fila['total_ingresos'] ?? 0,
            'gastos' => $fila['total_gastos'] ?? 0
        ];
    }

    public function obtenerGastosPorCategoria($id_usuario) {
        $query = "SELECT c.nombre, SUM(t.monto) as total
                FROM transacciones t
                JOIN categorias c ON t.id_categoria = c.id_categoria
                WHERE t.id_usuario = :id_usuario AND c.tipo = 'gasto'
                GROUP BY c.id_categoria";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":id_usuario", $id_usuario, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function obtenerIngresosPorCategoria($id_usuario) {
        $query = "SELECT c.nombre, SUM(t.monto) as total FROM transacciones t 
                JOIN categorias c ON t.id_categoria = c.id_categoria 
                WHERE t.id_usuario = :id_usuario AND c.tipo = 'ingreso' GROUP BY c.id_categoria";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":id_usuario", $id_usuario, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function obtenerIngresosGastosPorMes($id_usuario) {
        $query = "SELECT
                    MONTH(t.fecha) as mes,
                    SUM(CASE WHEN c.tipo = 'ingreso' THEN t.monto ELSE 0 END) as total_ingresos,
                    SUM(CASE WHEN c.tipo = 'gasto' THEN t.monto ELSE 0 END) as total_gastos
                FROM transacciones t
                JOIN categorias c ON t.id_categoria = c.id_categoria
                WHERE t.id_usuario = :id_usuario AND YEAR(t.fecha) = YEAR(CURRENT_DATE())
                GROUP BY MONTH(t.fecha)
                ORDER BY MONTH(t.fecha)";
                
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":id_usuario", $id_usuario, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function obtenerMovimientos($id_usuario, $limite = 10) {
        $query = "SELECT t.id_transaccion, t.monto, t.fecha, t.descripcion, c.nombre as categoria, c.tipo
                FROM transacciones t
                JOIN categorias c ON t.id_categoria = c.id_categoria
                WHERE t.id_usuario = :id_usuario
                ORDER BY t.fecha DESC, t.id_transaccion DESC
                LIMIT :limite";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":id_usuario", $id_usuario, PDO::PARAM_INT);
        // BindValue se usa aquí porque el límite es un entero directo
        $stmt->bindValue(":limite", (int)$limite, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    // Método para Actualizar
    public function actualizarTransaccion($id_transaccion, $id_usuario, $tipo_movimiento, $monto, $fecha, $nombre_categoria, $descripcion) {
        try {
            $this->db->beginTransaction();
            
            // 1. Obtener o crear la categoría (Igual que en el registro)
            $queryCat = "SELECT id_categoria FROM categorias WHERE nombre = :nombre AND tipo = :tipo AND (id_usuario = :id_usuario OR id_usuario IS NULL) LIMIT 1";
            $stmtCat = $this->db->prepare($queryCat);
            $stmtCat->bindParam(":nombre", $nombre_categoria, PDO::PARAM_STR);
            $stmtCat->bindParam(":tipo", $tipo_movimiento, PDO::PARAM_STR);
            $stmtCat->bindParam(":id_usuario", $id_usuario, PDO::PARAM_INT);
            $stmtCat->execute();
            
            $categoria = $stmtCat->fetch();
            if ($categoria) {
                $id_categoria = $categoria['id_categoria'];
            } else {
                $queryInsertCat = "INSERT INTO categorias (id_usuario, nombre, tipo) VALUES (:id_usuario, :nombre, :tipo)";
                $stmtInsertCat = $this->db->prepare($queryInsertCat);
                $stmtInsertCat->bindParam(":id_usuario", $id_usuario, PDO::PARAM_INT);
                $stmtInsertCat->bindParam(":nombre", $nombre_categoria, PDO::PARAM_STR);
                $stmtInsertCat->bindParam(":tipo", $tipo_movimiento, PDO::PARAM_STR);
                $stmtInsertCat->execute();
                $id_categoria = $this->db->lastInsertId();
            }

            // 2. Actualizar el movimiento específico
            $queryTrans = "UPDATE transacciones SET id_categoria = :id_categoria, monto = :monto, fecha = :fecha, descripcion = :descripcion WHERE id_transaccion = :id_transaccion AND id_usuario = :id_usuario";
            $stmtTrans = $this->db->prepare($queryTrans);
            $stmtTrans->bindParam(":id_categoria", $id_categoria, PDO::PARAM_INT);
            $stmtTrans->bindParam(":monto", $monto, PDO::PARAM_STR);
            $stmtTrans->bindParam(":fecha", $fecha, PDO::PARAM_STR);
            $stmtTrans->bindParam(":descripcion", $descripcion, PDO::PARAM_STR);
            $stmtTrans->bindParam(":id_transaccion", $id_transaccion, PDO::PARAM_INT);
            $stmtTrans->bindParam(":id_usuario", $id_usuario, PDO::PARAM_INT);
            $stmtTrans->execute();
            
            $this->db->commit();
            return true;
        } catch (PDOException $e) {
            $this->db->rollBack();
            return false;
        }
    }

    // Método para Eliminar
    public function eliminarTransaccion($id_transaccion, $id_usuario) {
        $sql = "DELETE FROM transacciones WHERE id_transaccion = :id_transaccion AND id_usuario = :id_usuario";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(":id_transaccion", $id_transaccion, PDO::PARAM_INT);
        $stmt->bindParam(":id_usuario", $id_usuario, PDO::PARAM_INT);
        return $stmt->execute();
    }

}
?>