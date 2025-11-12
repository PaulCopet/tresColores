import { initializeApp, getApp, getApps, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { env } from './env';

function ensureApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = env('PUBLIC_FIREBASE_PROJECT_ID');

  if (!projectId) {
    throw new Error('PUBLIC_FIREBASE_PROJECT_ID no está definido en .env');
  }

  console.log('firebase-admin: inicializando sin credenciales de servicio (modo cliente público)');

  return initializeApp({
    projectId,
    storageBucket: env('PUBLIC_FIREBASE_STORAGE_BUCKET'),
  });
}

export const app = ensureApp();
export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);

export function getDb() {
  return adminDb;
}
