import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { env } from '../env';

console.log('Frontend: Inicializando conexion con Firebase Client SDK');

const firebaseConfig: FirebaseOptions = {
    apiKey: env('PUBLIC_FIREBASE_API_KEY'),
    authDomain: env('PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: env('PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: env('PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: env('PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: env('PUBLIC_FIREBASE_APP_ID'),
    measurementId: env('PUBLIC_FIREBASE_MEASUREMENT_ID')
};

if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    throw new Error('Faltan variables PUBLIC_FIREBASE_* requeridas para inicializar el cliente.');
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig as Record<string, string>);
console.log('Frontend: Firebase Client SDK inicializado correctamente');

export const auth = getAuth(app);
console.log('Frontend: Firebase Authentication conectado');

export const db = getFirestore(app);
console.log('Frontend: Firestore conectado');

export default app;