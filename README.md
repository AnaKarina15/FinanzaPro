# FinanzaPro 💰

**FinanzaPro** es un sistema web de gestión financiera personal diseñado para ayudar a los usuarios a tomar el control de sus ingresos, organizar su presupuesto y alcanzar sus metas de ahorro.

Este proyecto fue desarrollado como parte de nuestra formación en el programa de Ingeniería de Sistemas de la Universidad del Magdalena. La arquitectura ha evolucionado de un sistema MVC con PHP/MySQL a una **Single Page Application (SPA) 100% Serverless** sobre Firebase.

---

## 🚀 Características del Sistema

* **Dashboard Intuitivo:** Panel de control con resumen de saldo disponible, métricas de ingresos/gastos y gráfica comparativa mensual.
* **Ingresos y Gastos:** Registro, edición y eliminación de movimientos financieros con categorías personalizadas.
* **Presupuestos y Metas:** Definición de límites de gasto por categoría y seguimiento de metas de ahorro con barra de progreso.
* **Perfil de Usuario:** Gestión de datos personales, foto de perfil, cambio de contraseña y preferencias de cuenta con auto-guardado.
* **Panel de Administración:** Vista exclusiva para administradores que permite gestionar todos los usuarios de la plataforma.
* **Autenticación Segura:** Login con email/contraseña y Google (OAuth), recuperación de contraseña y verificación de correo.

---

## 🛠️ Tecnologías Utilizadas

**Backend / Infraestructura (Serverless):**
* **Firebase Authentication:** Manejo de sesiones, registro, login con Google, cambio de correo y contraseña con re-autenticación.
* **Cloud Firestore:** Base de datos NoSQL en la nube. Todas las operaciones CRUD se realizan directamente desde el cliente con la SDK de Firebase v10.
* **Firebase Storage:** Almacenamiento de fotos de perfil de usuario.
* **Firestore Security Rules:** Reglas de seguridad que garantizan que cada usuario solo acceda a sus propios datos.

**Frontend:**
* **HTML5 + PHP:** PHP sirve únicamente como motor de plantillas para renderizar el HTML inicial de cada vista. Toda la lógica de negocio corre en JavaScript.
* **CSS3 (Vanilla):** Sistema de diseño propio con variables CSS, CSS Grid y Flexbox. Sin dependencias de frameworks.
* **JavaScript (ES Modules):** Módulos nativos del navegador para organizar la lógica por vista. Comunicación directa con Firebase SDK v10.
* **SweetAlert2:** Alertas y modales de confirmación con diseño premium.
* **Chart.js:** Gráficas de ingresos vs. gastos en el dashboard.
* **Google Material Symbols & Inter (Google Fonts):** Iconografía y tipografía modernas.

---

## 🧠 Principios de Usabilidad y UX

1. **Legibilidad y Contraste:** Tipografía *Inter* con paleta de colores de alto contraste (Verde Esmeralda `#059669` sobre fondos neutros `#f8fafc`).
2. **Auto-guardado:** Los cambios de perfil (nombre, moneda, tema, notificaciones) se guardan automáticamente en Firestore al instante, sin botones de "Guardar" globales.
3. **Feedback Visual:** Micro-interacciones en botones, estados `hover`, alertas `SweetAlert2` y animaciones CSS para mejorar la experiencia interactiva.
4. **Navegación Consistente:** Encabezados (título, fecha, botones de acción) alineados en la misma posición en todas las vistas para una experiencia de SPA real.

---

## 🗄️ Estructura de la Base de Datos (Firestore)

```
Firestore
│
├── usuarios/{uid}            ← ID = UID de Firebase Auth
│   nombre, apellido, email, telefono, fotoPerfil
│   rol (admin | usuario), estado, moneda_principal
│   tema_interfaz, notificaciones_push
│
├── transacciones/{autoId}
│   usuario_id, tipo (ingreso | gasto)
│   monto, categoria, descripcion, fecha
│
├── presupuestos/{autoId}
│   id_usuario, nombre, icono
│   limite, periodo (mensual | anual)
│   notificaciones
│
└── metas/{autoId}
    id_usuario, nombre, icono
    monto_meta, monto_actual
    fecha_limite, descripcion
```

---

## 📂 Estructura del Proyecto

```text
FinanzaPro/
├── index.php                   # Redirige a views/login.php
├── firestore.rules             # Reglas de seguridad de Firestore (referencia)
├── README.md
└── views/
    ├── login.php               # Login, registro y recuperación de contraseña
    ├── dashboard.php           # Panel principal con métricas y gráfica
    ├── ingresosGastos.php      # Registro y gestión de movimientos
    ├── presupuestosMetas.php   # Presupuestos por categoría y metas de ahorro
    ├── perfil.php              # Perfil de usuario y preferencias
    ├── admin.php               # Panel de administración de usuarios
    ├── verificar_cuenta.php    # Página de verificación de correo
    ├── css/
    │   ├── global.css          # Variables, reset y componentes globales
    │   ├── login.css
    │   ├── dashboard.css
    │   ├── ingresosGastos.css
    │   ├── presupuestosMetas.css
    │   ├── perfil.css
    │   └── admin.css
    └── js/
        ├── firebase-config.js  # Inicialización y exportación de app, db, auth
        ├── login.js
        ├── dashboard.js
        ├── ingresosGastos.js
        ├── presupuestosMetas.js
        ├── perfil.js
        └── admin.js
```

---

## ⚙️ Instalación y Configuración

> **No se requiere base de datos local.** La aplicación es 100% serverless.

1. Clona el repositorio
2. Coloca el proyecto en `C:\xampp\htdocs\FinanzaPro`
3. Asegúrate de tener Apache corriendo en XAMPP
4. Accede a `http://localhost/FinanzaPro`

El proyecto se conecta automáticamente al proyecto de Firebase configurado en `views/js/firebase-config.js`.

> **Para contribuidores:** Si deseas conectar tu propio proyecto Firebase, reemplaza el objeto `firebaseConfig` en `firebase-config.js` con las credenciales de tu proyecto y publica las reglas del archivo `firestore.rules` en tu consola de Firestore.

---

## 👥 Equipo de Desarrollo

* **Ana Karina Rivera**
* **Yuranis Patricia Botto**
* **Andrés Rivera**
* **Andrés Charris**
