import { describe, it, expect, vi, beforeEach } from "vitest";
import { dispatchToAll } from "./webhook-dispatcher";
import type { Alert } from "./alert";

function makeAlert(id = "a1"): Alert {
  return {
    id,
    severity: "critical",
    message: "timeout",
    route: "/health",
    timestamp: new Date().toISOString(),
  };
}

beforeEach(() => vi.restoreAllMocks());

describe("dispatchToAll", () => {
  it("returns empty summary when no configs", async () => {
    const s = await dispatchToAll([], [makeAlert()]);
    expect(s.total).toBe(0);
  });

  it("returns empty summary when no alerts", async () => {
    const s = await dispatchToAll([{ url: "http://x.com" }], []);
    expect(s.total).toBe(0);
  });

  it("counts succeeded and failed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({ ok: false, status: 503 })
    );
    const s = await dispatchToAll(
      [{ url: "http://a.com" }, { url: "http://b.com" }],
      [makeAlert()]
    );
    expect(s.total).toBe(2);
    expect(s.succeeded).toBe(1);
    expect(s.failed).toBe(1);
  });

  it("handles fetch rejection gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    const s = await dispatchToAll([{ url: "http://c.com" }], [makeAlert()]);
    expect(s.failed).toBe(1);
    expect(s.results[0].ok).toBe(false);
  });
});
