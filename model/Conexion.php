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
            die("Error: Archivo de certificado no encontrado en: $ca");
        }
        
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
        
        if (!$connected) {
            die("Error de conexión a la base de datos: " . mysqli_connect_error());
        }
        
        // Establecer codificación UTF-8
        $this->conexion->set_charset("utf8mb4");
        
        return $this->conexion;
    }
}
?>