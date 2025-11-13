import { atom } from 'nanostores';
import type { User as FirebaseUser } from 'firebase/auth';

// Extiende el tipo User para incluir displayName y photoURL
export type User = {
    uid: string;
    email: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    role?: 'admin' | 'user';
} | null;


export const isUserLoading = atom<boolean>(true);
export const user = atom<User>(null);

export function setUser(firebaseUser: FirebaseUser | null) {
    if (firebaseUser) {
        // Aquí asumimos que el rol vendrá de los custom claims más adelante
        user.set({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
        });
    } else {
        user.set(null);
    }
    isUserLoading.set(false);
}

