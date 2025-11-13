import type { APIRoute } from 'astro';
import { comentariosService } from '../../../backend/services/comentarios-simple.service';

export const prerender = false;

// GET - Obtener comentarios de un usuario
export const GET: APIRoute = async ({ request, locals }) => {
    try {
        const url = new URL(request.url);
        const usuarioId = url.searchParams.get('usuarioId');

        if (!usuarioId) {
            return new Response(
                JSON.stringify({ success: false, error: 'Usuario ID requerido' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const comentarios = await comentariosService.obtenerComentariosUsuario(usuarioId);

        return new Response(
            JSON.stringify({ success: true, data: comentarios }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Error en GET /api/comentarios/usuario:', error);
        return new Response(
            JSON.stringify({ success: false, error: 'Error al obtener comentarios' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};

// POST - Crear un nuevo comentario
export const POST: APIRoute = async ({ request }) => {
    try {
        let body;
        try {
            body = await request.json();
        } catch (jsonError) {
            console.error('Error parsing JSON:', jsonError);
            return new Response(
                JSON.stringify({ success: false, error: 'JSON inválido' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { eventoId, usuarioId, usuarioNombre, contenido } = body;

        if (!eventoId || !usuarioId || !usuarioNombre || !contenido) {
            return new Response(
                JSON.stringify({ success: false, error: 'Datos incompletos' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const comentarioId = await comentariosService.crearComentario({
            eventoId,
            usuarioId,
            usuarioNombre,
            contenido,
            estado: 'pendiente',
        });

        return new Response(
            JSON.stringify({ success: true, data: { id: comentarioId } }),
            { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Error en POST /api/comentarios/usuario:', error);
        return new Response(
            JSON.stringify({ success: false, error: 'Error al crear comentario' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};

// PUT - Editar un comentario
export const PUT: APIRoute = async ({ request }) => {
    try {
        let body;
        try {
            body = await request.json();
        } catch (jsonError) {
            return new Response(
                JSON.stringify({ success: false, error: 'JSON inválido' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { comentarioId, contenido } = body;

        if (!comentarioId || !contenido) {
            return new Response(
                JSON.stringify({ success: false, error: 'Datos incompletos' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        await comentariosService.editarComentario(comentarioId, contenido);

        return new Response(
            JSON.stringify({ success: true, message: 'Comentario actualizado' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Error en PUT /api/comentarios/usuario:', error);
        return new Response(
            JSON.stringify({ success: false, error: 'Error al editar comentario' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};

// DELETE - Eliminar un comentario
export const DELETE: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const comentarioId = url.searchParams.get('comentarioId');

        if (!comentarioId) {
            return new Response(
                JSON.stringify({ success: false, error: 'Comentario ID requerido' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        await comentariosService.eliminarComentario(comentarioId);

        return new Response(
            JSON.stringify({ success: true, message: 'Comentario eliminado' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Error en DELETE /api/comentarios/usuario:', error);
        return new Response(
            JSON.stringify({ success: false, error: 'Error al eliminar comentario' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
