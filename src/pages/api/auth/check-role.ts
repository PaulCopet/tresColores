import type { APIRoute } from 'astro';

/**
 * POST /api/auth/check-role
 * Verifica si un correo está en la lista de ADMIN_EMAILS del .env
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { correo } = body;

    if (!correo) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Correo requerido',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener lista de admins del .env
    const adminEmails = import.meta.env.ADMIN_EMAILS || '';
    const adminList = adminEmails
      .split(',')
      .map((email: string) => email.trim().toLowerCase())
      .filter((email: string) => email.length > 0);

    // Verificar si el correo está en la lista
    const isAdmin = adminList.includes(correo.toLowerCase());
    const rol = isAdmin ? 'admin' : 'usuario';

    return new Response(
      JSON.stringify({
        success: true,
        rol,
        isAdmin,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error en POST /api/auth/check-role:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Error al verificar rol',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
