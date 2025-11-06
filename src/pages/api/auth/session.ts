import type { APIRoute } from 'astro';
import { adminAuth } from '../../../lib/firebase.admin';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { idToken } = await request.json();
    if (!idToken) return new Response(JSON.stringify({ error: 'Missing idToken' }), { status: 400 });

    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    cookies.set('session', sessionCookie, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: expiresIn / 1000
    });

    return new Response(JSON.stringify({ ok: true, uid: decoded.uid, role: (decoded as any).role }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'invalid token' }), { status: 401 });
  }
};
