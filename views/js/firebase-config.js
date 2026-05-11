// Importaciones usando módulos ES directamente desde el CDN de Firebase (versión 10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getMessaging, isSupported } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-messaging.js";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBecDHELrQQf5ApUJn-xhZmxtIi-MCG0bk",
  authDomain: "finanzapro-89c93.firebaseapp.com",
  projectId: "finanzapro-89c93",
  storageBucket: "finanzapro-89c93.firebasestorage.app",
  messagingSenderId: "798668585737",
  appId: "1:798668585737:web:25ad03ba16ae7e12c831d8"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore con caché offline habilitada
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
});
const auth = getAuth(app);

// messaging se resuelve de forma asíncrona.
// Exportamos getMessagingInstance() para que los consumidores obtengan
// siempre la instancia correcta (evita exportar null por race condition).
let _messagingInstance = null;
export async function getMessagingInstance() {
    if (_messagingInstance) return _messagingInstance;
    try {
        const supported = await isSupported();
        if (supported) {
            _messagingInstance = getMessaging(app);
        }
    } catch (e) {
        console.warn("FCM no soportado en este entorno:", e);
    }
    return _messagingInstance;
}

// Exportamos los servicios para poder usarlos en otros archivos
export { app, db, auth };
