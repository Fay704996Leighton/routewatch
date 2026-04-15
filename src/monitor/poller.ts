import { RouteConfig } from '../config/schema';
import { fetchEndpoint } from './fetcher';
import { PollResult } from './types';

export interface PollerOptions {
  concurrency?: number;
  timeoutMs?: number;
}

const DEFAULT_CONCURRENCY = 5;
const DEFAULT_TIMEOUT_MS = 10000;

async function pollSingle(
  route: RouteConfig,
  timeoutMs: number
): Promise<PollResult> {
  return fetchEndpoint(route, timeoutMs);
}

export async function pollRoutes(
  routes: RouteConfig[],
  options: PollerOptions = {}
): Promise<PollResult[]> {
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const results: PollResult[] = [];

  for (let i = 0; i < routes.length; i += concurrency) {
    const batch = routes.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((route) => pollSingle(route, timeoutMs))
    );
    results.push(...batchResults);
  }

  return results;
}

export async function pollWithRetry(
  route: RouteConfig,
  retries: number,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<PollResult> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchEndpoint(route, timeoutMs);
    } catch (err) {
      lastError = err as Error;
    }
  }
  throw lastError;
}
