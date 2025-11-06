// src/backend/firebase/admin.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';

function env(k: string): string | undefined {
  // @ts-ignore - en tiempo de ejecución existe
  const vite = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  return process.env[k] ?? (vite[k] as string | undefined);
}

function loadServiceAccount() {
  const b64  = env('FIREBASE_SERVICE_ACCOUNT_BASE64');
  const pth  = env('FIREBASE_SERVICE_ACCOUNT_PATH');
  const pid  = env('FIREBASE_PROJECT_ID');
  const mail = env('FIREBASE_CLIENT_EMAIL');
  const key  = env('FIREBASE_PRIVATE_KEY');

  if (b64) {
    const json = Buffer.from(b64, 'base64').toString('utf8');
    return JSON.parse(json);
  }

  if (pth) {
    const abs = path.isAbsolute(pth) ? pth : path.resolve(process.cwd(), pth);
    const raw = fs.readFileSync(abs, 'utf8');
    return JSON.parse(raw);
  }

  if (pid && mail && key) {
    return {
      project_id: pid,
      client_email: mail,
      private_key: key.replace(/\\n/g, '\n'),
    };
  }

  throw new Error('NO_CREDS');
}

let _db: FirebaseFirestore.Firestore;

export function getDb() {
  if (_db) return _db;
  const sa = loadServiceAccount();
  const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(sa as any) });
  _db = getFirestore(app);
  return _db;
}
