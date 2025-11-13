import type { APIRoute } from 'astro';
import { createEventService } from '../../../backend/logic/services';

export const prerender = false;

console.log('API Layer: /api/eventos/create cargado');

/**
 * POST /api/eventos/create
 * Crea un nuevo evento histórico
 * Sigue arquitectura: API Layer → Logic Layer → Data Layer
 */
export const POST: APIRoute = async ({ request }) => {
    console.log('API Layer: POST /api/eventos/create - Solicitud recibida');

    try {
        const bodyText = await request.text();
        console.log('API Layer: Body raw recibido:', bodyText);

        if (!bodyText || bodyText.trim() === '') {
            console.error('API Layer: Body vacío recibido');
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'Datos del formulario vacíos'
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        let body;
        try {
            body = JSON.parse(bodyText);
        } catch (parseError) {
            console.error('API Layer: Error parsing JSON:', parseError);
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'Formato de datos inválido'
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        console.log('API Layer: Body parseado:', JSON.stringify(body, null, 2));

        // Llamar al servicio de la Logic Layer
        const result = await createEventService(body);

        // Determinar código de estado
        const status = result.success ? 201 : 400;

        console.log(`API Layer: Respondiendo con status ${status}`);
        if (!result.success) {
            console.log('API Layer: Error details:', JSON.stringify(result, null, 2));
        }

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
                message: error instanceof Error ? error.message : 'Error interno del servidor'
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
