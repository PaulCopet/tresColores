import { getApps, initializeApp, cert } from 'firebase-admin/app';
import type { App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

console.log('Backend: Iniciando Firebase Admin SDK');

// Configuración directa de Firebase (para desarrollo)
const projectId = 'trescolores-650d9';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (privateKey && privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
}

// Si no hay credenciales de Admin SDK, usar configuración básica
let app: App;

if (clientEmail && privateKey) {
    console.log('Backend: Firebase Admin SDK - Usando credenciales de Service Account');
    app = getApps().length
        ? (getApps()[0] as App)
        : initializeApp({
            credential: cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
} else {
    console.log('Backend: Firebase Admin SDK - Inicializando sin credenciales Admin (solo projectId)');
    app = getApps().length
        ? (getApps()[0] as App)
        : initializeApp({
            projectId,
        });
}

console.log('Backend: Firebase Admin SDK inicializado correctamente con proyecto:', projectId);

export const adminAuth = getAuth(app);
console.log('Backend: Conexion con Firebase Authentication establecida');

export const adminDb = getFirestore(app);
console.log('Backend: Conexion con Firestore establecida');

export default app;
