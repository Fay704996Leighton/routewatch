import { describe, it, expect } from "vitest";
import { buildHeartbeatEntry, buildHeartbeatReport, formatHeartbeatReport } from "./heartbeat";
import type { PollResult } from "./types";

const INTERVAL = 60_000;

function makePollResult(url: string, status: "success" | "error", offsetMs: number, now: number): PollResult {
  return {
    url,
    status,
    statusCode: status === "success" ? 200 : 500,
    duration: 100,
    timestamp: new Date(now - offsetMs).toISOString(),
    body: "{}",
  };
}

describe("buildHeartbeatEntry", () => {
  it("returns ok when last seen within interval", () => {
    const now = Date.now();
    const results = [makePollResult("http://a.com", "success", 10_000, now)];
    const entry = buildHeartbeatEntry("http://a.com", results, INTERVAL, now);
    expect(entry.status).toBe("ok");
    expect(entry.missed).toBe(0);
  });

  it("returns missed when 1-2 intervals elapsed", () => {
    const now = Date.now();
    const results = [makePollResult("http://a.com", "success", 2 * INTERVAL + 1000, now)];
    const entry = buildHeartbeatEntry("http://a.com", results, INTERVAL, now);
    expect(entry.status).toBe("missed");
    expect(entry.missed).toBeGreaterThanOrEqual(1);
  });

  it("returns dead when no successes", () => {
    const now = Date.now();
    const results = [makePollResult("http://a.com", "error", 1000, now)];
    const entry = buildHeartbeatEntry("http://a.com", results, INTERVAL, now);
    expect(entry.status).toBe("dead");
    expect(entry.lastSeen).toBe("never");
  });

  it("returns dead when 3+ intervals missed", () => {
    const now = Date.now();
    const results = [makePollResult("http://a.com", "success", 4 * INTERVAL, now)];
    const entry = buildHeartbeatEntry("http://a.com", results, INTERVAL, now);
    expect(entry.status).toBe("dead");
  });
});

describe("buildHeartbeatReport", () => {
  it("groups results by url", () => {
    const now = Date.now();
    const results = [
      makePollResult("http://a.com", "success", 5000, now),
      makePollResult("http://b.com", "success", 5000, now),
    ];
    const report = buildHeartbeatReport(results, INTERVAL, now);
    expect(report.entries).toHaveLength(2);
  });
});

describe("formatHeartbeatReport", () => {
  it("includes url and status in output", () => {
    const now = Date.now();
    const results = [makePollResult("http://a.com", "success", 5000, now)];
    const report = buildHeartbeatReport(results, INTERVAL, now);
    const text = formatHeartbeatReport(report);
    expect(text).toContain("http://a.com");
    expect(text).toContain("ok");
  });
});
