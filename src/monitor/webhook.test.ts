import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildWebhookPayload,
  dispatchWebhook,
  WebhookConfig,
} from "./webhook";
import type { Alert } from "./alert";

function makeAlert(id = "a1"): Alert {
  return {
    id,
    severity: "warning",
    message: "slow response",
    route: "/api/test",
    timestamp: new Date().toISOString(),
  };
}

const cfg: WebhookConfig = { url: "https://example.com/hook", timeoutMs: 1000 };

describe("buildWebhookPayload", () => {
  it("includes alerts and source", () => {
    const p = buildWebhookPayload([makeAlert()]);
    expect(p.source).toBe("routewatch");
    expect(p.alerts).toHaveLength(1);
    expect(p.timestamp).toBeTruthy();
  });
});

describe("dispatchWebhook", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns ok true on 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200 })
    );
    const result = await dispatchWebhook(cfg, buildWebhookPayload([makeAlert()]));
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
  });

  it("returns ok false on 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 })
    );
    const result = await dispatchWebhook(cfg, buildWebhookPayload([]));
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
  });

  it("returns error on fetch throw", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network fail")));
    const result = await dispatchWebhook(cfg, buildWebhookPayload([]));
    expect(result.ok).toBe(false);
    expect(result.error).toBe("network fail");
  });

  it("sends secret header when provided", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", mockFetch);
    await dispatchWebhook({ ...cfg, secret: "s3cr3t" }, buildWebhookPayload([]));
    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers["X-RouteWatch-Secret"]).toBe("s3cr3t");
  });
});
