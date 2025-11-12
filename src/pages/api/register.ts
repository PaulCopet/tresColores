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

    const nombre = (body.nombre ?? '').toString().trim();
    const correo = (body.correo ?? '').toString().trim().toLowerCase();
    const password = body.contraseña ?? body.contrasena ?? body.password;

    if (!nombre) throw new Error('El nombre es obligatorio');
    if (!correo || !/\S+@\S+\.\S+/.test(correo)) throw new Error('Correo inválido');
    if (!password || String(password).length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');

    const API_KEY = env('PUBLIC_FIREBASE_API_KEY');
    if (!API_KEY) throw new Error('Falta PUBLIC_FIREBASE_API_KEY');

    // Crear usuario con Firebase Auth REST API
    const signUpRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: correo,
          password: String(password),
          returnSecureToken: true,
          displayName: nombre
        }),
      }
    );

    const signUpText = await signUpRes.text();
    const signUpJson = signUpText ? JSON.parse(signUpText) : {};

    if (!signUpRes.ok) {
      const code = signUpJson?.error?.message;
      let msg = 'No se pudo registrar';
      if (code === 'EMAIL_EXISTS') msg = 'Este correo ya está registrado';
      throw new Error(msg);
    }

    const uid = signUpJson.localId as string;
    const rol = 'usuario';

    return new Response(JSON.stringify({
      success: true,
      usuario: { uid, nombre, correo, rol }
    }), { headers: { 'content-type': 'application/json' } });

  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, message: e?.message || 'No se pudo registrar' }),
      { status: 400, headers: { 'content-type': 'application/json' } });
  }
};
