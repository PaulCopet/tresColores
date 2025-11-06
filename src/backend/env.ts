import 'dotenv/config';

export function env(name: string): string | undefined {
  // Vite expone variables en import.meta.env durante dev/build;
  // Node en process.env. Probamos ambas.
  const viteEnv = (import.meta as any)?.env?.[name];
  return process.env[name] ?? viteEnv;
}
