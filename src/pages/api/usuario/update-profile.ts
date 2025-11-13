import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.text();
        console.log('📥 Raw body:', body);

        if (!body) {
            console.error('❌ Empty body');
            return new Response(JSON.stringify({ error: 'Empty request body' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { uid, displayName, avatarNumber } = JSON.parse(body);

        console.log('📝 Update profile request:', { uid, displayName, avatarNumber });

        if (!uid) {
            console.error('❌ Missing uid');
            return new Response('Missing uid', { status: 400 });
        }

        const updateData: { nombre?: string; avatarNumber?: number } = {};
        if (typeof displayName === 'string') {
            updateData.nombre = displayName;
        }
        if (typeof avatarNumber === 'number' && avatarNumber >= 1 && avatarNumber <= 5) {
            updateData.avatarNumber = avatarNumber;
        }

        console.log('📦 Update data:', updateData);

        if (Object.keys(updateData).length === 0) {
            console.error('❌ No data to update');
            return new Response('No data to update', { status: 400 });
        }

        // Como no tenemos credenciales de Admin, devolvemos OK
        // La actualización se hará desde el cliente con Client SDK
        console.log('✅ Validation successful, update will be handled by client');
        return new Response(JSON.stringify({ ok: true, updateData }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        console.error('❌ Error updating profile:', error);
        return new Response(JSON.stringify({
            error: 'Error updating profile',
            message: error?.message || 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
