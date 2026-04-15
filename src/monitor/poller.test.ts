import { pollRoutes, pollWithRetry } from './poller';
import { RouteConfig } from '../config/schema';
import * as fetcher from './fetcher';
import { PollResult } from './types';

const makeRoute = (url: string): RouteConfig => ({
  name: url,
  url,
  method: 'GET',
});

const makePollResult = (url: string, durationMs = 100): PollResult => ({
  route: makeRoute(url),
  durationMs,
  status: 200,
  body: {},
  timestamp: new Date().toISOString(),
  error: undefined,
});

describe('pollRoutes', () => {
  afterEach(() => jest.restoreAllMocks());

  it('polls all routes and returns results', async () => {
    const routes = [makeRoute('http://a.com'), makeRoute('http://b.com')];
    const spy = jest
      .spyOn(fetcher, 'fetchEndpoint')
      .mockImplementation(async (route) => makePollResult(route.url));

    const results = await pollRoutes(routes);
    expect(results).toHaveLength(2);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('respects concurrency batching', async () => {
    const routes = Array.from({ length: 6 }, (_, i) =>
      makeRoute(`http://route${i}.com`)
    );
    const spy = jest
      .spyOn(fetcher, 'fetchEndpoint')
      .mockImplementation(async (route) => makePollResult(route.url));

    const results = await pollRoutes(routes, { concurrency: 2 });
    expect(results).toHaveLength(6);
    expect(spy).toHaveBeenCalledTimes(6);
  });
});

describe('pollWithRetry', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns result on first success', async () => {
    const route = makeRoute('http://ok.com');
    jest
      .spyOn(fetcher, 'fetchEndpoint')
      .mockResolvedValue(makePollResult(route.url));

    const result = await pollWithRetry(route, 2);
    expect(result.route.url).toBe('http://ok.com');
  });

  it('retries on failure and eventually succeeds', async () => {
    const route = makeRoute('http://flaky.com');
    const spy = jest
      .spyOn(fetcher, 'fetchEndpoint')
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(makePollResult(route.url));

    const result = await pollWithRetry(route, 2);
    expect(result.route.url).toBe('http://flaky.com');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting retries', async () => {
    const route = makeRoute('http://down.com');
    jest
      .spyOn(fetcher, 'fetchEndpoint')
      .mockRejectedValue(new Error('connection refused'));

    await expect(pollWithRetry(route, 2)).rejects.toThrow('connection refused');
  });
});
