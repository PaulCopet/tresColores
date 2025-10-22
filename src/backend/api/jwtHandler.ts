import { adminAuth } from '../data/firebaseAdmin.js';

export type DecodedUser = {
  uid: string;
  email?: string;
  [k: string]: unknown;
};

export async function verifyBearerToken(authHeader?: string): Promise<DecodedUser | null> {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  try {
  const decoded = await adminAuth.verifyIdToken(token);
  const { uid, email, ...rest } = decoded as Record<string, unknown> & { uid: string; email?: string };
  return { uid, email, ...rest } as unknown as DecodedUser;
  } catch {
    return null;
  }
}
