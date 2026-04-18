import type { Alert } from "./alert";

export interface WebhookConfig {
  url: string;
  secret?: string;
  timeoutMs?: number;
}

export interface WebhookPayload {
  timestamp: string;
  alerts: Alert[];
  source: string;
}

export interface WebhookResult {
  ok: boolean;
  status?: number;
  error?: string;
}

export function buildWebhookPayload(alerts: Alert[]): WebhookPayload {
  return {
    timestamp: new Date().toISOString(),
    alerts,
    source: "routewatch",
  };
}

export async function dispatchWebhook(
  config: WebhookConfig,
  payload: WebhookPayload
): Promise<WebhookResult> {
  const { url, secret, timeoutMs = 5000 } = config;
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret) {
    headers["X-RouteWatch-Secret"] = secret;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
    return { ok: res.ok, status: res.status };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "unknown error" };
  } finally {
    clearTimeout(timer);
  }
}
