import { withTimeout, createTimeoutController } from './timeout';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

describe('withTimeout', () => {
  it('resolves with value when fn completes in time', async () => {
    const result = await withTimeout(() => Promise.resolve(42), { ms: 100 });
    expect(result.timedOut).toBe(false);
    expect(result.value).toBe(42);
    expect(result.elapsed).toBeGreaterThanOrEqual(0);
  });

  it('returns timedOut=true when fn exceeds timeout', async () => {
    const result = await withTimeout(() => delay(200).then(() => 'done'), { ms: 50 });
    expect(result.timedOut).toBe(true);
    expect(result.value).toBeUndefined();
    expect(result.elapsed).toBeGreaterThanOrEqual(50);
  });

  it('propagates non-timeout errors', async () => {
    await expect(
      withTimeout(() => Promise.reject(new Error('boom')), { ms: 100 })
    ).rejects.toThrow('boom');
  });

  it('records elapsed time on success', async () => {
    const result = await withTimeout(async () => {
      await delay(20);
      return 'ok';
    }, { ms: 200 });
    expect(result.elapsed).toBeGreaterThanOrEqual(20);
  });
});

describe('createTimeoutController', () => {
  it('uses default ms', async () => {
    const ctrl = createTimeoutController(100);
    const result = await ctrl.run(() => Promise.resolve('hi'));
    expect(result.timedOut).toBe(false);
    expect(result.value).toBe('hi');
  });

  it('allows override ms', async () => {
    const ctrl = createTimeoutController(500);
    const result = await ctrl.run(() => delay(200).then(() => 'late'), 50);
    expect(result.timedOut).toBe(true);
  });

  it('exposes defaultMs', () => {
    const ctrl = createTimeoutController(250);
    expect(ctrl.defaultMs).toBe(250);
  });
});
