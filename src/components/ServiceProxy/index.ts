// Service Proxy: client-side helper to call API endpoints
console.log('Frontend: ServiceProxy cargado');

export async function apiGet<T = unknown>(path: string, token?: string): Promise<T> {
    console.log('Frontend: ServiceProxy realizando peticion HTTP a:', path);
    console.log('Frontend: ServiceProxy conectando con API Gateway del Backend');
    const res = await fetch(path, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) {
        console.log('Frontend: ServiceProxy - Error en peticion HTTP:', res.status);
        throw new Error(`HTTP ${res.status}`);
    }
    console.log('Frontend: ServiceProxy - Respuesta recibida correctamente del Backend');
    return (await res.json()) as T;
}