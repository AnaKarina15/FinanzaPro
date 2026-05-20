# FinanzaPro 💰

**FinanzaPro** es un sistema web de gestión financiera personal diseñado especialmente para ayudar a estudiantes universitarios a tomar el control de sus ingresos, categorizar sus transacciones y monitorear su presupuesto diario para evitar quedarse sin fondos antes de fin de mes. Su objetivo principal es combatir el desorden financiero causado por los "gastos hormiga", reduciendo así el estrés académico y personal asociado a la inestabilidad económica.

Este proyecto fue desarrollado por estudiantes de la Universidad del Magdalena en el programa de Ingeniería de Sistemas. La arquitectura de la aplicación evolucionó de un sistema clásico MVC con PHP/MySQL a una moderna **Single Page Application (SPA) 100% Serverless** soportada sobre la plataforma en la nube de Firebase.

---

## 🚀 Características del Sistema

* **Dashboard Intuitivo:** Panel de control con resumen de saldo disponible, métricas de ingresos/gastos y gráfica comparativa mensual.
* **Ingresos y Gastos:** Registro, edición y eliminación de movimientos financieros con categorías personalizadas y validaciones en tiempo real.
* **Presupuestos y Metas:** Definición de límites de gasto por categoría y seguimiento de metas de ahorro con barra de progreso.
* **Perfil de Usuario:** Gestión de datos personales, foto de perfil, cambio de contraseña y preferencias de cuenta con auto-guardado instantáneo.
* **Panel de Administración:** Vista exclusiva para administradores que permite gestionar todos los usuarios de la plataforma.
* **Autenticación Segura y Google Auth:** Login con email/contraseña y **Google OAuth** plenamente funcional. Recuperación de contraseña y verificación de correo.
* **UI/UX Estandarizada:** Interfaz altamente pulida, con modales simétricos, botones consistentes, formato de números telefónicos y diseño responsive en todos los módulos (Arquitectura SPA).

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
├── firestore.rules             # Reglas de seguridad de Firestore
├── README.md
├── functions/                  # Backend Serverless (Node.js)
│   ├── index.js                # Lógica del backend
│   └── package.json
└── views/
    ├── login.php               # Login, registro y recuperación de contraseña
    ├── dashboard.php           # Panel principal con métricas y gráfica
    ├── ingresosGastos.php      # Registro y gestión de movimientos
    ├── presupuestosMetas.php   # Presupuestos por categoría y metas de ahorro
    ├── perfil.php              # Perfil de usuario y preferencias
    ├── perfil_admin.php        # Vista de perfil detallada para administradores
    ├── admin.php               # Panel de administración de usuarios
    ├── reportes.php            # Visualización de reportes financieros
    ├── css/
    │   ├── global.css          # Variables, reset y componentes globales
    │   ├── login.css
    │   ├── dashboard.css
    │   ├── ingresosGastos.css
    │   ├── presupuestosMetas.css
    │   ├── perfil.css
    │   ├── admin.css
    │   └── reportes.css        # Estilos para reportes
    └── js/
        ├── firebase-config.js  # Inicialización y exportación de app, db, auth
        ├── login.js            # Control de login y registro
        ├── dashboard.js        # Lógica del dashboard
        ├── ingresosGastos.js   # Gestión transaccional
        ├── presupuestosMetas.js# Gestión de metas y presupuestos
        ├── perfil.js           # Gestión del perfil de usuario
        ├── perfil_admin.js     # Gestión de perfil para administradores
        ├── admin.js            # Lógica para administración de usuarios
        ├── reportes.js         # Lógica de reportes y gráficas
        ├── notificaciones.js   # Sistema de notificaciones
        ├── notificaciones_admin.js # Notificaciones para admin
        └── presencia.js        # Control de presencia (activo/inactivo)
```

---

## 📊 Diagrama de Casos de Uso

El sistema cuenta con un modelo de casos de uso detallado que define las interacciones de los usuarios y administradores con la plataforma.

El diagrama está organizado en los siguientes bloques:
1. **Autenticación y Acceso**: Registro, inicio de sesión (correo/contraseña y Google OAuth), restablecimiento de contraseña y cierre de sesión.
2. **Perfil y Configuración**: Edición de datos personales (nombre, apellido, teléfono), foto de perfil y preferencias (moneda, tema, notificaciones).
3. **Dashboard**: Resumen financiero rápido y atajos de registro.
4. **Ingresos y Gastos**: Gestión transaccional completa (CRUD) e historial con gráficos.
5. **Presupuesto y Metas**: Gestión de límites de gasto mensuales/anuales y metas de ahorro progresivas.
6. **Reportes y Análisis**: Visualización de métricas generales y exportación de datos.
7. **Componentes Globales**: Sistema de notificaciones en tiempo real.
8. **Administración**: Panel para administradores con control de usuarios y estadísticas globales.

---
## ☁️ Despliegue en Producción (Render)

La plataforma se encuentra totalmente desplegada y lista para su uso en la nube de **Render**, integrada directamente con la infraestructura serverless de Firebase.

🔗 **Enlace de la aplicación:** [https://finanzapro.onrender.com/](https://finanzapro.onrender.com/)

### Características del Despliegue:
* **Contenedorización Docker:** Ejecución optimizada en la nube basada en un contenedor Docker con Apache configurado para soportar PHP y redirecciones estáticas.
* **Compatibilidad SPA:** El servidor está configurado para resolver correctamente el enrutamiento lógico de la Single Page Application sin recargas de página, previniendo errores de tipo `404`.
* **Autenticación en Producción:** El dominio de producción de Render está debidamente autorizado en la consola de Firebase, garantizando que el flujo de **Google Sign-In** funcione de forma transparente y segura para todos los usuarios.

---

## 👥 Equipo de Desarrollo

* **Ana Karina Rivera**
* **Yuranis Patricia Botto**
* **Andrés Rivera**
* **Andrés Charris**
