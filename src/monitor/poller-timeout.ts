import { PollResult } from './types';
import { RouteConfig } from '../config/schema';
import { fetchRoute } from './fetcher';
import { createTimeoutController } from './timeout';

export interface PollerTimeoutOptions {
  timeoutMs: number;
}

export async function pollWithTimeout(
  route: RouteConfig,
  options: PollerTimeoutOptions
): Promise<PollResult> {
  const ctrl = createTimeoutController(options.timeoutMs);

  const result = await ctrl.run(() => fetchRoute(route));

  if (result.timedOut) {
    return {
      route,
      status: 'error',
      error: `Request timed out after ${options.timeoutMs}ms`,
      duration: result.elapsed,
      timestamp: new Date().toISOString(),
    };
  }

  return result.value!;
}

export async function pollManyWithTimeout(
  routes: RouteConfig[],
  options: PollerTimeoutOptions
): Promise<PollResult[]> {
  return Promise.all(routes.map((route) => pollWithTimeout(route, options)));
}
