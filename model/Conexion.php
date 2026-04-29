<?php
// Requerimos las constantes de configuración
require_once __DIR__ . '/../config/database.php';

class Conexion {
    private $conexion;

    public function getConexion() {
        if ($this->conexion == null) {
            try {
                // Construimos el DSN con las constantes
                $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
                
                // Opciones base obligatorias de nuestra arquitectura
                $opciones = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::ATTR_PERSISTENT => true
                ];

                // Si hay un certificado SSL definido, lo inyectamos en PDO
                if (defined('DB_SSL_CA') && !empty(DB_SSL_CA)) {
                    $opciones[PDO::MYSQL_ATTR_SSL_CA] = DB_SSL_CA;
                    $opciones[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
                }

                $this->conexion = new PDO($dsn, DB_USER, DB_PASS, $opciones);
                
            } catch (PDOException $e) {
                error_log("Error de conexión a BD: " . $e->getMessage());
                die("Error crítico: No se pudo conectar a la base de datos.");
            }
        }
        return $this->conexion;
    }
}
?>