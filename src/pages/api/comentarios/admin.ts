import type { APIRoute } from 'astro';
import { comentariosService } from '../../../backend/services/comentarios-simple.service';

export const prerender = false;

// GET - Obtener todos los comentarios (solo admin)
export const GET: APIRoute = async ({ request, locals }) => {
    try {
        // TODO: Verificar que el usuario es admin
        const comentarios = await comentariosService.obtenerTodosComentarios();

        return new Response(
            JSON.stringify({ success: true, data: comentarios }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Error en GET /api/comentarios/admin:', error);
        return new Response(
            JSON.stringify({ success: false, error: 'Error al obtener comentarios' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};

// POST - Aprobar o rechazar comentario
export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { comentarioId, accion, moderadorId } = body;

        if (!comentarioId || !accion || !moderadorId) {
            return new Response(
                JSON.stringify({ success: false, error: 'Datos incompletos' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (accion === 'aprobar') {
            await comentariosService.aprobarComentario(comentarioId, moderadorId);
        } else if (accion === 'rechazar') {
            await comentariosService.rechazarComentario(comentarioId, moderadorId);
        } else {
            return new Response(
                JSON.stringify({ success: false, error: 'Acción inválida' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, message: `Comentario ${accion === 'aprobar' ? 'aprobado' : 'rechazado'}` }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Error en POST /api/comentarios/admin:', error);
        return new Response(
            JSON.stringify({ success: false, error: 'Error al moderar comentario' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
