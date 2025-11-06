import type { APIRoute } from 'astro';
import { adminAuth, adminDb } from '../../../lib/firebase.admin';

async function getUserFromCookie(cookies: any) {
  const session = cookies.get('session')?.value;
  if (!session) return null;
  try {
    return await adminAuth.verifySessionCookie(session, true);
  } catch {
    return null;
  }
}

export const GET: APIRoute = async ({ url }) => {
  const city = url.searchParams.get('city');
  const published = url.searchParams.get('published') ?? 'true';
  const limitRaw = url.searchParams.get('limit') ?? '50';

  let ref: FirebaseFirestore.Query = adminDb.collection('events').orderBy('date', 'desc');
  if (city) ref = ref.where('city', '==', city);
  if (published !== 'all') ref = ref.where('published', '==', published === 'true');

  const snap = await ref.limit(parseInt(limitRaw)).get();
  const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return new Response(JSON.stringify({ data }), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getUserFromCookie(cookies);
  if (!user || (user as any).role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }
  const payload = await request.json();
  const { id } = payload;
  if (!id) return new Response(JSON.stringify({ error: 'Missing event id' }), { status: 400 });

  await adminDb.collection('events').doc(id).set({ ...payload, updatedAt: new Date() }, { merge: true });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
