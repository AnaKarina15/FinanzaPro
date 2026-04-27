<?php
class Conexion {
    private $conexion;

    public function getConexion() {
        // Consumimos el array de configuración
        $config = require __DIR__ . '/../config/config.php';
        
        $host = $config['host'];
        $db = $config['base_de_datos'];
        $user = $config['usuario'];
        $pass = $config['contrasena'];
        $charset = 'utf8mb4';

        $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
        
        // Opciones de PDO para seguridad y manejo de errores
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $this->conexion = new PDO($dsn, $user, $pass, $options);
            return $this->conexion;
        } catch (\PDOException $e) {
            // En producción, el error debe registrarse en un log, no mostrarse al usuario.
            die("Error de conexión a MySQL: " . $e->getMessage());
        }
    }
}
?>