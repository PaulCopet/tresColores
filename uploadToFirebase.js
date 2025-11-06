const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const historias = require('./src/data/historias-colombia.json');

// Configuración de Firebase Admin
const serviceAccount = {
    "type": "service_account",
    "project_id": "trescolores-650d9",
    // Necesitarás rellenar estos datos con tus credenciales
    "private_key_id": "TU_PRIVATE_KEY_ID",
    "private_key": "TU_PRIVATE_KEY",
    "client_email": "TU_CLIENT_EMAIL",
    "client_id": "TU_CLIENT_ID",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "TU_CERT_URL",
    "universe_domain": "googleapis.com"
};

// Inicializa Firebase Admin
const app = initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore(app);

async function uploadData() {
    try {
        const batch = db.batch();

        // Obtener referencia a la colección
        const eventosRef = db.collection('eventos');

        // Agregar cada historia al batch
        historias.historias.forEach((historia) => {
            const docRef = eventosRef.doc(historia.id);
            batch.set(docRef, historia);
        });

        // Commit del batch
        await batch.commit();
        console.log('Datos subidos exitosamente a Firebase');
    } catch (error) {
        console.error('Error al subir datos:', error);
    }
}

// Ejecutar la función
uploadData();