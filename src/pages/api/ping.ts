import type { APIContext } from 'astro';
import { secureHandler } from '../../backend/api/securityMiddleware.js';
import type { DecodedUser } from '../../backend/api/jwtHandler.js';

// Simple endpoint to validate chain: SecurityMiddleware -> Service -> Repo
export const GET = secureHandler(async (ctx: APIContext, user: DecodedUser | null) => {
  return new Response(
    JSON.stringify({ ok: true, uid: user?.uid ?? null, message: 'pong' }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
});
