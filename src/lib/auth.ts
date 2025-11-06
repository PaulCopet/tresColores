import { auth } from './firebase.client';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';

export async function loginEmailPassword(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await cred.user.getIdToken(true);
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  }).catch(() => {});
  return cred.user;
}

export async function signupEmailPassword(email: string, password: string, displayName?: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const token = await cred.user.getIdToken(true);
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token })
  }).catch(() => {});

  await fetch('/api/users/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName, role: 'usuario' })
  }).catch(() => {});

  return cred.user;
}

export async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  } finally {
    await signOut(auth);
  }
}
