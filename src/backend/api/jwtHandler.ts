import { adminAuth } from '../data/firebaseAdmin.js';

console.log('API Layer: JWTHandler cargado');

export type DecodedUser = {
    uid: string;
    email?: string;
    [k: string]: unknown;
};

export async function verifyBearerToken(authHeader?: string): Promise<DecodedUser | null> {
    if (!authHeader) {
        console.log('API Layer: JWTHandler - No se proporciono token de autenticacion');
        return null;
    }
    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
        console.log('API Layer: JWTHandler - Formato de token invalido');
        return null;
    }
    try {
        console.log('API Layer: JWTHandler validando token con Firebase Authentication');
        const decoded = await adminAuth.verifyIdToken(token);
        console.log('API Layer: JWTHandler - Token validado correctamente con Firebase Auth');
        const { uid, email, ...rest } = decoded as Record<string, unknown> & { uid: string; email?: string };
        return { uid, email, ...rest } as unknown as DecodedUser;
    } catch {
        console.log('API Layer: JWTHandler - Token invalido o expirado');
        return null;
    }
}
