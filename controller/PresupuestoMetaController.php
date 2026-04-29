<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once 'model/Meta.php';
require_once 'model/Presupuesto.php';

class PresupuestoMetaController {
    
    // --- METAS ---
    public function obtenerMetasJson() {
        if (!isset($_SESSION['usuario'])) {
            echo json_encode(['exito' => false, 'mensaje' => 'No autenticado']);
            return;
        }

        $metaModel = new Meta();
        $metas = $metaModel->obtenerMetasPorUsuario($_SESSION['id_usuario']);
        echo json_encode(['exito' => true, 'datos' => $metas]);
    }

    public function guardarMeta() {
        if (!isset($_SESSION['usuario'])) {
            echo json_encode(['exito' => false, 'mensaje' => 'No autenticado']);
            return;
        }

        $id_icono = $_POST['id_icono'] ?? null;
        $nombre = $_POST['nombre'] ?? '';
        
        $monto_objetivo_raw = $_POST['monto_objetivo'] ?? '0';
        $monto_objetivo = floatval(preg_replace('/[^0-9.]/', '', $monto_objetivo_raw));
        
        $fecha_limite = $_POST['fecha_limite'] ?? '';

        if(empty($nombre) || empty($monto_objetivo) || empty($fecha_limite)) {
            echo json_encode(['exito' => false, 'mensaje' => 'Faltan datos obligatorios']);
            return;
        }

        $id_meta = !empty($_POST['id_meta']) ? $_POST['id_meta'] : null;

        $metaModel = new Meta();
        if ($id_meta) {
            $exito = $metaModel->editarMeta($id_meta, $_SESSION['id_usuario'], $id_icono, $nombre, $monto_objetivo, $fecha_limite);
            $mensajeExito = 'Meta actualizada con éxito';
            $mensajeError = 'Error al actualizar la meta';
        } else {
            $exito = $metaModel->guardarMeta($_SESSION['id_usuario'], $id_icono, $nombre, $monto_objetivo, $fecha_limite);
            $mensajeExito = 'Meta guardada con éxito';
            $mensajeError = 'Error al guardar la meta';
        }
        
        if ($exito) {
            echo json_encode(['exito' => true, 'mensaje' => $mensajeExito]);
        } else {
            echo json_encode(['exito' => false, 'mensaje' => $mensajeError]);
        }
    }

    public function eliminarMeta() {
        if (!isset($_SESSION['usuario'])) {
            echo json_encode(['exito' => false, 'mensaje' => 'No autenticado']);
            return;
        }

        $id_meta = $_POST['id_meta'] ?? null;
        if (!$id_meta) {
            echo json_encode(['exito' => false, 'mensaje' => 'ID de meta no proporcionado']);
            return;
        }

        $metaModel = new Meta();
        $exito = $metaModel->eliminarMeta($id_meta, $_SESSION['id_usuario']);

        echo json_encode(['exito' => $exito, 'mensaje' => $exito ? 'Meta eliminada' : 'Error al eliminar']);
    }

        // --- PRESUPUESTOS ---
    private function obtenerOCrearCategoria($nombre, $id_usuario) {
        $conexion = new Conexion();
        $db = $conexion->getConexion();
        
        $queryCat = "SELECT id_categoria FROM categorias WHERE nombre = :nombre AND tipo = 'gasto' AND (id_usuario = :id_usuario OR id_usuario IS NULL) LIMIT 1";
        $stmtCat = $db->prepare($queryCat);
        $stmtCat->execute([':nombre' => $nombre, ':id_usuario' => $id_usuario]);
        
        $categoria = $stmtCat->fetch();
        if ($categoria) {
            return $categoria['id_categoria'];
        } else {
            $queryInsertCat = "INSERT INTO categorias (id_usuario, nombre, tipo) VALUES (:id_usuario, :nombre, 'gasto')";
            $stmtInsertCat = $db->prepare($queryInsertCat);
            $stmtInsertCat->execute([':id_usuario' => $id_usuario, ':nombre' => $nombre]);
            return $db->lastInsertId();
        }
    }

    public function obtenerPresupuestosJson() {
        if (!isset($_SESSION['usuario'])) {
            echo json_encode(['exito' => false, 'mensaje' => 'No autenticado']);
            return;
        }

        $id_usuario = $_SESSION['id_usuario'];
        $mes_actual = date('n');
        $anio_actual = date('Y');

        $presupuestoModel = new Presupuesto();
        $presupuestos = $presupuestoModel->obtenerPresupuestosPorUsuario($id_usuario, $mes_actual, $anio_actual);

        echo json_encode(['exito' => true, 'datos' => $presupuestos]);
    }

    public function guardarPresupuesto() {
        if (!isset($_SESSION['usuario'])) {
            echo json_encode(['exito' => false, 'mensaje' => 'No autenticado']);
            return;
        }

        $id_icono = !empty($_POST['id_icono']) ? $_POST['id_icono'] : null;
        $nombre = $_POST['nombre'] ?? '';
        
        $monto_limite_raw = $_POST['monto_limite'] ?? '0';
        $monto_limite = floatval(preg_replace('/[^0-9.]/', '', $monto_limite_raw));
        
        $alerta_80_porciento = isset($_POST['alerta_80_porciento']) ? 1 : 0;

        if(empty($nombre) || empty($monto_limite)) {
            echo json_encode(['exito' => false, 'mensaje' => 'Faltan datos obligatorios']);
            return;
        }

        // Obtener o crear la categoría de gasto real
        $id_categoria = $this->obtenerOCrearCategoria($nombre, $_SESSION['id_usuario']);

        $id_presupuesto = !empty($_POST['id_presupuesto']) ? $_POST['id_presupuesto'] : null;

        $presupuestoModel = new Presupuesto();
        if ($id_presupuesto) {
            $exito = $presupuestoModel->editarPresupuesto($id_presupuesto, $_SESSION['id_usuario'], $id_categoria, $id_icono, $nombre, $monto_limite, $alerta_80_porciento);
            $mensajeExito = 'Presupuesto actualizado con éxito';
            $mensajeError = 'Error al actualizar el presupuesto';
        } else {
            $exito = $presupuestoModel->guardarPresupuesto($_SESSION['id_usuario'], $id_categoria, $id_icono, $nombre, $monto_limite, $alerta_80_porciento);
            $mensajeExito = 'Presupuesto guardado con éxito';
            $mensajeError = 'Error al guardar el presupuesto';
        }

        if ($exito) {
            echo json_encode(['exito' => true, 'mensaje' => $mensajeExito]);
        } else {
            echo json_encode(['exito' => false, 'mensaje' => $mensajeError]);
        }
    }

    public function eliminarPresupuesto() {
        if (!isset($_SESSION['usuario'])) {
            echo json_encode(['exito' => false, 'mensaje' => 'No autenticado']);
            return;
        }

        $id_presupuesto = $_POST['id_presupuesto'] ?? null;
        if (!$id_presupuesto) {
            echo json_encode(['exito' => false, 'mensaje' => 'ID de presupuesto no proporcionado']);
            return;
        }

        $presupuestoModel = new Presupuesto();
        $exito = $presupuestoModel->eliminarPresupuesto($id_presupuesto, $_SESSION['id_usuario']);

        echo json_encode(['exito' => $exito, 'mensaje' => $exito ? 'Presupuesto eliminado' : 'Error al eliminar']);
    }
}
?>
