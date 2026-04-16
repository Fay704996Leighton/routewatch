import { createCache } from './cache';

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

describe('createCache', () => {
  it('stores and retrieves a value', () => {
    const cache = createCache<string>();
    cache.set('k', 'hello', 5000);
    expect(cache.get('k')).toBe('hello');
  });

  it('returns undefined for missing key', () => {
    const cache = createCache<string>();
    expect(cache.get('missing')).toBeUndefined();
  });

  it('returns undefined after ttl expires', async () => {
    const cache = createCache<number>();
    cache.set('x', 42, 20);
    await sleep(30);
    expect(cache.get('x')).toBeUndefined();
  });

  it('has() returns false for expired entry', async () => {
    const cache = createCache<number>();
    cache.set('x', 1, 20);
    await sleep(30);
    expect(cache.has('x')).toBe(false);
  });

  it('delete removes entry', () => {
    const cache = createCache<string>();
    cache.set('a', 'val', 5000);
    cache.delete('a');
    expect(cache.get('a')).toBeUndefined();
  });

  it('purgeExpired removes only expired entries', async () => {
    const cache = createCache<string>();
    cache.set('short', 'bye', 20);
    cache.set('long', 'hi', 5000);
    await sleep(30);
    cache.purgeExpired();
    expect(cache.size()).toBe(1);
  });

  it('size() reflects live entries only', async () => {
    const cache = createCache<string>();
    cache.set('a', '1', 20);
    cache.set('b', '2', 5000);
    await sleep(30);
    expect(cache.size()).toBe(1);
  });
});
