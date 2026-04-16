export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface Cache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T, ttlMs: number): void;
  has(key: string): boolean;
  delete(key: string): void;
  purgeExpired(): void;
  size(): number;
}

export function createCache<T>(): Cache<T> {
  const store = new Map<string, CacheEntry<T>>();

  function get(key: string): T | undefined {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  function set(key: string, value: T, ttlMs: number): void {
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  function has(key: string): boolean {
    return get(key) !== undefined;
  }

  function del(key: string): void {
    store.delete(key);
  }

  function purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.expiresAt) store.delete(key);
    }
  }

  function size(): number {
    purgeExpired();
    return store.size;
  }

  return { get, set, has, delete: del, purgeExpired, size };
}
