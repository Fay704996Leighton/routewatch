import { createQuotaTracker } from "./quota";

const WINDOW = 1000;
const LIMIT = 3;

function makeTracker() {
  return createQuotaTracker({ windowMs: WINDOW, maxRequests: LIMIT });
}

describe("createQuotaTracker", () => {
  it("starts with count 0 and not exceeded", () => {
    const tracker = makeTracker();
    const result = tracker.check("https://api.example.com/users");
    expect(result.count).toBe(0);
    expect(result.exceeded).toBe(false);
    expect(result.limit).toBe(LIMIT);
  });

  it("increments count on record", () => {
    const tracker = makeTracker();
    const url = "https://api.example.com/items";
    tracker.record(url);
    tracker.record(url);
    const result = tracker.record(url);
    expect(result.count).toBe(3);
    expect(result.exceeded).toBe(false);
  });

  it("flags exceeded when over limit", () => {
    const tracker = makeTracker();
    const url = "https://api.example.com/orders";
    for (let i = 0; i < LIMIT + 1; i++) tracker.record(url);
    const result = tracker.check(url);
    expect(result.exceeded).toBe(true);
    expect(result.count).toBe(LIMIT + 1);
  });

  it("resets window after windowMs", () => {
    const tracker = makeTracker();
    const url = "https://api.example.com/reset";
    const t0 = Date.now();
    for (let i = 0; i < LIMIT + 1; i++) tracker.record(url, t0);
    const result = tracker.record(url, t0 + WINDOW + 1);
    expect(result.count).toBe(1);
    expect(result.exceeded).toBe(false);
  });

  it("tracks different urls independently", () => {
    const tracker = makeTracker();
    tracker.record("https://a.com");
    tracker.record("https://a.com");
    tracker.record("https://b.com");
    expect(tracker.check("https://a.com").count).toBe(2);
    expect(tracker.check("https://b.com").count).toBe(1);
  });

  it("reset clears a specific url", () => {
    const tracker = makeTracker();
    const url = "https://api.example.com/clear";
    tracker.record(url);
    tracker.record(url);
    tracker.reset(url);
    expect(tracker.check(url).count).toBe(0);
  });

  it("all returns results for all tracked urls", () => {
    const tracker = makeTracker();
    tracker.record("https://x.com");
    tracker.record("https://y.com");
    tracker.record("https://y.com");
    const results = tracker.all();
    expect(results).toHaveLength(2);
    const y = results.find((r) => r.url === "https://y.com");
    expect(y?.count).toBe(2);
  });
});
