import type { APIRoute } from 'astro';
import { getAuth } from 'firebase-admin/auth';
import { app } from '../../../backend/firebase-admin';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
    const sessionCookie = cookies.get('session')?.value;
    if (!sessionCookie) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const auth = getAuth(app);
        const decodedCookie = await auth.verifySessionCookie(sessionCookie, true);
        const { uid } = decodedCookie;

        const { newPassword } = await request.json();

        if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
            return new Response('Password must be a string of at least 6 characters', { status: 400 });
        }

        await auth.updateUser(uid, {
            password: newPassword,
        });

        return new Response('Password updated successfully', { status: 200 });
    } catch (error) {
        console.error('Error updating password:', error);
        return new Response('Error updating password', { status: 500 });
    }
};
