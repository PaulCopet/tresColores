// Minimal state management placeholder without external deps
type User = { uid: string; email?: string } | null;
type State = { user: User };

const state: State = { user: null };
const listeners = new Set<(s: State) => void>();

export function getState() {
  return state;
}

export function setUser(user: User) {
  state.user = user;
  listeners.forEach((l) => l(state));
}

export function subscribe(fn: (s: State) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
