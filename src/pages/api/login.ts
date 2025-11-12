import type { APIRoute } from 'astro';
import { env } from '../../backend/env';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    let body: any;
    try { body = await request.json(); }
    catch {
      return new Response(JSON.stringify({ success: false, message: 'Body JSON vacío o inválido' }),
        { status: 400, headers: { 'content-type': 'application/json' } });
    }

    const correo = (body.correo ?? '').toString().trim().toLowerCase();
    const password = body.contraseña ?? body.contrasena ?? body.password;

    if (!/\S+@\S+\.\S+/.test(correo)) throw new Error('Correo inválido');
    if (!password) throw new Error('La contraseña es obligatoria');

    const API_KEY = env('PUBLIC_FIREBASE_API_KEY');
    if (!API_KEY) throw new Error('Falta PUBLIC_FIREBASE_API_KEY');

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: correo, password: String(password), returnSecureToken: true }),
      }
    );

    const text = await res.text();
    const authJson = text ? JSON.parse(text) : {};
    if (!res.ok) {
      const code = authJson?.error?.message;
      console.warn('POST /api/login auth error', { code, correo });
      let msg = 'Credenciales incorrectas';
      if (code === 'EMAIL_NOT_FOUND') msg = 'Correo no registrado';
      if (code === 'INVALID_PASSWORD') msg = 'Contraseña incorrecta';
      if (code === 'USER_DISABLED') msg = 'Usuario deshabilitado';
      if (code === 'INVALID_LOGIN_CREDENTIALS') msg = 'Correo o contraseña incorrectos';
      const error = new Error(msg);
      (error as any).code = code;
      throw error;
    }

    const uid = authJson.localId as string;
    const displayName = (authJson.displayName as string | undefined) ?? correo.split('@')[0];
    const idToken = authJson.idToken as string | undefined;
    const refreshToken = authJson.refreshToken as string | undefined;
    const expiresInRaw = authJson.expiresIn as string | undefined;
    const expiresInSeconds = expiresInRaw ? Number(expiresInRaw) : undefined;
    const expiresAt = expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : undefined;

    // Determinar el rol basado en la lista de emails admin en .env
    const adminEmails = (env('ADMIN_EMAILS') || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isAdmin = adminEmails.includes(correo);
    const rol = isAdmin ? 'admin' : 'usuario';

    return new Response(JSON.stringify({
      success: true,
      usuario: { nombre: displayName, correo, rol },
      tokens: idToken ? {
        idToken,
        refreshToken,
        expiresIn: expiresInSeconds,
        expiresAt
      } : undefined
    }), { headers: { 'content-type': 'application/json' } });

  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, message: e?.message || 'No se pudo iniciar sesión', code: e?.code }),
      { status: 400, headers: { 'content-type': 'application/json' } });
  }
};
