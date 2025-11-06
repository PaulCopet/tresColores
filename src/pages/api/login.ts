import type { APIRoute } from 'astro';
import { getDb } from '../../backend/firebase/admin';

export const prerender = false;

function env(k:string): string | undefined {
  // @ts-ignore
  const v = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  return process.env[k] ?? (v[k] as string | undefined);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    let body:any;
    try { body = await request.json(); }
    catch {
      return new Response(JSON.stringify({ success:false, message:'Body JSON vacío o inválido' }),
        { status:400, headers:{'content-type':'application/json'}});
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
      let msg = 'Credenciales incorrectas';
      if (code === 'EMAIL_NOT_FOUND') msg = 'Correo no registrado';
      if (code === 'INVALID_PASSWORD') msg = 'Contraseña incorrecta';
      if (code === 'USER_DISABLED') msg = 'Usuario deshabilitado';
      throw new Error(msg);
    }

    const uid = authJson.localId as string;
    const displayName = (authJson.displayName as string | undefined) ?? correo.split('@')[0];

    const db = getDb();
    const ref = db.collection('users').doc(uid);
    const snap = await ref.get();

    // Si no existe el perfil, lo creamos con defaults
    if (!snap.exists) {
      await ref.set({
        uid,
        nombre: displayName,
        correo,
        rol: 'usuario',
        createdAt: new Date()
      }, { merge: true });
    }

    const perfil = (await ref.get()).data() as any;
    const nombre = perfil?.nombre ?? displayName;
    const rol    = perfil?.rol ?? 'usuario';

    return new Response(JSON.stringify({
      success: true,
      usuario: { nombre, correo, rol }
    }), { headers: { 'content-type': 'application/json' } });

  } catch (e:any) {
    return new Response(JSON.stringify({ success:false, message: e?.message || 'No se pudo iniciar sesión' }),
      { status:400, headers:{'content-type':'application/json'}});
  }
};
