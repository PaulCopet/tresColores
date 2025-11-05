import type { APIRoute } from 'astro';
import historiaData from '../../data/historias-colombia.json';

export const GET: APIRoute = async () => {
    return new Response(JSON.stringify({
        success: true,
        data: historiaData.historias
    }), {
        headers: {
            'Content-Type': 'application/json'
        }
    });
}