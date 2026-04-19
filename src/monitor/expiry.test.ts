import { describe, it, expect } from "vitest";
import {
  buildExpiryEntry,
  buildExpiryReport,
  expiryToJson,
  formatExpiryReport,
} from "./expiry";

const NOW = 1_700_000_000_000;

describe("buildExpiryEntry", () => {
  it("marks entry as expired when age exceeds ttl", () => {
    const lastSeen = NOW - 10_000;
    const entry = buildExpiryEntry("https://api.example.com/health", lastSeen, 5_000, NOW);
    expect(entry.expired).toBe(true);
    expect(entry.url).toBe("https://api.example.com/health");
  });

  it("marks entry as not expired when within ttl", () => {
    const lastSeen = NOW - 2_000;
    const entry = buildExpiryEntry("https://api.example.com/health", lastSeen, 5_000, NOW);
    expect(entry.expired).toBe(false);
  });

  it("marks entry expired when age equals ttl exactly", () => {
    const lastSeen = NOW - 5_000;
    const entry = buildExpiryEntry("https://api.example.com/v1", lastSeen, 5_000, NOW);
    expect(entry.expired).toBe(false);
  });
});

describe("buildExpiryReport", () => {
  it("counts expired entries correctly", () => {
    const entries = [
      buildExpiryEntry("https://a.com", NOW - 10_000, 5_000, NOW),
      buildExpiryEntry("https://b.com", NOW - 1_000, 5_000, NOW),
      buildExpiryEntry("https://c.com", NOW - 20_000, 5_000, NOW),
    ];
    const report = buildExpiryReport(entries, NOW);
    expect(report.totalExpired).toBe(2);
    expect(report.entries).toHaveLength(3);
    expect(report.generatedAt).toBe(NOW);
  });

  it("returns zero expired for all fresh entries", () => {
    const entries = [
      buildExpiryEntry("https://a.com", NOW - 100, 5_000, NOW),
    ];
    const report = buildExpiryReport(entries, NOW);
    expect(report.totalExpired).toBe(0);
  });
});

describe("expiryToJson", () => {
  it("returns valid JSON string", () => {
    const entries = [buildExpiryEntry("https://a.com", NOW - 100, 5_000, NOW)];
    const report = buildExpiryReport(entries, NOW);
    const json = expiryToJson(report);
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json).totalExpired).toBe(0);
  });
});

describe("formatExpiryReport", () => {
  it("includes EXPIRED label for expired entries", () => {
    const entries = [buildExpiryEntry("https://a.com", NOW - 10_000, 5_000, NOW)];
    const report = buildExpiryReport(entries, NOW);
    const text = formatExpiryReport(report);
    expect(text).toContain("EXPIRED");
    expect(text).toContain("https://a.com");
  });

  it("includes OK label for fresh entries", () => {
    const entries = [buildExpiryEntry("https://b.com", NOW - 100, 5_000, NOW)];
    const report = buildExpiryReport(entries, NOW);
    const text = formatExpiryReport(report);
    expect(text).toContain("OK");
  });
});
