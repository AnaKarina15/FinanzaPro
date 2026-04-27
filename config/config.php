<?php
// Cargar variables de entorno desde .env
if (file_exists(__DIR__ . '/../.env')) {
    $env = parse_ini_file(__DIR__ . '/../.env');
    return [
        'host' => $env['DB_HOST'] ?? 'localhost',
        'puerto' => $env['DB_PORT'] ?? 3306,
        'usuario' => $env['DB_USER'] ?? 'root',
        'contrasena' => $env['DB_PASS'] ?? '',
        'base_de_datos' => $env['DB_NAME'] ?? 'finanzapro'
    ];
} else {
    // Fallback para desarrollo local
    return [
        'host' => 'localhost',
        'puerto' => 3306,
        'usuario' => 'root',
        'contrasena' => '',
        'base_de_datos' => 'finanzapro'
    ];
}
?>
