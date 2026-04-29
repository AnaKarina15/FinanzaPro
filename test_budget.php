<?php
session_start();
$_SESSION['usuario'] = 'test';
$_SESSION['id_usuario'] = 1;

$_POST['nombre'] = 'Ocio';
$_POST['monto_limite'] = '150000';
$_POST['id_icono'] = '1';
$_POST['alerta_80_porciento'] = 'on';

require_once 'controller/PresupuestoMetaController.php';
$controller = new PresupuestoMetaController();

ob_start();
$controller->guardarPresupuesto();
$output = ob_get_clean();

echo "RAW OUTPUT:\n";
echo $output;
?>
