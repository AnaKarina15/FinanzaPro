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

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/FinanzaPro/views/img/logo.png', // Fallback icon path (you can adjust if needed)
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
