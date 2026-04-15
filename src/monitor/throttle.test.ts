import { createThrottle } from "./throttle";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeTask(durationMs: number, log: number[]): () => Promise<number> {
  return async () => {
    log.push(Date.now());
    await delay(durationMs);
    return durationMs;
  };
}

describe("createThrottle", () => {
  it("runs tasks and returns results", async () => {
    const throttle = createThrottle({ maxConcurrent: 2 });
    const results = await Promise.all([
      throttle.run(async () => 1),
      throttle.run(async () => 2),
      throttle.run(async () => 3),
    ]);
    expect(results).toEqual([1, 2, 3]);
  });

  it("limits concurrency to maxConcurrent", async () => {
    const throttle = createThrottle({ maxConcurrent: 2 });
    let concurrent = 0;
    let maxSeen = 0;

    const task = async () => {
      concurrent++;
      maxSeen = Math.max(maxSeen, concurrent);
      await delay(20);
      concurrent--;
    };

    await Promise.all([task, task, task, task].map(() => throttle.run(task)));
    expect(maxSeen).toBeLessThanOrEqual(2);
  });

  it("tracks stats correctly", async () => {
    const throttle = createThrottle({ maxConcurrent: 1 });
    const p1 = throttle.run(() => delay(30).then(() => "a"));
    const p2 = throttle.run(() => delay(10).then(() => "b"));

    // p1 should be running, p2 queued
    expect(throttle.stats().running).toBe(1);
    expect(throttle.stats().queued).toBe(1);

    await Promise.all([p1, p2]);
    expect(throttle.stats().completed).toBe(2);
    expect(throttle.stats().running).toBe(0);
    expect(throttle.stats().queued).toBe(0);
  });

  it("propagates task errors without blocking queue", async () => {
    const throttle = createThrottle({ maxConcurrent: 1 });
    const failingTask = () => Promise.reject(new Error("task failed"));
    const successTask = () => Promise.resolve(42);

    await expect(throttle.run(failingTask)).rejects.toThrow("task failed");
    const result = await throttle.run(successTask);
    expect(result).toBe(42);
    expect(throttle.stats().completed).toBe(2);
  });

  it("handles maxConcurrent of 1 sequentially", async () => {
    const throttle = createThrottle({ maxConcurrent: 1 });
    const order: number[] = [];
    await Promise.all([
      throttle.run(async () => { order.push(1); }),
      throttle.run(async () => { order.push(2); }),
      throttle.run(async () => { order.push(3); }),
    ]);
    expect(order).toEqual([1, 2, 3]);
  });
});
