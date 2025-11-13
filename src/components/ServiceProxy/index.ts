// Service Proxy: client-side helper to call API endpoints

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    const config: RequestInit = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    const res = await fetch(path, config);
    if (!res.ok) {
        const errorText = await res.text();
        console.error(`HTTP Error: ${res.status} ${res.statusText}`, errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    // Si la respuesta no tiene contenido, devolvemos un objeto vacío
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return res.json() as Promise<T>;
    } else {
        return {} as Promise<T>;
    }
}

export class ServiceProxy {
    static async updateProfile(uid: string, updates: { displayName?: string; avatarNumber?: number }): Promise<void> {
        await apiRequest<void>('/api/usuario/update-profile', {
            method: 'POST',
            body: JSON.stringify({ uid, ...updates }),
        });
    }

    static async updatePassword(uid: string, newPassword: string): Promise<void> {
        await apiRequest<void>('/api/usuario/update-password', {
            method: 'POST',
            body: JSON.stringify({ uid, newPassword }),
        });
    }
}
