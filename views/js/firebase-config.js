// Importaciones usando módulos ES directamente desde el CDN de Firebase (versión 10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

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

// Inicializar servicios
const db = getFirestore(app);
const auth = getAuth(app);

// Exportamos los servicios para poder usarlos en otros archivos
export { app, db, auth };
