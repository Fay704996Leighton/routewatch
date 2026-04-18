import { describe, it, expect } from "vitest";
import { createSlidingWindow } from "./window.js";

function makeEntry(route: string, durationMs: number, timestamp = Date.now()) {
  return { route, durationMs, timestamp };
}

describe("createSlidingWindow", () => {
  it("returns null stats for unknown route", () => {
    const w = createSlidingWindow();
    expect(w.stats("GET /a")).toBeNull();
  });

  it("accumulates entries and computes stats", () => {
    const w = createSlidingWindow();
    [100, 200, 300, 400, 500].forEach((d) =>
      w.add(makeEntry("GET /a", d))
    );
    const s = w.stats("GET /a")!;
    expect(s.count).toBe(5);
    expect(s.min).toBe(100);
    expect(s.max).toBe(500);
    expect(s.avg).toBe(300);
  });

  it("respects maxSize by evicting oldest entries", () => {
    const w = createSlidingWindow(3);
    [10, 20, 30, 40].forEach((d) => w.add(makeEntry("GET /b", d)));
    const entries = w.all("GET /b");
    expect(entries).toHaveLength(3);
    expect(entries[0].durationMs).toBe(20);
  });

  it("computes p95 correctly", () => {
    const w = createSlidingWindow();
    for (let i = 1; i <= 20; i++) w.add(makeEntry("GET /c", i * 10));
    const s = w.stats("GET /c")!;
    expect(s.p95).toBeGreaterThanOrEqual(180);
  });

  it("clears entries for a route", () => {
    const w = createSlidingWindow();
    w.add(makeEntry("GET /d", 50));
    w.clear("GET /d");
    expect(w.stats("GET /d")).toBeNull();
  });

  it("isolates routes from each other", () => {
    const w = createSlidingWindow();
    w.add(makeEntry("GET /x", 100));
    w.add(makeEntry("GET /y", 999));
    expect(w.stats("GET /x")!.avg).toBe(100);
    expect(w.stats("GET /y")!.avg).toBe(999);
  });
});
