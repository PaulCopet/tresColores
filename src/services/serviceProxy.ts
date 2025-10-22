// Service Proxy: client-side helper to call API endpoints
export async function apiGet<T = unknown>(path: string, token?: string): Promise<T> {
    const res = await fetch(path, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
}
