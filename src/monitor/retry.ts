/**
 * Retry utility for transient fetch failures.
 * Supports configurable attempts, delay, and exponential backoff.
 */

export interface RetryOptions {
  attempts: number;
  delayMs: number;
  backoff?: boolean;
}

export interface RetryResult<T> {
  value: T;
  attemptsTaken: number;
}

export class RetryExhaustedError extends Error {
  constructor(
    public readonly lastError: unknown,
    public readonly attempts: number
  ) {
    super(`Retry exhausted after ${attempts} attempt(s): ${String(lastError)}`);
    this.name = "RetryExhaustedError";
  }
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<RetryResult<T>> {
  const { attempts, delayMs, backoff = false } = options;

  if (attempts < 1) {
    throw new RangeError("attempts must be >= 1");
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const value = await fn();
      return { value, attemptsTaken: attempt };
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        const wait = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;
        await sleep(wait);
      }
    }
  }

  throw new RetryExhaustedError(lastError, attempts);
}
