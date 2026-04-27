<?php
require_once __DIR__ . '/Conexion.php';

class PinSeguridad {
    private $conexion;

    public function __construct() {
        $this->conexion = (new Conexion())->getConexion();
    }

    public function crearPin($id_usuario, $codigo_pin, $tipo_operacion) {
        // El PIN expira en 15 minutos exactos
        $fecha_expiracion = date('Y-m-d H:i:s', strtotime('+15 minutes'));
        
        $query = "INSERT INTO pines_seguridad (id_usuario, codigo_pin, fecha_expiracion, fue_usado, tipo_operacion) 
                  VALUES (:id_usuario, :codigo_pin, :fecha_expiracion, 0, :tipo_operacion)";
                  
        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':id_usuario', $id_usuario, PDO::PARAM_INT);
        $stmt->bindParam(':codigo_pin', $codigo_pin, PDO::PARAM_STR);
        $stmt->bindParam(':fecha_expiracion', $fecha_expiracion, PDO::PARAM_STR);
        $stmt->bindParam(':tipo_operacion', $tipo_operacion, PDO::PARAM_STR);
        
        return $stmt->execute();
    }

    public function verificarPin($id_usuario, $codigo_pin, $tipo_operacion) {
        $query = "SELECT id_pin FROM pines_seguridad
                WHERE id_usuario = :id_usuari
                AND codigo_pin = :codigo_pin
                AND tipo_operacion = :tipo_operacion
                AND fue_usado = 0
                AND fecha_expiracion > NOW()
                LIMIT 1";

        $stmt = $this->conexion->prepare($query);
        $stmt->bindParam(':id_usuario', $id_usuario, PDO::PARAM_INT);
        $stmt->bindParam(':codigo_pin', $codigo_pin, PDO::PARAM_STR);
        $stmt->bindParam(':tipo_operacion', $tipo_operacion, PDO::PARAM_STR);
        $stmt->execute();
        
        $pin = $stmt->fetch();

        if ($pin) {
            // Si el PIN es válido y no ha expirado, lo "quemamos" (marcamos como usado) por seguridad
            $update = "UPDATE pines_seguridad SET fue_usado = 1 WHERE id_pin = :id_pin";
            $stmt_upd = $this->conexion->prepare($update);
            $stmt_upd->bindParam(':id_pin', $pin['id_pin'], PDO::PARAM_INT);
            $stmt_upd->execute();
            return true;
        }
        return false;
    }
}
?>