import { createCircuitBreaker } from "./circuit-breaker";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

describe("createCircuitBreaker", () => {
  it("starts in closed state and allows requests", () => {
    const cb = createCircuitBreaker({ failureThreshold: 3, recoveryTimeMs: 1000 });
    expect(cb.state()).toBe("closed");
    expect(cb.isAllowed()).toBe(true);
  });

  it("opens after reaching failure threshold", () => {
    const cb = createCircuitBreaker({ failureThreshold: 3, recoveryTimeMs: 1000 });
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.state()).toBe("closed");
    cb.recordFailure();
    expect(cb.state()).toBe("open");
    expect(cb.isAllowed()).toBe(false);
  });

  it("transitions to half-open after recovery time", async () => {
    const cb = createCircuitBreaker({ failureThreshold: 2, recoveryTimeMs: 50 });
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.state()).toBe("open");
    await sleep(60);
    expect(cb.state()).toBe("half-open");
    expect(cb.isAllowed()).toBe(true);
  });

  it("closes on success from half-open", async () => {
    const cb = createCircuitBreaker({ failureThreshold: 2, recoveryTimeMs: 50 });
    cb.recordFailure();
    cb.recordFailure();
    await sleep(60);
    expect(cb.state()).toBe("half-open");
    cb.recordSuccess();
    expect(cb.state()).toBe("closed");
  });

  it("reset clears all state", () => {
    const cb = createCircuitBreaker({ failureThreshold: 2, recoveryTimeMs: 1000 });
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.state()).toBe("open");
    cb.reset();
    expect(cb.state()).toBe("closed");
    expect(cb.isAllowed()).toBe(true);
  });

  it("recordSuccess resets failure count before threshold", () => {
    const cb = createCircuitBreaker({ failureThreshold: 3, recoveryTimeMs: 1000 });
    cb.recordFailure();
    cb.recordFailure();
    cb.recordSuccess();
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.state()).toBe("closed");
  });
});
