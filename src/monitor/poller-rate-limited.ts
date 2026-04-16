import { PollResult } from './types';
import { createRateLimiter, RateLimiterOptions } from './rate-limiter';
import { pollEndpoint } from './poller';
import { RouteConfig } from '../config/schema';

export interface RateLimitedPollerOptions {
  routes: RouteConfig[];
  rateLimiter?: RateLimiterOptions;
  timeoutMs?: number;
}

export async function pollWithRateLimit(
  options: RateLimitedPollerOptions
): Promise<PollResult[]> {
  const limiterOptions: RateLimiterOptions = options.rateLimiter ?? {
    maxRequests: 10,
    windowMs: 1000,
  };
  const limiter = createRateLimiter(limiterOptions);
  const results: PollResult[] = [];

  for (const route of options.routes) {
    await limiter.acquire();
    const result = await pollEndpoint(route, options.timeoutMs);
    results.push(result);
  }

  return results;
}
