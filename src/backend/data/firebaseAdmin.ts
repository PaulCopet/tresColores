import { getApps, initializeApp, cert } from 'firebase-admin/app';
import type { App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (privateKey && privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
}

if (!projectId || !clientEmail || !privateKey) {
    console.warn('[firebaseAdmin] Missing one or more Firebase Admin env vars.');
}

const app: App = getApps().length
    ? (getApps()[0] as App)
    : initializeApp({
        credential: cert({
            projectId,
            clientEmail,
            privateKey,
        }),
    });

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export default app;
