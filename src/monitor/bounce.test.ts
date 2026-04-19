import { describe, it, expect, beforeEach } from "vitest";
import {
  createBounceDetector,
  recordBounce,
  countBounces,
  buildBounceReport,
  formatBounceReport,
  bounceToJson,
} from "./bounce";

const WINDOW = 5_000;

describe("bounce detector", () => {
  let store: ReturnType<typeof createBounceDetector>;

  beforeEach(() => {
    store = createBounceDetector(WINDOW);
  });

  it("starts with zero bounces for unknown url", () => {
    expect(countBounces(store, "http://example.com")).toBe(0);
  });

  it("records and counts transitions", () => {
    recordBounce(store, "http://a.com", "down", WINDOW);
    recordBounce(store, "http://a.com", "up", WINDOW);
    expect(countBounces(store, "http://a.com")).toBe(2);
  });

  it("purges transitions outside window", async () => {
    const shortWindow = 50;
    recordBounce(store, "http://b.com", "down", shortWindow);
    await new Promise(r => setTimeout(r, 80));
    recordBounce(store, "http://b.com", "up", shortWindow);
    expect(countBounces(store, "http://b.com")).toBe(1);
  });

  it("builds report with entries sorted by bounceCount desc", () => {
    recordBounce(store, "http://x.com", "up", WINDOW);
    recordBounce(store, "http://y.com", "down", WINDOW);
    recordBounce(store, "http://y.com", "up", WINDOW);
    recordBounce(store, "http://y.com", "down", WINDOW);
    const report = buildBounceReport(store);
    expect(report.entries[0].url).toBe("http://y.com");
    expect(report.entries[0].bounceCount).toBe(3);
    expect(report.entries[1].bounceCount).toBe(1);
  });

  it("returns empty report when no transitions", () => {
    const report = buildBounceReport(store);
    expect(report.entries).toHaveLength(0);
  });

  it("formatBounceReport returns no-bounce message when empty", () => {
    const report = buildBounceReport(store);
    expect(formatBounceReport(report)).toContain("No bouncing");
  });

  it("formatBounceReport lists entries", () => {
    recordBounce(store, "http://z.com", "up", WINDOW);
    const report = buildBounceReport(store);
    const text = formatBounceReport(report);
    expect(text).toContain("http://z.com");
    expect(text).toContain("1 transitions");
  });

  it("bounceToJson serializes report", () => {
    const report = buildBounceReport(store);
    const json = bounceToJson(report);
    const parsed = JSON.parse(json);
    expect(parsed).toHaveProperty("generatedAt");
    expect(parsed).toHaveProperty("entries");
  });
});
