import { pollWithRateLimit } from './poller-rate-limited';
import { pollEndpoint } from './poller';
import { RouteConfig } from '../config/schema';

jest.mock('./poller');

const mockedPoll = pollEndpoint as jest.MockedFunction<typeof pollEndpoint>;

function makeRoute(id: number): RouteConfig {
  return { name: `route-${id}`, url: `https://example.com/${id}`, method: 'GET' };
}

function makePollResult(name: string) {
  return {
    route: name,
    url: `https://example.com`,
    status: 200,
    durationMs: 120,
    timestamp: new Date().toISOString(),
    body: '{}',
    ok: true,
  };
}

describe('pollWithRateLimit', () => {
  beforeEach(() => jest.clearAllMocks());

  it('polls all routes and returns results', async () => {
    const routes = [makeRoute(1), makeRoute(2), makeRoute(3)];
    mockedPoll.mockImplementation(async (r) => makePollResult(r.name));

    const results = await pollWithRateLimit({ routes, rateLimiter: { maxRequests: 10, windowMs: 500 } });
    expect(results).toHaveLength(3);
    expect(mockedPoll).toHaveBeenCalledTimes(3);
  });

  it('passes timeoutMs to pollEndpoint', async () => {
    const routes = [makeRoute(1)];
    mockedPoll.mockImplementation(async (r) => makePollResult(r.name));

    await pollWithRateLimit({ routes, timeoutMs: 3000 });
    expect(mockedPoll).toHaveBeenCalledWith(routes[0], 3000);
  });

  it('uses default rate limiter options when not provided', async () => {
    const routes = [makeRoute(1)];
    mockedPoll.mockResolvedValue(makePollResult('route-1'));

    const results = await pollWithRateLimit({ routes });
    expect(results).toHaveLength(1);
  });

  it('returns empty array for empty routes', async () => {
    const results = await pollWithRateLimit({ routes: [] });
    expect(results).toEqual([]);
    expect(mockedPoll).not.toHaveBeenCalled();
  });
});
