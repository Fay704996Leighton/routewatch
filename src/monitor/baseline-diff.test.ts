import { diffBaselines, formatBaselineDiff, baselineDiffToJson } from "./baseline-diff";
import { BaselineEntry } from "./baseline";

function makeEntry(overrides: Partial<BaselineEntry> = {}): BaselineEntry {
  return {
    url: "https://api.example.com/health",
    avgDuration: 200,
    p95: 400,
    successRate: 1.0,
    sampleCount: 10,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("diffBaselines", () => {
  it("returns no changes when baselines are identical", () => {
    const e = makeEntry();
    const result = diffBaselines({ [e.url]: e }, { [e.url]: e });
    expect(result.hasChanges).toBe(false);
    expect(result.entries).toHaveLength(0);
  });

  it("detects avgDuration change", () => {
    const prev = makeEntry({ avgDuration: 200 });
    const curr = makeEntry({ avgDuration: 300 });
    const result = diffBaselines({ [prev.url]: prev }, { [curr.url]: curr });
    expect(result.hasChanges).toBe(true);
    const entry = result.entries.find((e) => e.field === "avgDuration");
    expect(entry).toBeDefined();
    expect(entry!.delta).toBeCloseTo(100);
    expect(entry!.deltaPercent).toBeCloseTo(50);
  });

  it("detects p95 and successRate changes", () => {
    const prev = makeEntry({ p95: 400, successRate: 1.0 });
    const curr = makeEntry({ p95: 600, successRate: 0.8 });
    const result = diffBaselines({ [prev.url]: prev }, { [curr.url]: curr });
    const fields = result.entries.map((e) => e.field);
    expect(fields).toContain("p95");
    expect(fields).toContain("successRate");
  });

  it("skips urls not in previous baseline", () => {
    const curr = makeEntry({ url: "https://new.example.com" });
    const result = diffBaselines({}, { [curr.url]: curr });
    expect(result.hasChanges).toBe(false);
  });
});

describe("formatBaselineDiff", () => {
  it("returns no-change message when empty", () => {
    const e = makeEntry();
    const diff = diffBaselines({ [e.url]: e }, { [e.url]: e });
    expect(formatBaselineDiff(diff)).toBe("No baseline changes detected.");
  });

  it("includes url and field in output", () => {
    const prev = makeEntry({ avgDuration: 100 });
    const curr = makeEntry({ avgDuration: 200 });
    const diff = diffBaselines({ [prev.url]: prev }, { [curr.url]: curr });
    const text = formatBaselineDiff(diff);
    expect(text).toContain(prev.url);
    expect(text).toContain("avgDuration");
    expect(text).toContain("+50.0%");
  });
});

describe("baselineDiffToJson", () => {
  it("serializes to valid JSON", () => {
    const e = makeEntry();
    const diff = diffBaselines({ [e.url]: e }, { [e.url]: e });
    const json = JSON.parse(baselineDiffToJson(diff));
    expect(json).toHaveProperty("hasChanges");
    expect(json).toHaveProperty("entries");
  });
});
