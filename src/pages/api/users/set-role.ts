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

async function requireAdmin(cookies: any) {
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

export const POST: APIRoute = async ({ request, cookies }) => {
  const adminUser = await requireAdmin(cookies);
  if (!adminUser) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const body = await request.json();
  const { email, role } = body as { email: string; role: 'admin' | 'usuario' };
  if (!email || !role) return new Response(JSON.stringify({ error: 'Missing email/role' }), { status: 400 });

  const u = await adminAuth.getUserByEmail(email);
  // Guardar el rol tanto en claims (mejor esfuerzo) como en Firestore
  try {
    await adminAuth.setCustomUserClaims(u.uid, { role });
  } catch (error) {
    console.warn('No se pudo actualizar custom claims, usando Firestore:', error);
  }
  await adminDb.collection('users').doc(u.uid).set({ role, updatedAt: new Date() }, { merge: true });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
