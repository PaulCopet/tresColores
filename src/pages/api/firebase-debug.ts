import type { APIRoute } from 'astro';
import { app } from '../../backend/firebase-admin';
import { env } from '../../backend/env';

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      ok: true,
      projectId: app?.options?.projectId,
      hasPath: !!env('FIREBASE_SERVICE_ACCOUNT_PATH'),
      hasB64: !!env('FIREBASE_SERVICE_ACCOUNT_BASE64'),
    }),
    { headers: { 'content-type': 'application/json' } }
  );
};
