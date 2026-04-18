import { loadConfig } from "../config/loader";
import { parseArgs } from "./args";
import { buildAlertsFromRegressions } from "../monitor/alert";
import { dispatchToAll } from "../monitor/webhook-dispatcher";

export async function runWebhookCommand(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  const config = await loadConfig(args.config);

  const webhooks: Array<{ url: string; secret?: string; timeoutMs?: number }> =
    (config as any).webhooks ?? [];

  if (webhooks.length === 0) {
    console.warn("[routewatch] No webhooks configured. Add a 'webhooks' array to your config.");
    return;
  }

  // Reuse alerts passed via stdin as JSON or fall back to empty
  let alerts: any[] = [];
  if (!process.stdin.isTTY) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    try {
      alerts = JSON.parse(Buffer.concat(chunks).toString());
    } catch {
      console.error("[routewatch] Failed to parse alerts from stdin");
      process.exitCode = 1;
      return;
    }
  }

  const summary = await dispatchToAll(webhooks, alerts);
  console.log(
    `[routewatch] Webhooks dispatched: ${summary.succeeded}/${summary.total} succeeded`
  );
  for (const r of summary.results) {
    const tag = r.ok ? "✓" : "✗";
    const detail = r.ok ? `HTTP ${r.status}` : r.error ?? "failed";
    console.log(`  ${tag} ${r.url} — ${detail}`);
  }
  if (summary.failed > 0) process.exitCode = 1;
}
