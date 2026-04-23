<?php
require_once "model/Conexion.php";
require_once "model/DAO/UsuarioDAO.php";

class Usuario {
  private $conexion;
  private $usuarioDao;

  private $id_usuario;
  private $id_rol;
  private $nombre;
  private $apellido;
  private $correo;
  private $telefono;
  private $contrasena;
  private $fecha_registro;

  public function __construct() {
    $this->conexion = Conexion::conectar();
    $this->usuarioDao = new UsuarioDAO();
  }

  /**
   * Valida si la contraseña cumple con las políticas de seguridad estrictas (Adaptado del Frontend).
   * @param string $contrasena La contraseña tal como la escribió el usuario.
   * @return bool Verdadero si la contraseña cumple con el formato.
   */
  public function esContrasenaSegura($contrasena) {
    $regex_contrasena = "/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,64}$/";
    return preg_match($regex_contrasena, $contrasena);
  }


  /**
   * Solicita la creación de un nuevo usuario.
   * @param array $datos Datos del usuario.
   * @return bool|string Verdadero si el registro fue exitoso,
   * si el registro falla retorna una cadena de texto explicando el motivo.
   */
  public function crearCuenta(array $datos) {
    if (!$this->esContrasenaSegura($datos["contrasena"])) {
      return "La contraseña debe tener entre 8 y 64 caracteres, e incluir al menos una mayúscula, una minúscula, un número y un carácter especial.";
    }
  
    if ($this->usuarioDao->existeCorreo($datos["correo"])) {
      return "El correo electrónico ya se encuentra registrado";
    }

    $datos["contrasena"] = password_hash($datos['contrasena'], PASSWORD_DEFAULT);

    $resultado = $this->usuarioDao->insertar($datos);

    if ($resultado) {
      return true;
    } else {
      error_log("Fallo crítico al insertar usuario en la base de datos.");
      return "Hubo un error interno al procesar su registro. Intente más tarde.";
    }
  }

  /* Getters públicos para datos seguros. */
  public function getId() {return $this->id_usuario; }
  public function getIdRol() {return $this->id_rol; }
  public function getNombre() {return $this->nombre; }
  public function getApellido() {return $this->apellido; }
  public function getCorreo() {return $this->correo; }
  public function getTelefono() {return $this->telefono; }
  public function getFechaRegistro() {return $this->fecha_registro; }


}
