import type { APIRoute } from 'astro';
import { adminAuth, adminDb } from '../../../lib/firebase.admin';

async function requireAdmin(cookies: any) {
  const session = cookies.get('session')?.value;
  if (!session) return null;
  const decoded = await adminAuth.verifySessionCookie(session, true);
  if ((decoded as any).role !== 'admin') return null;
  return decoded;
}

export const GET: APIRoute = async ({ params }) => {
  const id = params.id!;
  const snap = await adminDb.collection('events').doc(id).get();
  if (!snap.exists) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  return new Response(JSON.stringify({ id, ...snap.data() }), { status: 200 });
};

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const adminUser = await requireAdmin(cookies);
  if (!adminUser) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  const id = params.id!;
  const body = await request.json();
  await adminDb.collection('events').doc(id).set({ ...body, updatedAt: new Date() }, { merge: true });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const adminUser = await requireAdmin(cookies);
  if (!adminUser) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  const id = params.id!;
  await adminDb.collection('events').doc(id).delete();
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
