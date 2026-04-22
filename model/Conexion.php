<?php

/** 
 * Clase Conexion
 * Gestiona la conexión única a la base de datos mediante el patrón Singleton  y PDO.
 */
class Conexion {
    /**
     * @var PDO|null Almacena la instancia única de la conexión.
     */

    private static $conexion = null;

    /**
     * Establece y retorna la conexión a la base de datos.
     * @return PDO Instancia de la conexión activa.
     */
    public static function conectar() {
        // Evita que un usuario tenga más de una conexión
        if (self::$conexion !== null) return self::$conexion;

        $config = require_once __DIR__ . "/../config/config.php";

        try {
            $dsn = "
                mysql:host=" . $config["host"] .
                ";dbname=" . $config["base_de_datos"] .
                ";charset=utf8mb4";

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_OBJ,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            self::$conexion = new PDO(
                $dsn,
                $config["usuario"],
                $config["contrasena"],
                $options
            );

            return self::$conexion;
        } catch (PDOException $errorConexion) {
            error_log("Error de conexión: " . $errorConexion->getMessage());
            die("Error interno de la base de datos. Por favor, contacte con el administrador del sistema.");
        }
    }

    /**
     * Método para prevenir la clonación de la instancia (Seguridad Singleton).
     */
    private function __clone() {
    }

    /** 
     * Método para prevenir la deserialización (Seguridad Singleton). 
     */
    public function __wakeup() {
        throw new Exception("No se puede deserializar una instancia de la conexión.");
    }
}
