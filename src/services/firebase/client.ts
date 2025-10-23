import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

console.log('Frontend: Inicializando conexion con Firebase Client SDK');

const firebaseConfig = {
    apiKey: "AIzaSyDHDuAKIbPltzb8Zj9opaVEQJDnxztyowQ",
    authDomain: "trescolores-650d9.firebaseapp.com",
    projectId: "trescolores-650d9",
    storageBucket: "trescolores-650d9.firebasestorage.app",
    messagingSenderId: "144531600305",
    appId: "1:144531600305:web:f8822e7f61dd703fd84390"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
console.log('Frontend: Firebase Client SDK inicializado correctamente');

// Useful singletons
export const auth = getAuth(app);
console.log('Frontend: Firebase Authentication conectado');

export const db = getFirestore(app);
console.log('Frontend: Firestore conectado');

export default app;
