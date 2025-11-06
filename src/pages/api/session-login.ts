import type { APIRoute } from 'astro';
import { getAdmin } from '../../services/firebase/admin.safe.ts';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { idToken } = await request.json();
    if (!idToken) return new Response(JSON.stringify({ ok:false, error:'Falta idToken' }), { status: 400 });

    const { adminAuth } = getAdmin();
    const expiresIn = 1000 * 60 * 60 * 24 * 14; // 14 días
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const headers = new Headers();
    headers.append('Set-Cookie', [
      `session=${sessionCookie}`,
      `Path=/`,
      `HttpOnly`,
      `Secure`,
      `SameSite=Lax`,
      `Max-Age=${expiresIn/1000}`,
    ].join('; '));

    return new Response(JSON.stringify({ ok:true }), { status: 200, headers });
  } catch (e:any) {
    return new Response(JSON.stringify({ ok:false, error:e?.message }), { status: 500 });
  }
};
