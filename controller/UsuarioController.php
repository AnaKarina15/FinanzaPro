<?php
require_once __DIR__ . '/../model/Usuario.php';
require_once __DIR__ . '/../model/Conexion.php';

class UsuarioController {
    private $modeloUsuario;

    public function __construct() {
        $this->modeloUsuario = new Usuario();
    }

    public function mostrarLogin() {
        require __DIR__ . '/../views/login.php';
    }

    public function iniciarSesion($correo, $contrasena, $esRegistroNuevo = false) {
        $usuario = $this->modeloUsuario->obtenerPorCorreo($correo);

        // Verificamos que el usuario exista y la contraseña coincida
        if ($usuario && $this->modeloUsuario->verificarCredenciales($correo, $contrasena)) {
            if (session_status() == PHP_SESSION_NONE) session_start();

            $_SESSION['usuario'] = $correo;
            $_SESSION['id_usuario'] = $usuario['id_usuario'];
            $_SESSION['nombre_usuario'] = $usuario['nombre'];
            $_SESSION['apellido_usuario'] = $usuario['apellido'];
            $_SESSION['rol'] = $usuario['nombre_rol'] ?? 'Usuario';
            $_SESSION['id_rol'] = $usuario['id_rol'] ?? 2;
            $_SESSION['foto_perfil'] = $usuario['foto_perfil'] ?? null;

            // Si es admin, redirigir al panel de administración
            if ($usuario['id_rol'] == 1) {
                $urlDestino = 'http://localhost/FinanzaPro/views/admin.php';
            } else {
                $urlDestino = 'http://localhost/FinanzaPro/views/dashboard.php';
            }

            if ($esRegistroNuevo) {
                // Si viene de registrarse, agregamos el parámetro
                header("Location: " . $urlDestino . "?registro=exito");
            } else {
                // Si es un inicio de sesión normal
                header("Location: " . $urlDestino);
            }
            exit();
        } else {
            header('Location: http://localhost/FinanzaPro/index.php?login=error');
            exit();
        }
    }

    //Te manda de vuelta al index, pero con la bandera "verificar=true"
    public function registrarUsuario($nombre, $apellido, $correo, $codigo_pais, $telefono_num, $contrasena) {
        $telefono = $codigo_pais . $telefono_num;

        if ($this->modeloUsuario->registrar($nombre, $apellido, $correo, $telefono, $contrasena)) {
            $usuario = $this->modeloUsuario->obtenerPorCorreo($correo);

            require_once 'model/PinSeguridad.php';
            $pinModelo = new PinSeguridad();
            $codigo_pin = sprintf("%06d", mt_rand(1, 999999));
            $pinModelo->crearPin($usuario['id_usuario'], $codigo_pin, 'registro');

            if (session_status() == PHP_SESSION_NONE) session_start();
            $_SESSION['pin_desarrollo'] = $codigo_pin;

            // Redirigimos al index activando la vista del PIN
            header("Location: /FinanzaPro/index.php?verificar=true&correo=" . urlencode($correo));
            exit();
        } else {
            header("Location: /FinanzaPro/index.php?registro=error");
            exit();
        }
    }

