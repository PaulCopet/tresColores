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
    events: () => {
        console.log('Data Layer: FirebaseManager accediendo a coleccion events');
        return adminDb.collection('eventos');
    },
    initializeData: async () => {
        console.log('Data Layer: FirebaseManager inicializando datos');
        const historias = require('./initial-data.json').historias;
        const eventosRef = adminDb.collection('eventos');

        // Comprobar si ya existen datos
        const snapshot = await eventosRef.limit(1).get();
        if (!snapshot.empty) {
            console.log('Data Layer: Los datos ya están inicializados');
            return;
        }

        // Cargar datos iniciales
        const batch = adminDb.batch();
        historias.forEach((historia: any) => {
            const docRef = eventosRef.doc(historia.id);
            batch.set(docRef, historia);
        });

        await batch.commit();
        console.log('Data Layer: Datos inicializados correctamente');
    }
};
