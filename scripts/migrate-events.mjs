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

function slugify(input) {
  return input.normalize('NFKD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function eventIdFrom(fecha, ubicacion) {
  const city = (ubicacion || 'colombia').split(',')[0].trim();
  const citySlug = slugify(city);
  return `${fecha}_${citySlug}`;
}

async function main() {
  const creds = getCredsFromEnv();
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(creds),
      storageBucket: process.env.PUBLIC_FIREBASE_STORAGE_BUCKET
    });
  }
  const db = admin.firestore();

  const dataPath = path.resolve('./data/historias-colombia.json');
  const raw = await fs.readFile(dataPath, 'utf8');
  const json = JSON.parse(raw);

  let batch = db.batch();
  let count = 0;

  for (const h of json.historias || []) {
    const id = eventIdFrom(h.fecha, h.ubicacion);
    const ciudad = (h.ubicacion || '').split(',')[0].trim();

    const ref = db.collection('events').doc(id);
    batch.set(ref, {
      id,
      fecha: h.fecha,
      date: h.fecha,
      nombre: h.nombre,
      descripcion: h.descripcion,
      integrantes: h.integrantes || [],
      ubicacion: h.ubicacion,
      city: ciudad,
      consecuencias: h.consecuencias || [],
      published: true,
      coverImagePath: `event-images/${id}/cover.jpg`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    count++;
    if (count % 400 === 0) { await batch.commit(); batch = db.batch(); }
  }

  await batch.commit();
  console.log(`Migrated/updated ${count} events to Firestore.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
