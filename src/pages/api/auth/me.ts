import type { APIRoute } from 'astro';
import { adminAuth } from '../../../lib/firebase.admin';

export const GET: APIRoute = async ({ cookies }) => {
  const session = cookies.get('session')?.value;
  if (!session) return new Response(JSON.stringify({}), { status: 200 });
  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    return new Response(JSON.stringify({ uid: decoded.uid, claims: decoded }), { status: 200 });
  } catch {
    return new Response(JSON.stringify({}), { status: 200 });
  }
};
