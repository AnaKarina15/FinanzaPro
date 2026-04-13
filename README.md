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
│   └── connection.php      # Configuración y conexión a la base de datos
├── /controller
│   └── usercontroller.php  # Lógica de negocio y control de usuarios
├── /database
│   └── FinanzaPro.sql      # Script de la base de datos SQL
├── /views
│   ├── /css
│   │   └── style.css       # Hoja de estilos principal
│   ├── /js
│   │   └── script.js       # Lógica de ruteo y validaciones del cliente
│   └── dashboard.php       # Panel principal de usuario (Vista)
├── index.php               # Landing Page principal (Entrada)
└── README.md               # Documentación del proyecto
```

## 👥 Equipo de Desarrollo

* **Ana Karina Rivera**
* **Yuranis Patricia Botto**
* **Andrés Rivera**
* **Andrés Charris**
