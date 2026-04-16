import { createRateLimiter } from './rate-limiter';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('createRateLimiter', () => {
  it('allows requests up to the max within a window', async () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 1000 });
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();
    expect(limiter.stats().count).toBe(3);
    expect(limiter.stats().remaining).toBe(0);
  });

  it('resets count after window expires', async () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 50 });
    await limiter.acquire();
    await limiter.acquire();
    await delay(60);
    await limiter.acquire();
    expect(limiter.stats().count).toBe(1);
  });

  it('blocks and waits when limit is reached', async () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 80 });
    await limiter.acquire();
    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(60);
  });

  it('reset() clears the counter immediately', async () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 1000 });
    await limiter.acquire();
    await limiter.acquire();
    limiter.reset();
    expect(limiter.stats().count).toBe(0);
    expect(limiter.stats().remaining).toBe(2);
  });

  it('stats returns correct remaining count', async () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 1000 });
    await limiter.acquire();
    await limiter.acquire();
    const s = limiter.stats();
    expect(s.count).toBe(2);
    expect(s.remaining).toBe(3);
    expect(s.windowMs).toBe(1000);
  });
});
