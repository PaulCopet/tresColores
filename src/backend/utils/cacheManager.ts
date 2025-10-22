import { LRUCache } from 'lru-cache';

const options = {
  max: 100,
  ttl: 1000 * 60, // 1 min
};

type CacheValue = Record<string, unknown> | string | number | boolean;
const cache = new LRUCache<string, CacheValue>(options as any);

export const cacheManager = {
  get<T = unknown>(key: string) {
    return cache.get(key) as T | undefined;
  },
  set(key: string, value: CacheValue, ttlMs?: number) {
    cache.set(key, value as any, { ttl: ttlMs });
  },
  del(key: string) {
    cache.delete(key);
  },
};
