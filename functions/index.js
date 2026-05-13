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

                // Soportar múltiples tokens (fcm_tokens array) o token único (fcm_token string)
                let tokens = [];
                if (Array.isArray(userData.fcm_tokens) && userData.fcm_tokens.length > 0) {
                    tokens = userData.fcm_tokens;
                } else if (userData.fcm_token) {
                    tokens = [userData.fcm_token];
                }

                if (tokens.length === 0) {
                    console.log(`Usuario ${uid} no tiene token(es) FCM.`);
                    return;
                }

                // Armar el mensaje push
                // Usamos SOLO "data" (no "notification") para que el Service Worker
                // SIEMPRE maneje la notificación — incluso en segundo plano.
                // Cuando se envía "notification", Chrome la muestra automáticamente
                // pero NO permite personalizarla desde onBackgroundMessage.
                const baseMessage = {
                    data: {
                        titulo: notifData.titulo || "FinanzaPro",
                        mensaje: notifData.mensaje || "Tienes una nueva alerta.",
                        tipo: notifData.tipo || "info"
                    },
                    // Configuración específica para web push
                    webpush: {
                        headers: {
                            Urgency: 'high'
                        },
                        notification: {
                            title: notifData.titulo || "FinanzaPro",
                            body: notifData.mensaje || "Tienes una nueva alerta.",
                            icon: '/FinanzaPro/views/css/icon-192.png',
                            badge: '/FinanzaPro/views/css/icon-192.png',
                            requireInteraction: true,
                            vibrate: [200, 100, 200]
                        },
                        fcm_options: {
                            link: '/FinanzaPro/views/dashboard.php'
                        }
                    },
                    // Configuración para Android (si usan Chrome móvil)
                    android: {
                        priority: 'high',
                        notification: {
                            title: notifData.titulo || "FinanzaPro",
                            body: notifData.mensaje || "Tienes una nueva alerta.",
                            icon: 'ic_notification',
                            color: '#059669',
                            defaultSound: true,
                            defaultVibrateTimings: true,
                            channelId: 'finanzapro_alerts'
                        }
                    }
                };

                // Enviar a cada token del usuario
                const invalidTokens = [];

                for (const token of tokens) {
                    try {
                        const message = { ...baseMessage, token: token };
                        const response = await admin.messaging().send(message);
                        console.log(`Push enviado a ${uid} (token: ${token.substring(0, 20)}...):`, response);
                    } catch (sendError) {
                        console.error(`Error enviando push a token ${token.substring(0, 20)}...:`, sendError.code || sendError.message);
                        
                        // Si el token es inválido o expiró, marcarlo para limpieza
                        if (
                            sendError.code === 'messaging/invalid-registration-token' ||
                            sendError.code === 'messaging/registration-token-not-registered' ||
                            sendError.code === 'messaging/invalid-argument'
                        ) {
                            invalidTokens.push(token);
                        }
                    }
                }

                // Limpiar tokens inválidos de Firestore
                if (invalidTokens.length > 0) {
                    console.log(`Limpiando ${invalidTokens.length} token(es) inválido(s) del usuario ${uid}.`);
                    const updateData = {};
                    
                    if (Array.isArray(userData.fcm_tokens)) {
                        // Filtrar tokens inválidos del array
                        const validTokens = userData.fcm_tokens.filter(t => !invalidTokens.includes(t));
                        updateData.fcm_tokens = validTokens;
                    }
                    
                    // Si el token único es inválido, limpiarlo
                    if (userData.fcm_token && invalidTokens.includes(userData.fcm_token)) {
                        updateData.fcm_token = admin.firestore.FieldValue.delete();
                    }

                    if (Object.keys(updateData).length > 0) {
                        await db.collection("usuarios").doc(uid).update(updateData);
                    }
                }

            } catch (error) {
                console.error("Error procesando notificación push:", error);
            }
        }
    });
}, (error) => {
    console.error("Error escuchando Firestore:", error);
});
