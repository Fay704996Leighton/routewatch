/**
 * Throttled poller: wraps the base poller with concurrency limiting
 * so large endpoint lists don't fire all requests simultaneously.
 */

import { EndpointConfig } from "../config/schema";
import { PollResult } from "./types";
import { createThrottle, ThrottleOptions } from "./throttle";
import { pollEndpoint } from "./poller";

export interface ThrottledPollOptions {
  throttle?: Partial<ThrottleOptions>;
  timeoutMs?: number;
}

export async function pollEndpointsThrottled(
  endpoints: EndpointConfig[],
  options: ThrottledPollOptions = {}
): Promise<PollResult[]> {
  const maxConcurrent = options.throttle?.maxConcurrent ?? 5;
  const delayMs = options.throttle?.delayMs ?? 0;
  const timeoutMs = options.timeoutMs ?? 10_000;

  const throttle = createThrottle({ maxConcurrent, delayMs });

  const tasks = endpoints.map((endpoint) =>
    throttle.run(() => pollEndpoint(endpoint, timeoutMs))
  );

  const results = await Promise.allSettled(tasks);

  return results.map((result, i) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    // Return a failed PollResult if the throttled task itself threw
    return {
      endpoint: endpoints[i],
      status: "error" as const,
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      durationMs: 0,
      timestamp: new Date().toISOString(),
    };
  });
}
