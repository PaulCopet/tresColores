import 'dotenv/config';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import fs from 'node:fs';

let _inited = false;

function readCreds() {
  // 1) BASE64
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    try {
      const json = Buffer.from(b64, 'base64').toString('utf8');
      return JSON.parse(json);
    } catch (e) {
      console.error('[admin.safe] BASE64 inválido:', e);
      throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 no es un JSON válido');
    }
  }

  // 2) PATH
  const svcPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (svcPath) {
    try {
      const raw = fs.readFileSync(svcPath, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('[admin.safe] No pude leer/parsear el JSON del Service Account en:', svcPath, e);
      throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH apunta a un archivo inexistente o inválido');
    }
  }

  // 3) Trio
  const pid = process.env.FIREBASE_PROJECT_ID;
  const email = process.env.FIREBASE_CLIENT_EMAIL;
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (pid && email && key) {
    return {
      project_id: pid,
      client_email: email,
      private_key: key.replace(/\\n/g, '\n'),
    };
  }

  throw new Error('No encontré credenciales Admin. Usa BASE64, PATH o el trío PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY');
}

export function getAdmin() {
  if (!_inited) {
    const bucket = process.env.PUBLIC_FIREBASE_STORAGE_BUCKET;
    const creds = readCreds();

    try {
      const app = getApps().length ? getApp() : initializeApp({
        credential: cert(creds),
        storageBucket: bucket,
      });
      // solo para silenciar TS
      app.name;
      _inited = true;
      console.log('[admin.safe] Firebase Admin inicializado. bucket =', bucket);
    } catch (e) {
      console.error('[admin.safe] Falló initializeApp:', e);
      throw e;
    }
  }

  // devolvemos instancias
  return {
    adminAuth: getAuth(),
    adminDb: getFirestore(),
    adminStorage: getStorage(),
  };
}
