import type { User } from '../logic/models.js';

console.log('Data Layer: Repositories cargado');

export async function getUserById(id: string): Promise<User | null> {
    console.log('Data Layer: Repositories consultando usuario con ID:', id);
    console.log('Data Layer: Repositories usando Models para estructura de datos');
    if (id === 'demo') {
        console.log('Data Layer: Repositories - Usuario encontrado');
        return { id: 'demo', email: 'demo@example.com' };
    }
    console.log('Data Layer: Repositories - Usuario no encontrado');
    return null;
}
