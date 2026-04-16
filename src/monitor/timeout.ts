export interface TimeoutOptions {
  ms: number;
}

export interface TimeoutResult<T> {
  timedOut: boolean;
  value?: T;
  elapsed: number;
}

export async function withTimeout<T>(
  fn: () => Promise<T>,
  options: TimeoutOptions
): Promise<TimeoutResult<T>> {
  const start = Date.now();

  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${options.ms}ms`));
    }, options.ms);
  });

  try {
    const value = await Promise.race([fn(), timeoutPromise]);
    clearTimeout(timer);
    return { timedOut: false, value, elapsed: Date.now() - start };
  } catch (err) {
    clearTimeout(timer);
    const elapsed = Date.now() - start;
    if (err instanceof Error && err.message.includes('timed out')) {
      return { timedOut: true, elapsed };
    }
    throw err;
  }
}

export function createTimeoutController(defaultMs: number) {
  return {
    run<T>(fn: () => Promise<T>, overrideMs?: number): Promise<TimeoutResult<T>> {
      return withTimeout(fn, { ms: overrideMs ?? defaultMs });
    },
    defaultMs,
  };
}
