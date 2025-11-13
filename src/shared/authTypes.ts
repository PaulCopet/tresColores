export type AuthTokens = {
    idToken: string;
    refreshToken?: string;
    expiresIn?: number;
    /**
     * Epoch timestamp (ms) when the access token should be considered expired.
     */
    expiresAt?: number;
};

export type UsuarioSesion = {
    uid: string;
    nombre: string;
    correo: string;
    rol: string;
    avatarNumber?: number;
    tokens?: AuthTokens;
};
