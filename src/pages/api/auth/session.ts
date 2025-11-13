import type { APIRoute } from 'astro';
import { adminAuth } from '../../../backend/firebase-admin';
import { env } from '../../../backend/env';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { idToken } = await request.json();
    if (!idToken) return new Response(JSON.stringify({ error: 'Missing idToken' }), { status: 400 });

    const decoded = await adminAuth.verifyIdToken(idToken, true);

    // Determinar el rol basado en la lista de emails admin
    const adminEmails = (env('ADMIN_EMAILS') || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    console.log('Admin emails:', adminEmails);
    console.log('User email:', decoded.email);
    const isAdmin = adminEmails.includes(decoded.email?.toLowerCase() || '');
    const role = isAdmin ? 'admin' : 'usuario';
    console.log('Determined role:', role, 'for user:', decoded.email);

    // Establecer o actualizar el custom claim si es necesario
    const currentRole = (decoded as any).role;
    console.log('Current role in token:', currentRole);
    if (currentRole !== role) {
      console.log('Updating custom claim from', currentRole, 'to', role);
      try {
        await adminAuth.setCustomUserClaims(decoded.uid, { role });
        console.log('Custom claim updated successfully');
      } catch (error) {
        console.warn('No se pudo actualizar custom claims, se continuará con Firestore/ENV:', error);
      }
    } else {
      console.log('Role already correct, no update needed');
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    cookies.set('session', sessionCookie, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn / 1000
    });

    return new Response(JSON.stringify({ ok: true, uid: decoded.uid, role }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'invalid token' }), { status: 401 });
  }
};
