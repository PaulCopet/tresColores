import type { APIRoute } from 'astro';
import { comentariosService } from '../../../backend/services/comentarios-simple.service';

export const prerender = false;

/**
 * GET /api/comentarios/evento?eventoId=xxx
 * Obtiene todos los comentarios APROBADOS de un evento específico
 */
export const GET: APIRoute = async ({ url }) => {
    try {
        const eventoId = url.searchParams.get('eventoId');

        if (!eventoId) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'eventoId es requerido',
                }),
                { status: 400 }
            );
        }

        const comentarios = await comentariosService.obtenerComentariosEvento(eventoId);

        return new Response(
            JSON.stringify({
                success: true,
                data: comentarios,
            }),
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error en GET /api/comentarios/evento:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error?.message || 'Error al obtener comentarios',
            }),
            { status: 500 }
        );
    }
};
