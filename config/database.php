<?php

define('DB_HOST', 'finanzapro-db-finanzaprodb.a.aivencloud.com');
define('DB_PORT', '27260');
define('DB_NAME', 'defaultdb');
define('DB_USER', 'avnadmin');
define('DB_PASS', 'AQUI_VA_LA_PASS');

// Descarga el Certificado CA de Aiven y guárdalo en la carpeta config como ca.pem
define('DB_SSL_CA', __DIR__ . '/ca.pem');
?>