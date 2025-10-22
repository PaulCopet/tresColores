import { z } from 'zod';

export const IdSchema = z.object({ id: z.string().min(1) });

export function validateId(input: unknown) {
  return IdSchema.parse(input);
}
