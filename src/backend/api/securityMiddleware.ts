import type { APIContext } from 'astro';
import { verifyBearerToken, type DecodedUser } from './jwtHandler.js';

export type HandlerWithUser = (ctx: APIContext, user: DecodedUser | null) => Promise<Response> | Response;

export function secureHandler(handler: HandlerWithUser) {
    return async (ctx: APIContext) => {
        const authHeader = ctx.request.headers.get('authorization') ?? undefined;
        const user = await verifyBearerToken(authHeader);

        return handler(ctx, user);
    };
}
