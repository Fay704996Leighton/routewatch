import { describe, it, expect, beforeEach } from "vitest";
import { createCooldownTracker, CooldownTracker } from "./cooldown";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("createCooldownTracker", () => {
  let tracker: CooldownTracker;

  beforeEach(() => {
    tracker = createCooldownTracker(100);
  });

  it("returns false for unknown key", () => {
    expect(tracker.isOnCooldown("route-a")).toBe(false);
  });

  it("returns true immediately after recording", () => {
    tracker.record("route-a");
    expect(tracker.isOnCooldown("route-a")).toBe(true);
  });

  it("returns false after window expires", async () => {
    tracker = createCooldownTracker(50);
    tracker.record("route-a");
    await delay(60);
    expect(tracker.isOnCooldown("route-a")).toBe(false);
  });

  it("increments count on repeated records", () => {
    tracker.record("route-a");
    tracker.record("route-a");
    expect(tracker.stats("route-a")?.count).toBe(2);
  });

  it("reset clears the entry", () => {
    tracker.record("route-a");
    tracker.reset("route-a");
    expect(tracker.isOnCooldown("route-a")).toBe(false);
    expect(tracker.stats("route-a")).toBeUndefined();
  });

  it("purgeExpired removes stale entries", async () => {
    tracker = createCooldownTracker(50);
    tracker.record("route-a");
    tracker.record("route-b");
    await delay(60);
    tracker.purgeExpired();
    expect(tracker.stats("route-a")).toBeUndefined();
    expect(tracker.stats("route-b")).toBeUndefined();
  });

  it("purgeExpired keeps active entries", async () => {
    tracker = createCooldownTracker(200);
    tracker.record("route-a");
    await delay(50);
    tracker.purgeExpired();
    expect(tracker.stats("route-a")).toBeDefined();
  });
});
