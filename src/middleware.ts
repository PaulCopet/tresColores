import { defineMiddleware } from 'astro/middleware';

export const onRequest = defineMiddleware(async (ctx, next) => {
  // Cookie de sesión (puede no existir)
  const session = ctx.cookies.get('session')?.value;

  // Estos dos los llenaremos si logramos cargar admin
  let decoded: any = null;
  let role = 'usuario';

  if (session) {
    try {
      // 👇 Lazy-import para que si falla admin NO se caiga el middleware entero
      const { getAdmin } = await import('./services/firebase/admin.safe');
      const { adminAuth } = getAdmin();

      // withRevocationCheck=true
      decoded = await adminAuth.verifySessionCookie(session, true);
      role = decoded?.role || decoded?.token?.role || 'usuario';
      (ctx.locals as any).user = decoded;
      (ctx.locals as any).role = role;
    } catch (e) {
      console.error('[middleware] no se pudo verificar la cookie de sesión:', e);
      // si la cookie es inválida, mejor la borramos
      ctx.cookies.delete('session', { path: '/' });
    }
  }

  // Protección de /admin
  if (ctx.url.pathname.startsWith('/admin')) {
    if (role !== 'admin') {
      return ctx.redirect('/login');
    }
  }

  return next();
});
