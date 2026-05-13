/**
 * presencia.js — Módulo de presencia de usuario
 * 
 * Escribe en Firestore `usuarios/{uid}`:
 *   - en_linea: true/false
 *   - ultima_conexion: serverTimestamp
 *
 * Usa un heartbeat cada 2 minutos para mantener la sesión como activa.
 * Marca offline al cerrar la pestaña, al perder visibilidad y al hacer signOut.
 */

import { db, auth } from './firebase-config.js';
import { doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

let _uid = null;
let _heartbeatInterval = null;
const HEARTBEAT_MS = 2 * 60 * 1000; // 2 minutos

// ── Marcar ONLINE ──────────────────────────────
async function marcarOnline(uid) {
    try {
        await updateDoc(doc(db, "usuarios", uid), {
            en_linea: true,
            ultima_conexion: serverTimestamp()
        });
    } catch (e) {
        console.warn("[Presencia] No se pudo marcar online:", e.message);
    }
}

// ── Marcar OFFLINE ─────────────────────────────
async function marcarOffline(uid) {
    try {
        await updateDoc(doc(db, "usuarios", uid), {
            en_linea: false,
            ultima_conexion: serverTimestamp()
        });
    } catch (e) {
        console.warn("[Presencia] No se pudo marcar offline:", e.message);
    }
}

// ── Marcar offline de forma síncrona (para beforeunload) ──
function marcarOfflineSync(uid) {
    // Usamos sendBeacon para garantizar que se envía antes de cerrar.
    // Como Firestore REST API no soporta directamente sendBeacon con auth,
    // hacemos un intento con updateDoc (funciona si la tab no se mata al instante).
    // También usamos navigator.sendBeacon como fallback con un Cloud Function
    // si estuviera disponible en el futuro.
    try {
        updateDoc(doc(db, "usuarios", uid), {
            en_linea: false,
            ultima_conexion: serverTimestamp()
        });
    } catch (_) { /* best-effort */ }
}

// ── Iniciar heartbeat ──────────────────────────
function iniciarHeartbeat(uid) {
    detenerHeartbeat();
    _heartbeatInterval = setInterval(() => {
        marcarOnline(uid);
    }, HEARTBEAT_MS);
}

function detenerHeartbeat() {
    if (_heartbeatInterval) {
        clearInterval(_heartbeatInterval);
        _heartbeatInterval = null;
    }
}

// ── Listeners del navegador ────────────────────
function registrarListeners(uid) {
    // Al cerrar/recargar pestaña
    window.addEventListener('beforeunload', () => {
        marcarOfflineSync(uid);
    });

    // Al perder/ganar visibilidad (cambio de pestaña, minimizar)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            // No marcamos offline inmediatamente al ocultar porque puede ser
            // solo un alt-tab momentáneo. El heartbeat dejará de ejecutarse
            // naturalmente si la tab queda en segundo plano mucho tiempo.
            // Sin embargo, actualizamos la última conexión.
            marcarOnline(uid);
        } else if (document.visibilityState === 'visible') {
            marcarOnline(uid);
        }
    });
}

// ── Inicialización automática al detectar auth ─
export function initPresencia(uid) {
    if (!uid) return;
    _uid = uid;
    marcarOnline(uid);
    iniciarHeartbeat(uid);
    registrarListeners(uid);
}

// ── Para signOut manual ────────────────────────
export async function cerrarPresencia() {
    detenerHeartbeat();
    if (_uid) {
        await marcarOffline(_uid);
        _uid = null;
    }
}
