// src/pages/api/historias.ts
import type { APIRoute } from 'astro';
import { getDb } from '../../services/firebase/admin';

export const GET: APIRoute = async () => {
  try {
    const db = getDb();
    const snap = await db.collection('events').orderBy('fecha').get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (e: any) {
    const msg = e?.message === 'NO_CREDS'
      ? 'No hay credenciales. Define FIREBASE_SERVICE_ACCOUNT_BASE64 (recomendado) o FIREBASE_SERVICE_ACCOUNT_PATH, o bien FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.'
      : (e?.message || 'Server error');
    return new Response(JSON.stringify({ success: false, error: msg }), {
      headers: { 'content-type': 'application/json' },
      status: 500,
    });
  }
};
