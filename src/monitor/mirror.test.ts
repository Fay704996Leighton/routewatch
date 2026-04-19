import { buildMirrorEntry, buildMirrorReport, formatMirrorReport, mirrorToJson } from "./mirror";

function makeEntry(overrides: Partial<ReturnType<typeof buildMirrorEntry>> = {}) {
  return {
    ...buildMirrorEntry(
      "https://api.example.com/users",
      "https://mirror.example.com/users",
      200,
      200,
      120,
      135,
      { id: 1 },
      { id: 1 }
    ),
    ...overrides,
  };
}

describe("buildMirrorEntry", () => {
  it("marks statusMatch true when statuses equal", () => {
    const e = makeEntry();
    expect(e.statusMatch).toBe(true);
  });

  it("marks statusMatch false when statuses differ", () => {
    const e = buildMirrorEntry("u", "m", 200, 500, 100, 100, {}, {});
    expect(e.statusMatch).toBe(false);
  });

  it("marks bodyMatch false when bodies differ", () => {
    const e = buildMirrorEntry("u", "m", 200, 200, 100, 100, { a: 1 }, { a: 2 });
    expect(e.bodyMatch).toBe(false);
  });

  it("computes durationDeltaMs correctly", () => {
    const e = buildMirrorEntry("u", "m", 200, 200, 100, 160, {}, {});
    expect(e.durationDeltaMs).toBe(60);
  });
});

describe("buildMirrorReport", () => {
  it("counts diverged entries", () => {
    const entries = [
      makeEntry(),
      makeEntry({ statusMatch: false }),
      makeEntry({ bodyMatch: false }),
    ];
    const report = buildMirrorReport(entries);
    expect(report.totalCompared).toBe(3);
    expect(report.diverged).toBe(2);
  });

  it("returns zero diverged when all match", () => {
    const report = buildMirrorReport([makeEntry()]);
    expect(report.diverged).toBe(0);
  });
});

describe("formatMirrorReport", () => {
  it("includes summary line", () => {
    const report = buildMirrorReport([makeEntry()]);
    const text = formatMirrorReport(report);
    expect(text).toContain("1 compared");
    expect(text).toContain("0 diverged");
  });
});

describe("mirrorToJson", () => {
  it("returns valid JSON", () => {
    const report = buildMirrorReport([makeEntry()]);
    expect(() => JSON.parse(mirrorToJson(report))).not.toThrow();
  });
});
