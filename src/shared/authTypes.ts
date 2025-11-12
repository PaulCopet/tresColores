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
    nombre: string;
    correo: string;
    rol: string;
    tokens?: AuthTokens;
};
