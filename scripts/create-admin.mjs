#!/usr/bin/env node
import 'dotenv/config';
import fs from 'node:fs';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function readCreds() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (path) return JSON.parse(fs.readFileSync(path, 'utf8'));
  const pid = process.env.FIREBASE_PROJECT_ID;
  const email = process.env.FIREBASE_CLIENT_EMAIL;
  const key = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (pid && email && key) return { project_id: pid, client_email: email, private_key: key };
  throw new Error('No encontré credenciales Admin (BASE64, PATH o trio PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY).');
}

function init() {
  const creds = readCreds();
  const app = getApps().length ? getApp() : initializeApp({ credential: cert(creds) });
  return { auth: getAuth(app), db: getFirestore(app) };
}

const email = process.argv.includes('--email') ? process.argv[process.argv.indexOf('--email')+1] : 'admin@trescolores.com';
const password = process.argv.includes('--password') ? process.argv[process.argv.indexOf('--password')+1] : 'Admin123';
const name = process.argv.includes('--name') ? process.argv[process.argv.indexOf('--name')+1] : 'Administrador';

(async () => {
  try {
    const { auth, db } = init();

    let user;
    try { user = await auth.getUserByEmail(email); }
    catch { /* create */ }

    if (!user) {
      user = await auth.createUser({ email, password, displayName: name, emailVerified: true });
      console.log('✓ Usuario creado:', user.uid);
    } else {
      console.log('ℹ Ya existía el usuario:', user.uid);
      if (password && password.length >= 6) {
        await auth.updateUser(user.uid, { password });
        console.log('✓ Contraseña actualizada');
      }
    }

    // Custom claim
    await auth.setCustomUserClaims(user.uid, { role: 'admin' });
    console.log('✓ Claim role=admin aplicado');

    // Doc Firestore
    await db.doc(`users/${user.uid}`).set({
      uid: user.uid,
      displayName: name,
      email,
      role: 'admin',
      createdAt: new Date(),
    }, { merge: true });
    console.log('✓ Documento users creado/actualizado');

    console.log(`Listo. Admin: ${email} / ${password}`);
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
