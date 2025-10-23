import type { User } from '../logic/models.js';

export async function getUserById(id: string): Promise<User | null> {
    if (id === 'demo') return { id: 'demo', email: 'demo@example.com' };
    return null;
}
