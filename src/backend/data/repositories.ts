import type { User } from '../logic/models.js';

// Example repo implementation (swap with Firestore as needed)
export async function getUserById(id: string): Promise<User | null> {
  // Placeholder: in real case, query adminDb.collection('users').doc(id).get()
  if (id === 'demo') return { id: 'demo', email: 'demo@example.com' };
  return null;
}
