import type { APIRoute } from 'astro';
import { adminAuth, adminDb } from '../../../backend/firebase-admin';
import { env } from '../../../backend/env';

function isAdminRole(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'number') return value === 2;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    return normalized === 'admin' || normalized === '2';
  }
  return false;
}

async function getUserFromCookie(cookies: any) {
  const session = cookies.get('session')?.value;
  if (!session) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const tokenRole = (decoded as any).role;
    if (isAdminRole(tokenRole)) {
      (decoded as any).role = 'admin';
      return decoded;
    }

    const email = decoded.email?.toLowerCase();
    if (email) {
      const adminEmails = (env('ADMIN_EMAILS') || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (adminEmails.includes(email)) {
        (decoded as any).role = 'admin';
        return decoded;
      }
    }

    const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
    const userData = userSnap.exists ? userSnap.data() : undefined;
    const storedRole = userData?.role ?? userData?.rol;
    if (isAdminRole(storedRole)) {
      (decoded as any).role = 'admin';
      return decoded;
    }

    return null;
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
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }
  const payload = await request.json();
  const { id } = payload;
  if (!id) return new Response(JSON.stringify({ error: 'Missing event id' }), { status: 400 });

  await adminDb.collection('events').doc(id).set({ ...payload, updatedAt: new Date() }, { merge: true });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
