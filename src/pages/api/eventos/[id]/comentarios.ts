import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, params }) => {
    try {
        const { eventoId, usuarioId, usuarioNombre, contenido } = await request.json();

        if (!eventoId || !usuarioId || !usuarioNombre || !contenido) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Faltan campos requeridos',
                }),
                { status: 400 }
            );
        }

        const nuevoComentario = {
            id: Date.now().toString(),
            eventoId,
            usuarioId,
            usuarioNombre,
            contenido: contenido.trim(),
            fechaCreacion: new Date().toISOString(),
        };

        // TODO: Aquí se debe guardar el comentario en Firebase/Firestore
        // Por ahora solo devolvemos el comentario creado
        console.log('Nuevo comentario:', nuevoComentario);

        return new Response(
            JSON.stringify({
                success: true,
                data: nuevoComentario,
            }),
            { status: 201 }
        );
    } catch (error) {
        console.error('Error al crear comentario:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Error al crear el comentario',
            }),
            { status: 500 }
        );
    }
};

export const GET: APIRoute = async ({ params }) => {
    try {
        const { id: eventoId } = params;

        if (!eventoId) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'ID de evento requerido',
                }),
                { status: 400 }
            );
        }

        // TODO: Aquí se deben obtener los comentarios del evento desde Firebase/Firestore
        // Por ahora devolvemos un array vacío
        const comentarios: any[] = [];

        return new Response(
            JSON.stringify({
                success: true,
                data: comentarios,
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error('Error al obtener comentarios:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Error al obtener los comentarios',
            }),
            { status: 500 }
        );
    }
};
