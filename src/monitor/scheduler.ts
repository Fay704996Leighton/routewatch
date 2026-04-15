import { RouteConfig } from '../config/schema';
import { pollRoutes, PollerOptions } from './poller';
import { PollResult } from './types';

export type SchedulerCallback = (results: PollResult[]) => Promise<void> | void;

export interface SchedulerOptions extends PollerOptions {
  intervalMs: number;
  maxRuns?: number;
}

export interface SchedulerHandle {
  stop: () => void;
  runCount: () => number;
}

export function createScheduler(
  routes: RouteConfig[],
  options: SchedulerOptions,
  onResults: SchedulerCallback
): SchedulerHandle {
  let count = 0;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const { intervalMs, maxRuns, ...pollerOptions } = options;

  const run = async () => {
    if (stopped) return;
    const results = await pollRoutes(routes, pollerOptions);
    count++;
    await onResults(results);

    if (maxRuns !== undefined && count >= maxRuns) {
      stopped = true;
      return;
    }

    if (!stopped) {
      timer = setTimeout(run, intervalMs);
    }
  };

  timer = setTimeout(run, 0);

  return {
    stop: () => {
      stopped = true;
      if (timer !== null) clearTimeout(timer);
    },
    runCount: () => count,
  };
}
