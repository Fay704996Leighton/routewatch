import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchEndpoint } from './fetcher';
import { EndpointConfig } from '../config/schema';

const mockEndpoint: EndpointConfig = {
  name: 'test-endpoint',
  url: 'https://api.example.com/health',
  method: 'GET',
};

function makeFetchMock(
  status: number,
  body: unknown,
  contentType = 'application/json'
) {
  return vi.fn().mockResolvedValue({
    status,
    headers: { get: () => contentType },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(String(body)),
  });
}

describe('fetchEndpoint', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', makeFetchMock(200, { status: 'ok' }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns status code and parsed JSON body on success', async () => {
    const result = await fetchEndpoint(mockEndpoint);
    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({ status: 'ok' });
    expect(result.error).toBeUndefined();
  });

  it('records a non-negative responseTimeMs', async () => {
    const result = await fetchEndpoint(mockEndpoint);
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('returns error string and statusCode 0 when fetch throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network failure'))
    );
    const result = await fetchEndpoint(mockEndpoint);
    expect(result.statusCode).toBe(0);
    expect(result.error).toBe('Network failure');
    expect(result.body).toBeNull();
  });

  it('handles non-JSON content type as text', async () => {
    vi.stubGlobal(
      'fetch',
      makeFetchMock(200, 'plain text response', 'text/plain')
    );
    const result = await fetchEndpoint(mockEndpoint);
    expect(result.body).toBe('plain text response');
  });

  it('forwards method and url from endpoint config', async () => {
    const postEndpoint: EndpointConfig = {
      ...mockEndpoint,
      method: 'POST',
      url: 'https://api.example.com/data',
    };
    await fetchEndpoint(postEndpoint);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/data',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
