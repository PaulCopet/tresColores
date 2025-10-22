import type { APIContext } from 'astro';
import { verifyBearerToken, type DecodedUser } from './jwtHandler.js';

export type HandlerWithUser = (ctx: APIContext, user: DecodedUser | null) => Promise<Response> | Response;

export function secureHandler(handler: HandlerWithUser) {
  return async (ctx: APIContext) => {
    const authHeader = ctx.request.headers.get('authorization') ?? undefined;
    const user = await verifyBearerToken(authHeader);

    // Si deseas forzar autenticación, descomenta este bloque
    // if (!user) {
    //   return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
    //     status: 401,
    //     headers: { 'content-type': 'application/json' },
    //   });
    // }

    return handler(ctx, user);
  };
}
