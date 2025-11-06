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

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getUserFromCookie(cookies);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const body = await request.json();
  const role = 'usuario';
  await adminDb.collection('users').doc(user.uid).set({
    uid: user.uid,
    email: (user as any).email || user.email,
    displayName: body.displayName || null,
    role,
    updatedAt: new Date()
  }, { merge: true });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
