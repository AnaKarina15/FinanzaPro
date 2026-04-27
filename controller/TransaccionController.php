<?php
require_once __DIR__ . '/../model/Transaccion.php';

class TransaccionController {
    private $modeloTransaccion;

    public function __construct() {
        $this->modeloTransaccion = new Transaccion();
    }

    public function guardarMovimiento($tipo_movimiento, $monto, $fecha, $categoria, $descripcion) {
        if (session_status() == PHP_SESSION_NONE) session_start();
        
        if (!isset($_SESSION['id_usuario'])) {
            header('Location: index.php');
            exit();
        }

        $id_usuario = $_SESSION['id_usuario'];

        if ($this->modeloTransaccion->registrarTransaccion($id_usuario, $tipo_movimiento, $monto, $fecha, $categoria, $descripcion)) {
            header("Location: views/ingresosGastos.php?guardado=exito");
            exit();
        } else {
            header("Location: views/ingresosGastos.php?guardado=error");
            exit();
        }
    }

    public function obtenerEstadisticasJson() {
        if (session_status() == PHP_SESSION_NONE) session_start();
        
        if (!isset($_SESSION['id_usuario'])) {
            header('Content-Type: application/json');
            echo json_encode(['error' => 'No autorizado']);
            exit();
        }

        $id_usuario = $_SESSION['id_usuario'];

        $totales = $this->modeloTransaccion->obtenerTotales($id_usuario);
        $categoriasGastos = $this->modeloTransaccion->obtenerGastosPorCategoria($id_usuario);
        $categoriasIngresos = $this->modeloTransaccion->obtenerIngresosPorCategoria($id_usuario);
        $movimientos = $this->modeloTransaccion->obtenerMovimientos($id_usuario, 15); // Traemos los últimos 15
        $mensual = $this->modeloTransaccion->obtenerIngresosGastosPorMes($id_usuario);

        header('Content-Type: application/json');
        echo json_encode([
            'totales' => $totales,
            'categoriasGastos' => $categoriasGastos,
            'categoriasIngresos' => $categoriasIngresos,
            'movimientos' => $movimientos,
            'mensual' => $mensual
        ]);
        exit();
    }

    public function obtenerIngresosPorCategoria($id_usuario) {
        $query = "SELECT c.nombre, SUM(t.monto) as total
                FROM transacciones t
                JOIN categorias c ON t.id_categoria = c.id_categoria
                WHERE t.id_usuario = :id_usuario AND c.tipo = 'ingreso'
                GROUP BY c.id_categoria";

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
}
?>