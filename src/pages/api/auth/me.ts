import type { APIRoute } from 'astro';
import { adminAuth, adminDb } from '../../../backend/firebase-admin';

function normalizeRole(value: unknown): { raw: unknown; normalized: 'admin' | 'usuario' | null } {
  if (value === undefined || value === null) {
    return { raw: value, normalized: null };
  }

  if (typeof value === 'number') {
    return { raw: value, normalized: value === 2 ? 'admin' : 'usuario' };
  }

  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'admin' || lower === '2') return { raw: value, normalized: 'admin' };
    return { raw: value, normalized: 'usuario' };
  }

  return { raw: value, normalized: null };
}

export const GET: APIRoute = async ({ cookies }) => {
  const session = cookies.get('session')?.value;
  if (!session) return new Response(JSON.stringify({}), { status: 200 });
  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    let roleInfo = normalizeRole((decoded as any).role);

    if (!roleInfo.normalized) {
      const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
      if (userSnap.exists) {
        const data = userSnap.data();
        roleInfo = normalizeRole(data?.role ?? data?.rol);
        if (roleInfo.normalized) {
          (decoded as any).role = roleInfo.normalized;
        }
      }
    }

    // Obtener información completa del usuario desde Firebase Auth
    const userRecord = await adminAuth.getUser(decoded.uid);

    return new Response(
      JSON.stringify({
        uid: decoded.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || null,
        photoURL: userRecord.photoURL || null,
        role: roleInfo.normalized,
        claims: { ...decoded, role: roleInfo.normalized ?? (decoded as any).role }
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return new Response(JSON.stringify({}), { status: 200 });
  }
};
