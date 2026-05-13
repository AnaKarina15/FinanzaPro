importScripts('https://www.gstatic.com/firebasejs/10.11.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBecDHELrQQf5ApUJn-xhZmxtIi-MCG0bk",
  authDomain: "finanzapro-89c93.firebaseapp.com",
  projectId: "finanzapro-89c93",
  storageBucket: "finanzapro-89c93.firebasestorage.app",
  messagingSenderId: "798668585737",
  appId: "1:798668585737:web:25ad03ba16ae7e12c831d8"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ═══════════════════════════════════════════════════════════
// NOTIFICACIONES EN SEGUNDO PLANO
// Se activa cuando la pestaña NO está en primer plano
// ═══════════════════════════════════════════════════════════
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Mensaje en segundo plano recibido:', payload);

  // Si el payload ya trae "notification", el navegador la muestra automáticamente.
  // onBackgroundMessage se invoca para payloads data-only O para personalizar la notificación.
  const title = payload.notification?.title || payload.data?.titulo || 'FinanzaPro';
  const body  = payload.notification?.body  || payload.data?.mensaje || 'Tienes una nueva alerta.';
  const tipo  = payload.data?.tipo || 'info';

  // Mapear tipo → ícono emoji para que aparezca en la notificación del sistema
  const badges = { alerta: '⚠️', meta: '🏆', info: 'ℹ️' };
  const badgeEmoji = badges[tipo] || 'ℹ️';

  const notificationOptions = {
    body: body,
    icon: '/FinanzaPro/views/css/icon-192.png',  // Ícono de la app (generado abajo)
    badge: '/FinanzaPro/views/css/icon-192.png',
    tag: `finanzapro-${tipo}-${Date.now()}`,       // Evita apilar notificaciones iguales
    renotify: true,
    vibrate: [200, 100, 200],                      // Vibración en móviles
    data: {
      tipo: tipo,
      url: '/FinanzaPro/views/dashboard.php'       // URL al hacer clic
    },
    actions: [
      { action: 'open', title: 'Ver ahora' },
      { action: 'dismiss', title: 'Descartar' }
    ]
  };

  return self.registration.showNotification(title, notificationOptions);
});

// ═══════════════════════════════════════════════════════════
// CLIC EN LA NOTIFICACIÓN — abre la app
// ═══════════════════════════════════════════════════════════
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  // URL objetivo: la que viene en data, o el dashboard por defecto
  const targetUrl = event.notification.data?.url || '/FinanzaPro/views/dashboard.php';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una pestaña abierta de FinanzaPro, enfocarla
      for (const client of clientList) {
        if (client.url.includes('/FinanzaPro/') && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ninguna pestaña abierta, abrir una nueva
      return clients.openWindow(targetUrl);
    })
  );
});
