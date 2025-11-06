import type { APIRoute } from 'astro';
import { adminAuth, adminDb } from '../../../lib/firebase.admin';

async function requireAdmin(cookies: any) {
  const session = cookies.get('session')?.value;
  if (!session) return null;
  const decoded = await adminAuth.verifySessionCookie(session, true);
  if ((decoded as any).role !== 'admin') return null;
  return decoded;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const adminUser = await requireAdmin(cookies);
  if (!adminUser) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const body = await request.json();
  const { email, role } = body as { email: string; role: 'admin'|'usuario' };
  if (!email || !role) return new Response(JSON.stringify({ error: 'Missing email/role' }), { status: 400 });

  const u = await adminAuth.getUserByEmail(email);
  await adminAuth.setCustomUserClaims(u.uid, { role });
  await adminDb.collection('users').doc(u.uid).set({ role, updatedAt: new Date() }, { merge: true });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
