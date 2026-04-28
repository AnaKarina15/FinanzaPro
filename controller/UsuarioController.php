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

            $urlDestino = 'http://localhost/FinanzaPro/views/dashboard.php';

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

    public function cambiarFotoPerfil() {
        header('Content-Type: application/json; charset=utf-8');

        // Validar que el usuario esté autenticado
        if (!isset($_SESSION['id_usuario'])) {
            echo json_encode(["status" => "error", "mensaje" => "Debes iniciar sesión para cambiar tu foto de perfil."]);
            exit();
        }

        $id_usuario = $_SESSION['id_usuario'];

        // Validar que se haya enviado un archivo
        if (!isset($_FILES['foto_perfil']) || $_FILES['foto_perfil']['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(["status" => "error", "mensaje" => "No se ha seleccionado ninguna imagen."]);
            exit();
        }

        $archivo = $_FILES['foto_perfil'];
        $nombre_original = $archivo['name'];
        $tipo_mime = $archivo['type'];
        $tamano = $archivo['size'];
        $tmp_name = $archivo['tmp_name'];

        // Validar tipo de imagen (solo png, jpg, jpeg, webp)
        $extensiones_permitidas = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!in_array($tipo_mime, $extensiones_permitidas)) {
            echo json_encode(["status" => "error", "mensaje" => "El formato de imagen no es válido. Solo se permiten archivos PNG, JPG y WEBP."]);
            exit();
        }

        // Validar tamaño máximo (2MB)
        $tamano_maximo = 2 * 1024 * 1024;
        if ($tamano > $tamano_maximo) {
            echo json_encode(["status" => "error", "mensaje" => "La imagen no puede superar los 2MB."]);
            exit();
        }

        // Obtener extensión del archivo
        $extension = pathinfo($nombre_original, PATHINFO_EXTENSION);
        
        // Generar nombre único para la imagen
        $nombre_archivo = 'perfil_' . $id_usuario . '_' . time() . '.' . $extension;
        
        // Ruta destino en views/pictures/
        $ruta_carpeta = __DIR__ . '/../views/pictures/';
        
        // Verificar que la carpeta exista
        if (!is_dir($ruta_carpeta)) {
            if (!mkdir($ruta_carpeta, 0755, true)) {
                echo json_encode(["status" => "error", "mensaje" => "Error al crear la carpeta de imágenes."]);
                exit();
            }
        }

        $ruta_destino = $ruta_carpeta . $nombre_archivo;

        // Mover el archivo subido
        if (!move_uploaded_file($tmp_name, $ruta_destino)) {
            echo json_encode(["status" => "error", "mensaje" => "Error al guardar la imagen."]);
            exit();
        }

        // Ruta relativa para guardar en la base de datos
        $ruta_relativa = 'views/pictures/' . $nombre_archivo;

        // Actualizar en la base de datos
        if ($this->modeloUsuario->actualizarFotoPerfil($id_usuario, $ruta_relativa)) {
            // Actualizar la sesión con la nueva foto
            $_SESSION['foto_perfil'] = $ruta_relativa;
            
            echo json_encode([
                "status" => "success", 
                "mensaje" => "Foto de perfil actualizada correctamente.",
                "ruta_foto" => $ruta_relativa
            ]);
            exit();
        } else {
            // Si falla la BD, eliminar la imagen subida
            unlink($ruta_destino);
            echo json_encode(["status" => "error", "mensaje" => "Error al actualizar la foto en la base de datos."]);
            exit();
        }
    }
}
