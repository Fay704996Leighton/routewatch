/**
 * Throttled poller with retry support.
 * Wraps the core poll logic with concurrency throttling and per-request retries.
 */

import { createThrottle } from "./throttle";
import { withRetry, RetryOptions } from "./retry";
import { PollResult } from "./types";
import { pollEndpoint } from "./poller";
import { RouteConfig } from "../config/schema";

export interface ThrottledPollerOptions {
  concurrency: number;
  retry: RetryOptions;
}

const DEFAULT_OPTIONS: ThrottledPollerOptions = {
  concurrency: 5,
  retry: { attempts: 3, delayMs: 200, backoff: true },
};

export async function pollAllThrottled(
  routes: RouteConfig[],
  options: Partial<ThrottledPollerOptions> = {}
): Promise<PollResult[]> {
  const opts: ThrottledPollerOptions = { ...DEFAULT_OPTIONS, ...options };
  const throttle = createThrottle(opts.concurrency);

  const tasks = routes.map((route) =>
    throttle.next(() =>
      withRetry(() => pollEndpoint(route), opts.retry).then(
        (r) => r.value,
        (err): PollResult => ({
          route: route.name,
          url: route.url,
          status: "error",
          error: String(err),
          durationMs: 0,
          timestamp: new Date().toISOString(),
        })
      )
    )
  );

  return Promise.all(tasks);
}
