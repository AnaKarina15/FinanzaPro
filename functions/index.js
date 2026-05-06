/**
 * Cloud Functions de FinanzaPro para enviar notificaciones Push mediante FCM
 */
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

// Inicializar la aplicación admin de Firebase
admin.initializeApp();

exports.enviarNotificacionPush = onDocumentCreated("notificaciones/{notificacionId}", async (event) => {
    // Obtener los datos del nuevo documento de notificación
    const snap = event.data;
    if (!snap) {
        console.log("No hay datos asociados a este evento.");
        return;
    }

    const notifData = snap.data();
    const uid = notifData.usuario_id;
    
    // Si no hay uid asociado, no podemos saber a quién enviar la notificación
    if (!uid) {
        console.log("La notificación no tiene usuario_id");
        return;
    }

    try {
        // Buscar al usuario en Firestore para obtener su fcm_token y preferencias
        const userRef = admin.firestore().collection("usuarios").doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            console.log(`Usuario no encontrado para el uid: ${uid}`);
            return;
        }

        const userData = userDoc.data();
        
        // Verificar si el usuario tiene las notificaciones push activadas (1 o true)
        if (userData.notificaciones_push === 0 || userData.notificaciones_push === false) {
            console.log(`El usuario ${uid} tiene las notificaciones desactivadas.`);
            return;
        }

        const token = userData.fcm_token;
        if (!token) {
            console.log(`El usuario ${uid} no tiene fcm_token registrado.`);
            return;
        }

        // Construir el mensaje de la notificación
        const message = {
            notification: {
                title: notifData.titulo || "Nueva alerta de FinanzaPro",
                body: notifData.mensaje || "Tienes una nueva notificación."
            },
            data: {
                tipo: notifData.tipo || "info",
                notificacionId: event.params.notificacionId
            },
            token: token
        };

        // Enviar la notificación vía Firebase Cloud Messaging
        const response = await admin.messaging().send(message);
        console.log("Notificación push enviada exitosamente:", response);

    } catch (error) {
        console.error("Error al enviar la notificación push:", error);
    }
});
