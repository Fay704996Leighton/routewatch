import { createScheduler } from './scheduler';
import * as poller from './poller';
import { RouteConfig } from '../config/schema';
import { PollResult } from './types';

const makeRoute = (url: string): RouteConfig => ({
  name: url,
  url,
  method: 'GET',
});

const makePollResult = (url: string): PollResult => ({
  route: makeRoute(url),
  durationMs: 50,
  status: 200,
  body: {},
  timestamp: new Date().toISOString(),
  error: undefined,
});

describe('createScheduler', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('calls onResults after first run', async () => {
    const routes = [makeRoute('http://a.com')];
    jest
      .spyOn(poller, 'pollRoutes')
      .mockResolvedValue([makePollResult('http://a.com')]);

    const callback = jest.fn().mockResolvedValue(undefined);
    const handle = createScheduler(routes, { intervalMs: 1000, maxRuns: 1 }, callback);

    await jest.runAllTimersAsync();
    expect(callback).toHaveBeenCalledTimes(1);
    handle.stop();
  });

  it('stops after maxRuns', async () => {
    const routes = [makeRoute('http://b.com')];
    jest
      .spyOn(poller, 'pollRoutes')
      .mockResolvedValue([makePollResult('http://b.com')]);

    const callback = jest.fn().mockResolvedValue(undefined);
    const handle = createScheduler(routes, { intervalMs: 100, maxRuns: 3 }, callback);

    await jest.runAllTimersAsync();
    expect(handle.runCount()).toBe(3);
    handle.stop();
  });

  it('stop() prevents further runs', async () => {
    const routes = [makeRoute('http://c.com')];
    jest
      .spyOn(poller, 'pollRoutes')
      .mockResolvedValue([makePollResult('http://c.com')]);

    const callback = jest.fn().mockResolvedValue(undefined);
    const handle = createScheduler(routes, { intervalMs: 500 }, callback);

    handle.stop();
    await jest.runAllTimersAsync();
    expect(callback).toHaveBeenCalledTimes(0);
  });
});
