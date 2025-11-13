import type { APIRoute } from 'astro';
import { getEventByIdService, updateEventService, deleteEventService } from '../../../backend/logic/services';

export const prerender = false;

console.log('API Layer: /api/events/[id] cargado');

/**
 * GET /api/events/[id]
 * Obtiene un evento por ID
 */
export const GET: APIRoute = async ({ params }) => {
  console.log('API Layer: GET /api/events/[id] - Solicitud recibida');
  const id = params.id!;

  try {
    const result = await getEventByIdService({ id });
    const status = result.success ? 200 : 404;
    console.log(`API Layer: Respondiendo con status ${status}`);
    return new Response(JSON.stringify(result), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API Layer: Error en GET /api/events/[id]:', error);
    return new Response(JSON.stringify({ success: false, error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * PUT /api/events/[id]
 * Actualiza un evento existente
 */
export const PUT: APIRoute = async ({ params, request }) => {
  console.log('API Layer: PUT /api/events/[id] - Solicitud recibida');
  const id = params.id!;

  try {
    const body = await request.json();
    console.log('API Layer: Body parseado, enviando a Logic Layer');

    const result = await updateEventService({ id, ...body });
    const status = result.success ? 200 : 400;

    console.log(`API Layer: Respondiendo con status ${status}`);
    return new Response(JSON.stringify(result), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API Layer: Error en PUT /api/events/[id]:', error);
    return new Response(JSON.stringify({ success: false, error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * DELETE /api/events/[id]
 * Elimina un evento
 */
export const DELETE: APIRoute = async ({ params }) => {
  console.log('API Layer: DELETE /api/events/[id] - Solicitud recibida');
  const id = params.id!;

  try {
    const result = await deleteEventService({ id });
    const status = result.success ? 200 : 404;

    console.log(`API Layer: Respondiendo con status ${status}`);
    return new Response(JSON.stringify(result), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API Layer: Error en DELETE /api/events/[id]:', error);
    return new Response(JSON.stringify({ success: false, error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
