import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    const { getAdmin } = await import('../../services/firebase/admin.safe');
    const { adminDb, adminAuth, adminStorage } = getAdmin();

    // toca Firestore para verificar
    await adminDb.listCollections();
    // toca Auth (ping simple)
    await adminAuth.listUsers(1);
    // Storage (no siempre responde algo útil sin listar)
    const bucket = process.env.PUBLIC_FIREBASE_STORAGE_BUCKET;

    return new Response(JSON.stringify({ ok: true, bucket }), { status: 200 });
  } catch (e: any) {
    console.error('[admin-health] ERROR:', e);
    return new Response(JSON.stringify({ ok: false, error: e?.message }), { status: 500 });
  }
};
