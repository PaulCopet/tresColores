import * as admin from 'firebase-admin';
import fs from 'node:fs';
import { env } from './env';

let app: admin.app.App;

function loadServiceAccount(): admin.ServiceAccount {
  const b64 = env('FIREBASE_SERVICE_ACCOUNT_BASE64');
  const path = env('FIREBASE_SERVICE_ACCOUNT_PATH');

  if (b64 && String(b64).trim() !== '') {
    return JSON.parse(Buffer.from(String(b64), 'base64').toString('utf8'));
  }

  if (path && fs.existsSync(path)) {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  }

  // Fallback a variables sueltas
  const project_id = env('FIREBASE_PROJECT_ID') ?? env('PUBLIC_FIREBASE_PROJECT_ID');
  const client_email = env('FIREBASE_CLIENT_EMAIL');
  const private_key = env('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

  if (project_id && client_email && private_key) {
    return { project_id, client_email, private_key } as admin.ServiceAccount;
  }

  throw new Error(
    'No hay credenciales. Define FIREBASE_SERVICE_ACCOUNT_BASE64 (recomendado) ' +
    'o FIREBASE_SERVICE_ACCOUNT_PATH, o bien FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.'
  );
}

if (!admin.apps.length) {
  const sa = loadServiceAccount();
  const projectId = (sa as any).project_id ?? env('PUBLIC_FIREBASE_PROJECT_ID');
  process.env.GOOGLE_CLOUD_PROJECT = projectId || process.env.GOOGLE_CLOUD_PROJECT || '';

  app = admin.initializeApp({
    credential: admin.credential.cert(sa),
    projectId,
    storageBucket: env('PUBLIC_FIREBASE_STORAGE_BUCKET'),
  });
} else {
  app = admin.app();
}

export { admin, app };
