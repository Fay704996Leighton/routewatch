import { withRetry, RetryExhaustedError } from "./retry";

const immediate: RetryOptions = { attempts: 3, delayMs: 0 };

import { RetryOptions } from "./retry";

describe("withRetry", () => {
  it("resolves immediately on first success", async () => {
    const fn = jest.fn().mockResolvedValue("ok");
    const result = await withRetry(fn, immediate);
    expect(result.value).toBe("ok");
    expect(result.attemptsTaken).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and succeeds", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("recovered");

    const result = await withRetry(fn, immediate);
    expect(result.value).toBe("recovered");
    expect(result.attemptsTaken).toBe(3);
  });

  it("throws RetryExhaustedError after all attempts fail", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("always fails"));
    await expect(withRetry(fn, immediate)).rejects.toBeInstanceOf(
      RetryExhaustedError
    );
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("exposes lastError and attempts on RetryExhaustedError", async () => {
    const cause = new Error("root cause");
    const fn = jest.fn().mockRejectedValue(cause);
    try {
      await withRetry(fn, { attempts: 2, delayMs: 0 });
      fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(RetryExhaustedError);
      const retryErr = err as RetryExhaustedError;
      expect(retryErr.lastError).toBe(cause);
      expect(retryErr.attempts).toBe(2);
    }
  });

  it("throws RangeError when attempts < 1", async () => {
    await expect(
      withRetry(() => Promise.resolve("x"), { attempts: 0, delayMs: 0 })
    ).rejects.toBeInstanceOf(RangeError);
  });

  it("applies backoff multiplier", async () => {
    const delays: number[] = [];
    const sleepSpy = jest
      .spyOn(global, "setTimeout")
      .mockImplementation((fn: any, ms?: number) => {
        delays.push(ms ?? 0);
        fn();
        return 0 as any;
      });

    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("e"))
      .mockRejectedValueOnce(new Error("e"))
      .mockResolvedValue("done");

    await withRetry(fn, { attempts: 3, delayMs: 100, backoff: true });
    expect(delays[0]).toBe(100);
    expect(delays[1]).toBe(200);
    sleepSpy.mockRestore();
  });
});
