import 'dotenv/config';

const viteEnv: Record<string, string | undefined> | undefined =
  typeof import.meta !== 'undefined' && (import.meta as any) && typeof (import.meta as any).env === 'object'
    ? (import.meta as any).env
    : undefined;

export function env(name: string): string | undefined {
  // Vite expone variables en import.meta.env durante dev/build;
  // Node en process.env. Probamos ambas.
  const fromProcess = process.env?.[name];
  if (fromProcess !== undefined) return fromProcess;

  if (viteEnv && Object.prototype.hasOwnProperty.call(viteEnv, name)) {
    return viteEnv[name];
  }

  return undefined;
}
