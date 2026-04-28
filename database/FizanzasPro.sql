-- 1. Crear la tabla Roles (Debe ir primero porque usuarios depende de ella)
CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255)
);

-- 2. Insertar los roles por defecto
INSERT INTO roles (nombre_rol, descripcion) VALUES
('Admin', 'Administrador del sistema con acceso total a reportes y usuarios'),
('Usuario', 'Usuario estándar de la aplicación financiera');

-- 3. Crear la tabla Usuarios (Conecta con Roles)
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_rol INT DEFAULT 2, -- Por defecto todos son 'Usuario' (id 2)
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(20) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cuenta_verificada BOOLEAN DEFAULT FALSE,
    moneda_principal VARCHAR(3) DEFAULT 'COP',
    tema_interfaz VARCHAR(10) DEFAULT 'claro',
    notificaciones_push BOOLEAN DEFAULT TRUE,
    reportes_semanales BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

-- 4. Crear tabla Pines de Seguridad (Para recuperación de contraseñas, etc.)
CREATE TABLE pines_seguridad (
    id_pin INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    codigo_pin VARCHAR(6) NOT NULL,
    fecha_expiracion TIMESTAMP NOT NULL,
    fue_usado BOOLEAN DEFAULT FALSE,
    tipo_operacion VARCHAR(50) NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- 5. Crear tabla Iconos
CREATE TABLE iconos (
    id_icono INT AUTO_INCREMENT PRIMARY KEY,
    nombre_descriptivo VARCHAR(50) NOT NULL,
    codigo_material VARCHAR(50) NOT NULL 
);

-- 6. Insertar iconos por defecto
INSERT INTO iconos (nombre_descriptivo, codigo_material) VALUES 
('Comida', 'restaurant'), ('Transporte', 'directions_bus'), ('Vivienda', 'home'),
('Salud', 'medical_services'), ('Educación', 'school'), ('Entretenimiento', 'sports_esports'),
('Ropa', 'checkroom'), ('Ahorro', 'savings'), ('Salario', 'payments'), ('Transferencia', 'sync_alt');

-- 7. Crear tabla Categorías
CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NULL,
    id_icono INT NULL,
    nombre VARCHAR(50) NOT NULL,
    tipo ENUM('ingreso', 'gasto') NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_icono) REFERENCES iconos(id_icono) ON DELETE SET NULL
);

-- 8. Crear tabla Transacciones
CREATE TABLE transacciones (
    id_transaccion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_categoria INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    fecha DATE NOT NULL,
    descripcion VARCHAR(255),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE RESTRICT
);

-- 9. Crear tabla Metas
CREATE TABLE metas (
    id_meta INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_icono INT NULL,
    nombre VARCHAR(100) NOT NULL,
    monto_objetivo DECIMAL(10,2) NOT NULL,
    monto_actual DECIMAL(10,2) DEFAULT 0.00,
    fecha_limite DATE NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_icono) REFERENCES iconos(id_icono) ON DELETE SET NULL
);

-- 10. Crear tabla Presupuestos
CREATE TABLE presupuestos (
    id_presupuesto INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_categoria INT NULL,
    id_icono INT NULL,
    nombre VARCHAR(100) NOT NULL,
    monto_limite DECIMAL(10,2) NOT NULL,
    alerta_80_porciento BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE CASCADE,
    FOREIGN KEY (id_icono) REFERENCES iconos(id_icono) ON DELETE SET NULL
);

-- 11. Crear tabla Notificaciones
CREATE TABLE notificaciones (
    id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- 12. Crear Índices (Mejora la velocidad de las consultas)
CREATE INDEX idx_transacciones_usuario ON transacciones(id_usuario);
CREATE INDEX idx_transacciones_fecha ON transacciones(fecha);
CREATE INDEX idx_pines_codigo ON pines_seguridad(codigo_pin);