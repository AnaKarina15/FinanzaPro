# FinanzaPro 💰

**FinanzaPro** es un sistema web de gestión financiera diseñado con una **arquitectura modular y escalable** para ayudar a los usuarios a tomar el control de sus ingresos, organizar su presupuesto para gastos diarios y alcanzar sus metas de ahorro. 

Este proyecto fue desarrollado como parte de nuestra formación en el programa de Ingeniería de Sistemas de la Universidad del Magdalena, aplicando buenas prácticas de separación de responsabilidades (Backend/Frontend).

## 🚀 Características del Sistema

* **Arquitectura Modular:** Estructuración del código basada en el patrón MVC (Controladores, Vistas y Configuración) para facilitar la escalabilidad y el mantenimiento.
* **Landing Page:** Diseño moderno y asimétrico para presentar el producto con una navegación clara.
* **Dashboard Intuitivo:** Panel de control dinámico con resumen de saldo, métricas visuales y recordatorios financieros.
* **Gestión de Datos Segura:** Conexión centralizada a la base de datos para la persistencia del estado financiero del usuario.

## 🛠️ Tecnologías Utilizadas

**Backend y Datos:**
* **PHP:** Lógica del lado del servidor, manejo de peticiones a través de controladores (`usercontroller.php`) y gestión de conexiones.
* **SQL:** Diseño y persistencia de la base de datos relacional (`FinanzaPro.sql`).

**Frontend:**
* **HTML5:** Aplicación de estructura semántica (`<header>`, `<main>`, `<article>`, `<aside>`, `<footer>`) para mejorar la accesibilidad y correcta jerarquía del contenido.
* **CSS3 (Vanilla):** Metodología basada en componentes y utilidades. Uso de CSS Grid y Flexbox para layouts estructurados y responsivos sin dependencias externas.
* **JavaScript:** Manejo del DOM para navegación interna, interactividad y validación de formularios en el cliente.
* **Iconografía:** Google Material Symbols para una interfaz intuitiva y fácil de reconocer.

## 🧠 Principios de Usabilidad y UX

Para cumplir con los altos estándares de diseño y usabilidad, implementamos:

1.  **Legibilidad y Contraste:** Uso de la tipografía *Inter* y una paleta de colores de alto contraste (Verde Esmeralda `#059669` sobre fondos neutros `#f8fafc`) para reducir la fatiga visual.
2.  **Jerarquía de la Información:** Distribución basada en patrones de escaneo visual (F-Pattern), priorizando los saldos y movimientos recientes.
3.  **Feedback Visual:** Micro-interacciones en botones y elementos de configuración (efectos de rotación y cambio de estado `hover`) para mejorar la experiencia interactiva.
4.  **Navegación Intuitiva:** Menú lateral persistente con iconografía universal para facilitar el reconocimiento de las secciones.

## 📂 Estructura del Proyecto

```text
/FINANZASPRO
├── /conf
│   └── config.php              # Información para conectarse a la base de datos
├── /controller
│   └── controladorUsuario.php  # Lógica de negocio y control de usuarios
├── /database
│   └── FinanzaPro.sql          # Script de la base de datos SQL
├── /model
│   └── Conexion.php            # Logica de conexion a la base de datos
│   └── Usuario.php             # Logica de acceso a datos del usuario
├── /views
│   ├── /css
│   │   └── dashboard.css       # Hoja de estilos del dashboard
│   │   └── global.css          # Hoja de estilos globales
│   │   └── login.css           # Hoja de estilos del login
│   ├── /js
│   │   └── dashboard.js        # Logica del frontend de la vista dashboard
│   │   └── login.js            #  Logica del frontend de la vista login
│   └── dashboard.php           # Panel principal de usuario (Vista)
│   └── login.php               # Inicio de sesión (Vista)
├── index.php                   # Landing Page principal (Entrada)
└── README.md                   # Documentación del proyecto
```

## ⚙️ Configuración

### Base de Datos (Aiven)

1. **Variables de Entorno:**
   Crea un archivo `.env` en la raíz del proyecto:
   ```env
   DB_HOST=tu-host-de-aiven.aivencloud.com
   DB_PORT=22181
   DB_USER=avnadmin
   DB_PASS=tu-contraseña-de-aiven
   DB_NAME=FinanzaPro
   ```

2. **Certificado SSL (Obligatorio para Producción):**
   - Ve a [Aiven Console](https://console.aiven.io/)
   - Selecciona tu servicio MySQL
   - Ve a la pestaña "Overview" → "Connection Information"
   - Descarga el "CA Certificate" (ca.pem)
   - Coloca el archivo en `config/ca.pem`

   **Nota:** Si no tienes el certificado, la aplicación intentará conectarse sin SSL (solo para desarrollo).

### Instalación

1. Clona el repositorio
2. Configura XAMPP con Apache y MySQL
3. Coloca el proyecto en `C:\xampp\htdocs\FinanzaPro`
4. Importa `database/FinanzaPro.sql` en tu base de datos
5. Configura el archivo `.env` con tus credenciales
6. Accede a `http://localhost/FinanzaPro`

## 👥 Equipo de Desarrollo

* **Ana Karina Rivera**
* **Yuranis Patricia Botto**
* **Andrés Rivera**
* **Andrés Charris**
