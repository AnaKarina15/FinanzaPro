<?php
require_once __DIR__ . '/../model/Transaccion.php';

class TransaccionController {
    private $modeloTransaccion;

    public function __construct() {
        $this->modeloTransaccion = new Transaccion();
    }

    // --- 1. GUARDAR O ACTUALIZAR MOVIMIENTO ---
    public function guardarMovimiento() {
        if (session_status() == PHP_SESSION_NONE) session_start();
        
        if (!isset($_SESSION['id_usuario'])) {
            header('Location: index.php');
            exit();
        }

        $id_usuario = $_SESSION['id_usuario'];
        
        // Recibimos los datos del formulario (POST)
        $id_transaccion = $_POST['id_transaccion'] ?? '';
        $tipo_movimiento = $_POST['tipo_movimiento'] ?? '';
        $monto = str_replace(['.', ',', '$', ' '], '', $_POST['monto']); // Limpieza de seguridad
        $fecha = $_POST['fecha'] ?? '';
        $categoria = $_POST['categoria'] ?? '';
        $descripcion = $_POST['descripcion'] ?? '';

        // Averiguamos de qué página vino la petición
        $pagina_anterior = $_SERVER['HTTP_REFERER'] ?? 'views/dashboard.php';

        // Lógica de decisión: ¿Es nuevo o es una actualización?
        if (!empty($id_transaccion)) {
            $exito = $this->modeloTransaccion->actualizarTransaccion($id_transaccion, $id_usuario, $tipo_movimiento, $monto, $fecha, $categoria, $descripcion);
        } else {
            $exito = $this->modeloTransaccion->registrarTransaccion($id_usuario, $tipo_movimiento, $monto, $fecha, $categoria, $descripcion);
        }

        // Redirigimos al usuario exactamente a la página donde estaba
        if ($exito) {
            header("Location: " . $pagina_anterior);
        } else {
            // Si hay error, también lo devolvems pero podríamos agregar un parámetro ?error=1
            header("Location: " . $pagina_anterior);
        }
        exit();
    }

    // --- 2. ELIMINAR MOVIMIENTO
    public function eliminarMovimiento() {
        if (session_status() == PHP_SESSION_NONE) session_start();
        header('Content-Type: application/json');

        if (!isset($_SESSION['id_usuario'])) {
            echo json_encode(['exito' => false, 'error' => 'No autorizado']);
            exit();
        }

        // Leemos el JSON enviado por el Fetch de JavaScript
        $datos = json_decode(file_get_contents("php://input"), true);
        $id_transaccion = $datos['id_transaccion'] ?? null;

        if ($id_transaccion && $this->modeloTransaccion->eliminarTransaccion($id_transaccion, $_SESSION['id_usuario'])) {
            echo json_encode(['exito' => true]);
        } else {
            echo json_encode(['exito' => false, 'error' => 'No se pudo eliminar en la base de datos']);
        }
        exit();
    }

    // --- 3. OBTENER ESTADÍSTICAS JSON ---
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
        $movimientos = $this->modeloTransaccion->obtenerMovimientos($id_usuario, 15); 
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
}
?>