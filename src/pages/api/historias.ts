// src/pages/api/historias.ts
import type { APIRoute } from 'astro';
import { getAllEventsService } from '../../backend/logic/services';

console.log('API Layer: /api/historias cargado');

/**
 * GET /api/historias
 * Obtiene todos los eventos históricos
 * Sigue arquitectura: API Layer → Logic Layer → Data Layer
 */
export const GET: APIRoute = async () => {
  console.log('API Layer: GET /api/historias - Solicitud recibida');

  try {
    console.log('API Layer: Llamando a Logic Layer (getAllEventsService)');
    const result = await getAllEventsService();

    const status = result.success ? 200 : 500;

    console.log(`API Layer: Respondiendo con status ${status}, ${result.success ? result.data?.length : 0} eventos`);
    return new Response(
      JSON.stringify(result),
      {
        headers: { 'content-type': 'application/json' },
        status
      }
    );
  } catch (e: any) {
    console.error('API Layer: Error en GET /api/historias:', e);
    return new Response(
      JSON.stringify({
        success: false,
        error: e?.message || 'Error interno del servidor'
      }),
      {
        headers: { 'content-type': 'application/json' },
        status: 500,
      }
    );
  }
};
