import { adminDb } from './firebaseAdmin.js';

console.log('Data Layer: FirebaseManager cargado');

export const firebaseManager = {
    users: () => {
        console.log('Data Layer: FirebaseManager accediendo a coleccion users');
        return adminDb.collection('users');
    },
    audit: () => {
        console.log('Data Layer: FirebaseManager accediendo a coleccion audit_logs');
        return adminDb.collection('audit_logs');
    },
};
