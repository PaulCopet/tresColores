import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import admin from 'firebase-admin';
import fssync from 'node:fs';

function getCredsFromEnv() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));

  const svcPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (svcPath) return JSON.parse(fssync.readFileSync(svcPath, 'utf8'));

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
  }
  throw new Error('No Firebase Admin credentials found.');
}

async function main() {
  const creds = getCredsFromEnv();
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(creds) });

  const auth = admin.auth();
  const db = admin.firestore();

  const dataPath = path.resolve('./data/usuarios.json');
  const raw = await fs.readFile(dataPath, 'utf8');
  const json = JSON.parse(raw);

  for (const u of json.usuarios || []) {
    let record;
    try {
      record = await auth.getUserByEmail(u.correo);
    } catch {
      record = await auth.createUser({
        email: u.correo,
        emailVerified: true,
        password: u.contraseña,
        displayName: u.nombre
      });
    }
    await auth.setCustomUserClaims(record.uid, { role: u.rol });
    await db.collection('users').doc(record.uid).set({
      uid: record.uid,
      displayName: u.nombre,
      email: u.correo,
      role: u.rol,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`Upserted user ${u.correo} -> role=${u.rol}`);
  }

  console.log('Users migrated and claims set.');
}

main().catch((e) => { console.error(e); process.exit(1); });
