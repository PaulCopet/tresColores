import type { APIRoute } from 'astro';

export const POST: APIRoute = async () => {
  const headers = new Headers();
  headers.append('Set-Cookie', `session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return new Response(JSON.stringify({ ok:true }), { status: 200, headers });
};
