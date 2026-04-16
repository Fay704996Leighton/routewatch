export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeMs: number;
}

export interface CircuitBreaker {
  state: () => CircuitState;
  recordSuccess: () => void;
  recordFailure: () => void;
  isAllowed: () => boolean;
  reset: () => void;
}

export function createCircuitBreaker(
  options: CircuitBreakerOptions
): CircuitBreaker {
  const { failureThreshold, recoveryTimeMs } = options;
  let failures = 0;
  let currentState: CircuitState = "closed";
  let openedAt: number | null = null;

  function state(): CircuitState {
    if (currentState === "open" && openedAt !== null) {
      if (Date.now() - openedAt >= recoveryTimeMs) {
        currentState = "half-open";
      }
    }
    return currentState;
  }

  function isAllowed(): boolean {
    const s = state();
    return s === "closed" || s === "half-open";
  }

  function recordSuccess(): void {
    failures = 0;
    currentState = "closed";
    openedAt = null;
  }

  function recordFailure(): void {
    failures += 1;
    if (failures >= failureThreshold) {
      currentState = "open";
      openedAt = Date.now();
    }
  }

  function reset(): void {
    failures = 0;
    currentState = "closed";
    openedAt = null;
  }

  return { state, recordSuccess, recordFailure, isAllowed, reset };
}
