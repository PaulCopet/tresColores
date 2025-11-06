import type { APIRoute } from 'astro';
import { getDb } from '../../services/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // 👇 evita "Unexpected end of JSON input" si llega sin body
    let body: any;
    try { body = await request.json(); }
    catch { 
      return new Response(JSON.stringify({ success:false, message:'Body JSON vacío o inválido' }),
        { status: 400, headers: { 'content-type':'application/json' } });
    }

    const nombre = (body.nombre ?? '').toString().trim();
    const correo = (body.correo ?? '').toString().trim().toLowerCase();
    const password = body.contraseña ?? body.contrasena ?? body.password;

    if (!nombre) throw new Error('El nombre es obligatorio');
    if (!correo || !/\S+@\S+\.\S+/.test(correo)) throw new Error('Correo inválido');
    if (!password || String(password).length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');

    const auth = getAuth();
    try { await auth.getUserByEmail(correo);
      return new Response(JSON.stringify({ success:false, message:'Este correo ya está registrado.' }),
        { status: 400, headers: { 'content-type':'application/json' } });
    } catch {}

    const user = await auth.createUser({ email: correo, password: String(password), displayName: nombre });
    const rol = 'usuario';
    await auth.setCustomUserClaims(user.uid, { rol });

    const db = getDb();
    await db.collection('users').doc(user.uid).set({
      uid: user.uid, nombre, correo, rol, createdAt: new Date()
    }, { merge: true });

    return new Response(JSON.stringify({ success:true, usuario: { nombre, correo, rol } }),
      { headers: { 'content-type':'application/json' } });

  } catch (e:any) {
    return new Response(JSON.stringify({ success:false, message: e?.message || 'No se pudo registrar' }),
      { status: 400, headers: { 'content-type':'application/json' } });
  }
};
