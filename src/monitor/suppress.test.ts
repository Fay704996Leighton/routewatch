import { describe, it, expect } from "vitest";
import {
  createSuppressStore,
  addRule,
  isSuppressed,
  filterSuppressed,
  purgeExpiredRules,
  suppressStats,
} from "./suppress";

const NOW = 1_000_000;

describe("isSuppressed", () => {
  it("returns false when no rules", () => {
    const s = createSuppressStore();
    expect(isSuppressed(s, "http://a.com", [], NOW)).toBe(false);
  });

  it("suppresses by url", () => {
    const s = createSuppressStore();
    addRule(s, { url: "http://a.com", until: NOW + 1000 });
    expect(isSuppressed(s, "http://a.com", [], NOW)).toBe(true);
    expect(isSuppressed(s, "http://b.com", [], NOW)).toBe(false);
  });

  it("suppresses by tag", () => {
    const s = createSuppressStore();
    addRule(s, { tag: "prod", until: NOW + 1000 });
    expect(isSuppressed(s, "http://any.com", ["prod"], NOW)).toBe(true);
    expect(isSuppressed(s, "http://any.com", ["dev"], NOW)).toBe(false);
  });

  it("ignores expired rules", () => {
    const s = createSuppressStore();
    addRule(s, { url: "http://a.com", until: NOW - 1 });
    expect(isSuppressed(s, "http://a.com", [], NOW)).toBe(false);
  });
});

describe("filterSuppressed", () => {
  it("removes suppressed items", () => {
    const s = createSuppressStore();
    addRule(s, { url: "http://a.com", until: NOW + 1000 });
    const items = [
      { url: "http://a.com" },
      { url: "http://b.com" },
    ];
    const result = filterSuppressed(s, items, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe("http://b.com");
  });
});

describe("purgeExpiredRules", () => {
  it("removes expired rules", () => {
    const s = createSuppressStore([
      { until: NOW - 1 },
      { until: NOW + 1000 },
    ]);
    purgeExpiredRules(s, NOW);
    expect(s.rules).toHaveLength(1);
  });
});

describe("suppressStats", () => {
  it("returns active rule count", () => {
    const s = createSuppressStore([
      { until: NOW + 500 },
      { until: NOW + 1000 },
    ]);
    expect(suppressStats(s, NOW).active).toBe(2);
  });
});
