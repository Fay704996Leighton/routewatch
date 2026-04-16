export interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimiterState {
  count: number;
  windowStart: number;
}

export interface RateLimiter {
  acquire: () => Promise<void>;
  reset: () => void;
  stats: () => { count: number; remaining: number; windowMs: number };
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { maxRequests, windowMs } = options;
  let state: RateLimiterState = { count: 0, windowStart: Date.now() };

  function resetIfExpired(): void {
    const now = Date.now();
    if (now - state.windowStart >= windowMs) {
      state = { count: 0, windowStart: now };
    }
  }

  async function acquire(): Promise<void> {
    resetIfExpired();
    if (state.count < maxRequests) {
      state.count++;
      return;
    }
    const elapsed = Date.now() - state.windowStart;
    const waitMs = windowMs - elapsed;
    await new Promise<void>((resolve) => setTimeout(resolve, waitMs > 0 ? waitMs : 0));
    state = { count: 1, windowStart: Date.now() };
  }

  function reset(): void {
    state = { count: 0, windowStart: Date.now() };
  }

  function stats() {
    resetIfExpired();
    return { count: state.count, remaining: maxRequests - state.count, windowMs };
  }

  return { acquire, reset, stats };
}
