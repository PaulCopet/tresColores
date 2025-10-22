// Example Services Layer
import { getUserById } from '../data/repositories.js';
import { z } from 'zod';

export const GetUserSchema = z.object({ id: z.string().min(1) });

export async function getUserService(input: unknown) {
    const { id } = GetUserSchema.parse(input);
    const user = await getUserById(id);
    return user;
}
