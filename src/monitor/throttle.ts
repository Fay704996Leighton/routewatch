/**
 * Throttle utility for rate-limiting concurrent endpoint polls.
 * Ensures we don't overwhelm monitored services with simultaneous requests.
 */

export interface ThrottleOptions {
  maxConcurrent: number;
  delayMs?: number;
}

export interface ThrottleStats {
  queued: number;
  running: number;
  completed: number;
}

export function createThrottle(options: ThrottleOptions) {
  const { maxConcurrent, delayMs = 0 } = options;
  let running = 0;
  let completed = 0;
  const queue: Array<() => void> = [];

  function next() {
    if (queue.length === 0 || running >= maxConcurrent) return;
    const resolve = queue.shift()!;
    running++;
    if (delayMs > 0) {
      setTimeout(resolve, delayMs);
    } else {
      resolve();
    }
  }

  async function run<T>(task: () => Promise<T>): Promise<T> {
    await new Promise<void>((resolve) => {
      queue.push(resolve);
      next();
    });

    try {
      return await task();
    } finally {
      running--;
      completed++;
      next();
    }
  }

  function stats(): ThrottleStats {
    return { queued: queue.length, running, completed };
  }

  return { run, stats };
}

export type Throttle = ReturnType<typeof createThrottle>;