    //  Valida, actualiza a 1 e inicia sesión
    public function activarCuenta() {
        header('Content-Type: application/json; charset=utf-8');
        $datos = json_decode(file_get_contents('php://input'), true);
        $correo = $datos['correo'] ?? '';
        $pin = $datos['pin'] ?? '';

        $usuario = $this->modeloUsuario->obtenerPorCorreo($correo);

        if ($usuario) {
            require_once __DIR__ . '/../model/PinSeguridad.php';
            $pinModelo = new PinSeguridad();

            if ($pinModelo->verificarPin($usuario['id_usuario'], $pin, 'registro')) {

                $conexion = (new Conexion())->getConexion();

                //  Preparamos la sentencia
                $stmt = $conexion->prepare('UPDATE usuarios SET cuenta_verificada = 1 WHERE id_usuario = :id');
                $stmt->bindParam(':id', $usuario['id_usuario'], PDO::PARAM_INT);

                //  Verificamos si la ejecución fue exitosa
                if ($stmt->execute()) {

                    //Verificamos si se afectó alguna fila (si realmente cambió de 0 a 1)
                    if ($stmt->rowCount() > 0) {

                        // Iniciamos sesión (Solo una vez)
                        if (session_status() == PHP_SESSION_NONE) session_start();

                        $_SESSION['usuario'] = $correo;
                        $_SESSION['id_usuario'] = $usuario['id_usuario'];
                        $_SESSION['nombre_usuario'] = $usuario['nombre'];
                        $_SESSION['apellido_usuario'] = $usuario['apellido'];
                        $_SESSION['rol'] = $usuario['nombre_rol'];
                        $_SESSION['id_rol'] = $usuario['id_rol'] ?? 2;
                        $_SESSION['foto_perfil'] = $usuario['foto_perfil'] ?? null;

                        echo json_encode(["status" => "success", "mensaje" => "Cuenta activada. Entrando al sistema..."]);
                        exit();
                    } else {
                        echo json_encode(["status" => "error", "mensaje" => "La cuenta ya estaba activa o no se encontró el registro."]);
                        exit();
                    }
                } else {
                    // Si llegamos aquí, hay un error de sintaxis SQL o de conexión
                    $error = $stmt->errorInfo();
                    echo json_encode(["status" => "error", "mensaje" => "Error de base de datos: " . $error[2]]);
                    exit();
                }
            }
        }
        echo json_encode(["status" => "error", "mensaje" => "El código es incorrecto o ha expirado."]);
        exit();
    }

    public function obtenerDatosPerfil($id_usuario) {
        return $this->modeloUsuario->obtenerPorId($id_usuario);
    }

    public function actualizarPerfil() {
        if (session_status() == PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['id_usuario'])) {
            header("Location: index.php");
            exit();
        }

        $id_usuario = $_SESSION['id_usuario'];

        // Recolectar datos
        $nombre = trim($_POST['nombre'] ?? '');
        $apellido = trim($_POST['apellido'] ?? '');
        $telefono = trim($_POST['telefono'] ?? '');
        $moneda = $_POST['moneda_principal'] ?? 'COP';
        $tema = $_POST['tema_interfaz'] ?? 'claro';
        $push = isset($_POST['notificaciones_push']) ? 1 : 0;

        // Usamos $this->modeloUsuario en lugar de crear uno nuevo
        $exito = $this->modeloUsuario->actualizarPerfil($id_usuario, $nombre, $apellido, $telefono, $moneda, $tema, $push);
        $mensaje = "Perfil actualizado correctamente.";

        // Lógica de contraseña
        if (!empty($_POST['contrasena_actual'])) {
            $nueva = $_POST['contrasena_nueva'];

            if (strlen($nueva) < 8) {
                $exito = false;
                $mensaje = "La nueva contraseña debe tener al menos 8 caracteres.";
            } elseif ($nueva !== $_POST['confirmar_contrasena']) {
                $exito = false;
                $mensaje = "Las contraseñas nuevas no coinciden.";
            } elseif (!$this->modeloUsuario->cambiarContrasena($id_usuario, $_POST['contrasena_actual'], $nueva)) {
                $exito = false;
                $mensaje = "Error al cambiar la contraseña. Verifica tu contraseña actual.";
            } else {
                $mensaje = "Perfil y contraseña actualizados de forma segura.";
            }
        }

