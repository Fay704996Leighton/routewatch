import { createCache, Cache } from './cache';
import { PollResult } from './types';

const DEFAULT_TTL_MS = 30_000;

export interface ResponseCache {
  get(url: string): PollResult | undefined;
  set(url: string, result: PollResult, ttlMs?: number): void;
  has(url: string): boolean;
  invalidate(url: string): void;
  purge(): void;
  size(): number;
}

export function createResponseCache(): ResponseCache {
  const cache: Cache<PollResult> = createCache<PollResult>();

  function get(url: string): PollResult | undefined {
    return cache.get(url);
  }

  function set(url: string, result: PollResult, ttlMs = DEFAULT_TTL_MS): void {
    cache.set(url, result, ttlMs);
  }

  function has(url: string): boolean {
    return cache.has(url);
  }

  function invalidate(url: string): void {
    cache.delete(url);
  }

  function purge(): void {
    cache.purgeExpired();
  }

  function size(): number {
    return cache.size();
  }

  return { get, set, has, invalidate, purge, size };
}
