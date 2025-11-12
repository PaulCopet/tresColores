import type { APIRoute } from 'astro';
import { createEventService } from '../../../backend/logic/services';

console.log('API Layer: /api/eventos/create cargado');

/**
 * POST /api/eventos/create
 * Crea un nuevo evento histórico
 * Sigue arquitectura: API Layer → Logic Layer → Data Layer
 */
export const POST: APIRoute = async ({ request }) => {
    console.log('API Layer: POST /api/eventos/create - Solicitud recibida');

    try {
        const body = await request.json();
        console.log('API Layer: Body parseado, enviando a Logic Layer (Services)');

        // Llamar al servicio de la Logic Layer
        const result = await createEventService(body);

        // Determinar código de estado
        const status = result.success ? 201 : 400;

        console.log(`API Layer: Respondiendo con status ${status}`);
        return new Response(
            JSON.stringify(result),
            {
                status,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        console.error('API Layer: Error en POST /api/eventos/create:', error);
        return new Response(
            JSON.stringify({
                success: false,
                message: 'Error interno del servidor'
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
};
