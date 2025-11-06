import { LRUCache } from 'lru-cache';

console.log('Utility Layer: CacheManager inicializado');

const options = {
    max: 100,
    ttl: 1000 * 60, // 1 min
};

type CacheValue = Record<string, unknown> | string | number | boolean;
const cache = new LRUCache<string, CacheValue>(options as any);

export const cacheManager = {
    get<T = unknown>(key: string) {
        console.log('Utility Layer: CacheManager obteniendo valor con clave:', key);
        return cache.get(key) as T | undefined;
    },
    set(key: string, value: CacheValue, ttlMs?: number) {
        console.log('Utility Layer: CacheManager guardando valor con clave:', key);
        cache.set(key, value as any, { ttl: ttlMs });
    },
    del(key: string) {
        console.log('Utility Layer: CacheManager eliminando valor con clave:', key);
        cache.delete(key);
    },
};
