<?php
class Conexion {
    private $conexion;

    public function getConexion() {
        // Cargar configuración desde el archivo config.php
        $config = require __DIR__ . '/../config/config.php';
        
        $this->conexion = mysqli_init();
        
        // Ruta del certificado SSL
        $ca = __DIR__ . "/../config/ca.pem";
        
        if (!file_exists($ca)) {
            // Para desarrollo: intentar conexión sin SSL si no hay certificado
            // En producción, esto debería fallar
            error_log("Advertencia: Certificado SSL no encontrado. Intentando conexión sin SSL (no recomendado para producción)");
            
            // Conectar sin SSL (solo para desarrollo)
            $connected = mysqli_real_connect(
                $this->conexion,
                $config['host'],
                $config['usuario'],
                $config['contrasena'],
                $config['base_de_datos'],
                $config['puerto'],
                NULL,
                0 // Sin flags SSL
            );
        } else {
            // Configurar SSL
            mysqli_ssl_set($this->conexion, NULL, NULL, $ca, NULL, NULL);
            
            // Conectar con SSL
            $connected = mysqli_real_connect(
                $this->conexion,
                $config['host'],
                $config['usuario'],
                $config['contrasena'],
                $config['base_de_datos'],
                $config['puerto'],
                NULL,
                MYSQLI_CLIENT_SSL
            );
        }
        
        if (!$connected) {
            die("Error de conexión a la base de datos: " . mysqli_connect_error());
        }
        
        // Establecer codificación UTF-8
        $this->conexion->set_charset("utf8mb4");
        
        return $this->conexion;
    }
}
?>