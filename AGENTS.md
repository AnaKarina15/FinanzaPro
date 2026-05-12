# AGENTS.md - FinanzaPro

## Project Overview
- **Type**: PHP SPA with Firebase backend (100% serverless)
- **Local Dev**: XAMPP (Apache on port 80)
- **Production**: Docker on Render (Node.js + Apache dual server)

## Key Directories
```
FinanzaPro/
├── index.php                      # Entry point (redirects to views)
├── firebase.json                  # Firebase config
├── firebase-messaging-sw.js       # Firebase Cloud Messaging service worker
├── Dockerfile                     # Docker production image
├── functions/                     # Node.js backend (Express + firebase-admin)
│   ├── index.js
│   └── package.json
└── views/
    ├── login.php, dashboard.php, ingresosGastos.php
    ├── presupuestosMetas.php, perfil.php, perfil_admin.php
    ├── admin.php, reportes.php
    ├── css/                       # Global + per-view CSS
    └── js/                        # ES Modules + firebase-config.js
```

## Developer Commands
- Local: Access via `http://localhost/FinanzaPro` with Apache running
- Docker build: `docker build -t finanzapro .`
- Node server (functions): `npm start` from `functions/`

## Architecture Notes
- PHP is only a template engine; all logic runs in JavaScript ES Modules
- Firebase SDK loaded via CDN imports (v10.x)
- Firestore has offline cache enabled (`persistentLocalCache`)
- Auth uses Google OAuth + email/password

## Important Conventions
- Firebase credentials in `views/js/firebase-config.js` - do not commit changes
- Add localhost to Firebase Console authorized domains for local auth
- Route changes use `window.location.href` (SPA behavior)

## Database (Firestore)
- `usuarios/{uid}` - user profiles with rol (admin|usuario)
- `transacciones/{autoId}` - income/expense records
- `presupuestos/{autoId}` - budget limits by category
- `metas/{autoId}` - savings goals with progress