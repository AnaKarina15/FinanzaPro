const admin = require('firebase-admin');

// 1. Inicializar Firebase Admin
// Cuando se despliegue en Render, usaremos una variable de entorno FIREBASE_SERVICE_ACCOUNT
// que contendrá el JSON de credenciales de Firebase en formato string.
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin inicializado correctamente.");
    } else {
        console.warn("ADVERTENCIA: No se encontró FIREBASE_SERVICE_ACCOUNT en el entorno. Si estás en local, asegúrate de tener permisos.");
        admin.initializeApp(); // Intentará usar default credentials si existen
    }
} catch (error) {
    console.error("Error inicializando Firebase Admin:", error);
}

// 3. Listener en Tiempo Real de Firestore
// Esto reemplaza a las Cloud Functions. El script se queda escuchando la colección.
const db = admin.firestore();
let isFirstRun = true;

db.collection('notificaciones').onSnapshot(async (snapshot) => {
    // Evitar enviar push de notificaciones viejas al arrancar el servidor
    if (isFirstRun) {
        isFirstRun = false;
        return;
    }

    snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
            const notifData = change.doc.data();
            const uid = notifData.usuario_id;
            
            if (!uid) return;

            try {
                // Obtener datos del usuario
                const userDoc = await db.collection("usuarios").doc(uid).get();
                if (!userDoc.exists) return;

                const userData = userDoc.data();
                
                // Verificar permisos del usuario
                if (userData.notificaciones_push === 0 || userData.notificaciones_push === false) {
                    console.log(`Usuario ${uid} tiene notificaciones desactivadas.`);
                    return;
                }

                const token = userData.fcm_token;
                if (!token) {
                    console.log(`Usuario ${uid} no tiene token FCM.`);
                    return;
                }

                // Armar y enviar el push
                const message = {
                    notification: {
                        title: notifData.titulo || "FinanzaPro",
                        body: notifData.mensaje || "Tienes una nueva alerta."
                    },
                    data: {
                        tipo: notifData.tipo || "info"
                    },
                    token: token
                };

                const response = await admin.messaging().send(message);
                console.log("Push enviado con éxito:", response);

            } catch (error) {
                console.error("Error enviando push:", error);
            }
        }
    });
}, (error) => {
    console.error("Error escuchando Firestore:", error);
});
