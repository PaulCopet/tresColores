import type { APIContext } from 'astro';
import { verifyBearerToken, type DecodedUser } from './jwtHandler.js';

console.log('API Layer: SecurityMiddleware cargado');

export type HandlerWithUser = (ctx: APIContext, user: DecodedUser | null) => Promise<Response> | Response;

export function secureHandler(handler: HandlerWithUser) {
    console.log('API Layer: SecurityMiddleware procesando solicitud');
    return async (ctx: APIContext) => {
        const authHeader = ctx.request.headers.get('authorization') ?? undefined;
        console.log('API Layer: SecurityMiddleware verificando autenticacion');
        const user = await verifyBearerToken(authHeader);
        console.log('API Layer: SecurityMiddleware pasando solicitud al handler');
        return handler(ctx, user);
    };
}
