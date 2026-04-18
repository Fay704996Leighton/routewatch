import { describe, it, expect, beforeEach } from "vitest";
import {
  createPauseStore,
  pauseRoute,
  resumeRoute,
  isPaused,
  purgeExpiredPauses,
  listPaused,
} from "./pause";

describe("pause", () => {
  let store: ReturnType<typeof createPauseStore>;

  beforeEach(() => {
    store = createPauseStore();
  });

  it("pauses a route indefinitely", () => {
    pauseRoute(store, "https://api.example.com/a", "maintenance");
    expect(isPaused(store, "https://api.example.com/a")).toBe(true);
  });

  it("is not paused when not added", () => {
    expect(isPaused(store, "https://api.example.com/b")).toBe(false);
  });

  it("resumes a paused route", () => {
    pauseRoute(store, "https://api.example.com/a", "test");
    const removed = resumeRoute(store, "https://api.example.com/a");
    expect(removed).toBe(true);
    expect(isPaused(store, "https://api.example.com/a")).toBe(false);
  });

  it("returns false when resuming non-paused route", () => {
    expect(resumeRoute(store, "https://api.example.com/x")).toBe(false);
  });

  it("auto-resumes after durationMs", () => {
    const now = Date.now();
    pauseRoute(store, "https://api.example.com/a", "temp", 1000);
    expect(isPaused(store, "https://api.example.com/a", now + 500)).toBe(true);
    expect(isPaused(store, "https://api.example.com/a", now + 2000)).toBe(false);
  });

  it("purges expired pauses", () => {
    const now = Date.now();
    pauseRoute(store, "https://api.example.com/a", "temp", 500);
    pauseRoute(store, "https://api.example.com/b", "perm");
    const purged = purgeExpiredPauses(store, now + 1000);
    expect(purged).toBe(1);
    expect(store.entries).toHaveLength(1);
  });

  it("replaces existing pause entry for same url", () => {
    pauseRoute(store, "https://api.example.com/a", "first");
    pauseRoute(store, "https://api.example.com/a", "second");
    expect(store.entries).toHaveLength(1);
    expect(store.entries[0].reason).toBe("second");
  });

  it("listPaused returns only active entries", () => {
    const now = Date.now();
    pauseRoute(store, "https://api.example.com/a", "temp", 500);
    pauseRoute(store, "https://api.example.com/b", "perm");
    const list = listPaused(store, now + 1000);
    expect(list).toHaveLength(1);
    expect(list[0].url).toBe("https://api.example.com/b");
  });
});
