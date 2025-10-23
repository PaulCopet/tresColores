import { getUserById } from '../data/repositories.js';
// importamos zod que nos sirve para validaciones
import { z } from 'zod';

console.log('Logic Layer: Services cargado');

export const GetUserSchema = z.object({ id: z.string().min(1) });

export async function getUserService(input: unknown) {
    console.log('Logic Layer: Services - Validando input con ValidatorService');
    const { id } = GetUserSchema.parse(input);
    console.log('Logic Layer: Services - Input validado correctamente');
    console.log('Logic Layer: Services llamando a Repositories');
    const user = await getUserById(id);
    console.log('Logic Layer: Services - Datos obtenidos de Repositories');
    return user;
}
