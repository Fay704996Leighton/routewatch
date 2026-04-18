import type { Alert } from "./alert";
import { buildWebhookPayload, dispatchWebhook, WebhookConfig, WebhookResult } from "./webhook";

export interface DispatchSummary {
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{ url: string } & WebhookResult>;
}

export async function dispatchToAll(
  configs: WebhookConfig[],
  alerts: Alert[]
): Promise<DispatchSummary> {
  if (configs.length === 0 || alerts.length === 0) {
    return { total: 0, succeeded: 0, failed: 0, results: [] };
  }
  const payload = buildWebhookPayload(alerts);
  const settled = await Promise.allSettled(
    configs.map((cfg) => dispatchWebhook(cfg, payload).then((r) => ({ url: cfg.url, ...r })))
  );
  const results: Array<{ url: string } & WebhookResult> = settled.map((s, i) =>
    s.status === "fulfilled"
      ? s.value
      : { url: configs[i].url, ok: false, error: "dispatch threw" }
  );
  const succeeded = results.filter((r) => r.ok).length;
  return { total: results.length, succeeded, failed: results.length - succeeded, results };
}
