import { EndpointConfig } from '../config/schema';

export interface FetchResult {
  url: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  body: unknown;
  error?: string;
}

export async function fetchEndpoint(
  endpoint: EndpointConfig,
  timeoutMs = 10000
): Promise<FetchResult> {
  const { url, method = 'GET', headers = {} } = endpoint;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const start = performance.now();

  try {
    const response = await fetch(url, {
      method,
      headers,
      signal: controller.signal,
    });

    const responseTimeMs = Math.round(performance.now() - start);
    let body: unknown = null;

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }

    return {
      url,
      method,
      statusCode: response.status,
      responseTimeMs,
      body,
    };
  } catch (err: unknown) {
    const responseTimeMs = Math.round(performance.now() - start);
    const error =
      err instanceof Error ? err.message : 'Unknown error';
    return {
      url,
      method,
      statusCode: 0,
      responseTimeMs,
      body: null,
      error,
    };
  } finally {
    clearTimeout(timer);
  }
}
