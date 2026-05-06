<?php
// FinanzaPro - SPA Firebase
// Este archivo solo redirige al login.
$base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
header('Location: ' . $base . '/views/login.php');
exit;