        if ($exito) {
            $_SESSION['nombre_usuario'] = $nombre;
            $_SESSION['apellido_usuario'] = $apellido;
            header("Location: views/perfil.php?status=success&msg=" . urlencode($mensaje));
        } else {
            header("Location: views/perfil.php?status=error&msg=" . urlencode($mensaje));
        }
        exit();
    }

    public function cambiarCorreo() {
        if (session_status() == PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['id_usuario'])) {
            header("Location: index.php");
            exit();
        }

        $id_usuario = $_SESSION['id_usuario'];
        $nuevo_correo = trim($_POST['nuevo_correo'] ?? '');
        $contrasena_actual = $_POST['contrasena_correo'] ?? '';

        if (empty($nuevo_correo) || empty($contrasena_actual)) {
            header("Location: views/perfil.php?status=error&msg=" . urlencode("Debes completar el nuevo correo y la contraseña."));
            exit();
        }

        if (!filter_var($nuevo_correo, FILTER_VALIDATE_EMAIL)) {
            header("Location: views/perfil.php?status=error&msg=" . urlencode("El correo no tiene un formato válido."));
            exit();
        }

        $usuario = $this->modeloUsuario->obtenerPorId($id_usuario);
        if (!$usuario || !$this->modeloUsuario->verificarCredenciales($usuario['correo'], $contrasena_actual)) {
            header("Location: views/perfil.php?status=error&msg=" . urlencode("Contraseña incorrecta. No se pudo cambiar el correo."));
            exit();
        }

        if ($nuevo_correo === $usuario['correo']) {
            header("Location: views/perfil.php?status=error&msg=" . urlencode("El nuevo correo debe ser diferente al actual."));
            exit();
        }

        if ($this->modeloUsuario->existeCorreo($nuevo_correo)) {
            header("Location: views/perfil.php?status=error&msg=" . urlencode("El correo ya está en uso por otra cuenta."));
            exit();
        }

        if ($this->modeloUsuario->cambiarCorreo($id_usuario, $nuevo_correo)) {
            $_SESSION['usuario'] = $nuevo_correo;
            header("Location: views/perfil.php?status=success&msg=" . urlencode("Correo actualizado correctamente."));
        } else {
            header("Location: views/perfil.php?status=error&msg=" . urlencode("No se pudo actualizar el correo. Intenta de nuevo."));
        }
        exit();
    }

    public function cambiarFotoPerfil() {
        header('Content-Type: application/json; charset=utf-8');

        if (session_status() == PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['id_usuario'])) {
            echo json_encode(['status' => 'error', 'mensaje' => 'Sesión no iniciada.']);
            exit();
        }

        if (!isset($_FILES['foto_perfil']) || $_FILES['foto_perfil']['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(['status' => 'error', 'mensaje' => 'No se recibió ningún archivo o hubo un error en la subida.']);
            exit();
        }

        $archivo = $_FILES['foto_perfil'];
        $tiposPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

        // Validar tipo MIME real con finfo (más seguro que solo confiar en el cliente)
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $tipoReal = $finfo->file($archivo['tmp_name']);

        if (!in_array($tipoReal, $tiposPermitidos)) {
            echo json_encode(['status' => 'error', 'mensaje' => 'Formato de imagen no válido. Solo PNG, JPG y WEBP.']);
            exit();
        }

        // Validar tamaño (máximo 2MB)
        if ($archivo['size'] > 2 * 1024 * 1024) {
            echo json_encode(['status' => 'error', 'mensaje' => 'La imagen no puede superar los 2MB.']);
            exit();
        }

        // Generar nombre único y determinar extensión
        $extensiones = ['image/png' => 'png', 'image/jpeg' => 'jpg', 'image/jpg' => 'jpg', 'image/webp' => 'webp'];
        $extension = $extensiones[$tipoReal];
        $nombreArchivo = 'user_' . $_SESSION['id_usuario'] . '_' . time() . '.' . $extension;
        $carpetaDestino = __DIR__ . '/../uploads/fotos_perfil/';
        $rutaCompleta = $carpetaDestino . $nombreArchivo;
        $rutaRelativa = 'uploads/fotos_perfil/' . $nombreArchivo;

        // Crear carpeta si no existe
        if (!is_dir($carpetaDestino)) {
            mkdir($carpetaDestino, 0755, true);
        }

        // Eliminar foto anterior si existe y no es la de ui-avatars
        $fotoAnterior = $_SESSION['foto_perfil'] ?? null;
        if ($fotoAnterior && file_exists(__DIR__ . '/../' . $fotoAnterior)) {
            @unlink(__DIR__ . '/../' . $fotoAnterior);
        }

        // Mover el archivo subido
        if (!move_uploaded_file($archivo['tmp_name'], $rutaCompleta)) {
            echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo guardar la imagen en el servidor.']);
            exit();
        }

        // Guardar la ruta en la base de datos
        if ($this->modeloUsuario->actualizarFotoPerfil($_SESSION['id_usuario'], $rutaRelativa)) {
            $_SESSION['foto_perfil'] = $rutaRelativa;
            echo json_encode([
                'status' => 'success',
                'mensaje' => 'Foto de perfil actualizada correctamente.',
                'ruta_foto' => $rutaRelativa
            ]);
        } else {
            echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo actualizar la foto en la base de datos.']);
        }
        exit();
    }

    public function cerrarSesion() {
        if (session_status() == PHP_SESSION_NONE) session_start();

        // Limpiamos todos los datos de sesión y destruimos la sesión activa
        $_SESSION = [];

        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"]
            );
        }

        session_destroy();
        header("Location: " . BASE_URL . "/index.php?logout=success");
        exit();
    }

    public function solicitarRecuperacion() {
        // Leemos el JSON enviado por Fetch API
        $datos = json_decode(file_get_contents('php://input'), true);
        $correo = $datos['correo'] ?? '';

        $usuario = $this->modeloUsuario->obtenerPorCorreo($correo);

        if ($usuario) {
            require_once 'model/PinSeguridad.php';
            $pinModelo = new PinSeguridad();

            // Generamos un PIN aleatorio de 6 dígitos
            $codigo_pin = sprintf("%06d", mt_rand(1, 999999));
            $pinModelo->crearPin($usuario['id_usuario'], $codigo_pin, 'recuperacion');

            // AQUÍ: En producción, usarías la función mail() de PHP o PHPMailer para enviar el $codigo_pin al correo.
            // Por ahora, para que puedan desarrollar en XAMPP sin configurar un servidor SMTP, 
            // devolveremos el PIN en el JSON (¡Solo para desarrollo!).

            echo json_encode([
                "status" => "success",
                "mensaje" => "Se ha enviado un PIN a tu correo.",
                "pin_desarrollo" => $codigo_pin // TODO: Borrar esto en producción
            ]);
        } else {
            // Por seguridad, siempre decimos que se envió el correo, aunque no exista,
            // para evitar que hackers adivinen qué correos están registrados.
            echo json_encode(["status" => "success", "mensaje" => "Si el correo existe, recibirás un PIN."]);
        }
        exit();
    }

    public function restablecerContrasena() {
        $datos = json_decode(file_get_contents('php://input'), true);
        $correo = $datos['correo'] ?? '';
        $pin = $datos['pin'] ?? '';
        $nueva_contrasena = $datos['nueva_contrasena'] ?? '';

        if (strlen($nueva_contrasena) < 8) {
            echo json_encode(["status" => "error", "mensaje" => "La contraseña debe tener al menos 8 caracteres."]);
            exit();
        }

        $usuario = $this->modeloUsuario->obtenerPorCorreo($correo);
        if ($usuario) {
            require_once 'model/PinSeguridad.php';
            $pinModelo = new PinSeguridad();

            if ($pinModelo->verificarPin($usuario['id_usuario'], $pin, 'recuperacion')) {
                // Si el PIN es correcto, forzamos el cambio de contraseña
                $contrasena_hashed = password_hash($nueva_contrasena, PASSWORD_DEFAULT);

                // Actualizamos directamente en la BD (Usamos un bloque de código rápido aquí)
                $conexion = (new Conexion())->getConexion();
                $stmt = $conexion->prepare('UPDATE usuarios SET contrasena = :pass WHERE id_usuario = :id');
                $stmt->bindParam(':pass', $contrasena_hashed, PDO::PARAM_STR);
                $stmt->bindParam(':id', $usuario['id_usuario'], PDO::PARAM_INT);
                $stmt->execute();

                echo json_encode(["status" => "success", "mensaje" => "Contraseña restablecida con éxito."]);
                exit();
            }
        }

        echo json_encode(["status" => "error", "mensaje" => "El PIN es incorrecto o ha expirado."]);
        exit();
    }

    // ===== MÉTODOS DE ADMINISTRACIÓN =====

    private function verificarAdmin() {
        if (session_status() == PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['id_usuario']) || ($_SESSION['id_rol'] ?? 0) != 1) {
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['status' => 'error', 'mensaje' => 'Acceso denegado.']);
            exit();
        }
    }

    public function listarUsuariosAdmin() {
        $this->verificarAdmin();
        header('Content-Type: application/json; charset=utf-8');

        $pagina = isset($_GET['pagina']) ? (int) $_GET['pagina'] : 1;
        $porPagina = isset($_GET['porPagina']) ? (int) $_GET['porPagina'] : 10;
        $busqueda = $_GET['busqueda'] ?? '';

        $resultado = $this->modeloUsuario->listarUsuarios($pagina, $porPagina, $busqueda);
        $resultado['status'] = 'success';
        echo json_encode($resultado);
        exit();
    }

    public function obtenerUsuarioAdmin() {
        $this->verificarAdmin();
        header('Content-Type: application/json; charset=utf-8');

        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        $usuario = $this->modeloUsuario->obtenerPorId($id);

        if ($usuario) {
            echo json_encode(['status' => 'success', 'usuario' => $usuario]);
        } else {
            echo json_encode(['status' => 'error', 'mensaje' => 'Usuario no encontrado.']);
        }
        exit();
    }

    public function crearUsuarioAdmin() {
        $this->verificarAdmin();
        header('Content-Type: application/json; charset=utf-8');

        $datos = json_decode(file_get_contents('php://input'), true);
        $nombre = trim($datos['nombre'] ?? '');
        $apellido = trim($datos['apellido'] ?? '');
        $correo = trim($datos['correo'] ?? '');
        $telefono = trim($datos['telefono'] ?? '');
        $contrasena = $datos['contrasena'] ?? '';
        $id_rol = (int) ($datos['id_rol'] ?? 2);

        if (empty($nombre) || empty($apellido) || empty($correo) || empty($contrasena)) {
            echo json_encode(['status' => 'error', 'mensaje' => 'Nombre, apellido, correo y contraseña son obligatorios.']);
            exit();
        }

        if (strlen($contrasena) < 8) {
            echo json_encode(['status' => 'error', 'mensaje' => 'La contraseña debe tener al menos 8 caracteres.']);
            exit();
        }

        if ($this->modeloUsuario->existeCorreo($correo)) {
            echo json_encode(['status' => 'error', 'mensaje' => 'El correo ya está registrado.']);
            exit();
        }

        if ($this->modeloUsuario->crearUsuarioAdmin($nombre, $apellido, $correo, $telefono, $contrasena, $id_rol)) {
            echo json_encode(['status' => 'success', 'mensaje' => 'Usuario creado correctamente.']);
        } else {
            echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo crear el usuario.']);
        }
        exit();
    }

    public function actualizarUsuarioAdmin() {
        $this->verificarAdmin();
        header('Content-Type: application/json; charset=utf-8');

        $datos = json_decode(file_get_contents('php://input'), true);
        $id_usuario = (int) ($datos['id_usuario'] ?? 0);
        $nombre = trim($datos['nombre'] ?? '');
        $apellido = trim($datos['apellido'] ?? '');
        $correo = trim($datos['correo'] ?? '');
        $telefono = trim($datos['telefono'] ?? '');
        $id_rol = (int) ($datos['id_rol'] ?? 2);

        if (empty($nombre) || empty($apellido) || empty($correo) || $id_usuario === 0) {
            echo json_encode(['status' => 'error', 'mensaje' => 'Datos incompletos.']);
            exit();
        }

        if ($this->modeloUsuario->actualizarUsuarioAdmin($id_usuario, $nombre, $apellido, $correo, $telefono, $id_rol)) {
            echo json_encode(['status' => 'success', 'mensaje' => 'Usuario actualizado correctamente.']);
        } else {
            echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo actualizar el usuario.']);
        }
        exit();
    }

    public function eliminarUsuarioAdmin() {
        $this->verificarAdmin();
        header('Content-Type: application/json; charset=utf-8');

        $datos = json_decode(file_get_contents('php://input'), true);
        $id_usuario = (int) ($datos['id_usuario'] ?? 0);

        if ($id_usuario === 0) {
            echo json_encode(['status' => 'error', 'mensaje' => 'ID de usuario inválido.']);
            exit();
        }

        // No permitir auto-eliminación
        if ($id_usuario === (int) $_SESSION['id_usuario']) {
            echo json_encode(['status' => 'error', 'mensaje' => 'No puedes eliminarte a ti mismo.']);
            exit();
        }

        if ($this->modeloUsuario->eliminarUsuario($id_usuario)) {
            echo json_encode(['status' => 'success', 'mensaje' => 'Usuario eliminado correctamente.']);
        } else {
            echo json_encode(['status' => 'error', 'mensaje' => 'No se pudo eliminar el usuario.']);
        }
        exit();
    }

    public function estadisticasAdmin() {
        $this->verificarAdmin();
        header('Content-Type: application/json; charset=utf-8');

        $stats = $this->modeloUsuario->estadisticasAdmin();
        $stats['status'] = 'success';
        echo json_encode($stats);
        exit();
    }
}
