import { applyDecay, buildDecayEntry, buildDecayReport, formatDecayReport } from "./decay";

const NOW = new Date("2024-06-01T12:00:00.000Z");
const ONE_HOUR = 60 * 60 * 1000;

describe("applyDecay", () => {
  it("returns full score at age 0", () => {
    expect(applyDecay(100, 0, ONE_HOUR)).toBeCloseTo(100);
  });

  it("returns half score at one half-life", () => {
    expect(applyDecay(100, ONE_HOUR, ONE_HOUR)).toBeCloseTo(50);
  });

  it("returns quarter score at two half-lives", () => {
    expect(applyDecay(100, ONE_HOUR * 2, ONE_HOUR)).toBeCloseTo(25);
  });

  it("returns original score when halfLifeMs is 0", () => {
    expect(applyDecay(80, ONE_HOUR, 0)).toBe(80);
  });
});

describe("buildDecayEntry", () => {
  it("builds entry with decayed score", () => {
    const createdAt = new Date(NOW.getTime() - ONE_HOUR).toISOString();
    const entry = buildDecayEntry("https://api.example.com/health", 100, createdAt, ONE_HOUR, NOW);
    expect(entry.url).toBe("https://api.example.com/health");
    expect(entry.initialScore).toBe(100);
    expect(entry.currentScore).toBeCloseTo(50, 1);
    expect(entry.createdAt).toBe(createdAt);
  });

  it("score stays near initial when freshly created", () => {
    const createdAt = NOW.toISOString();
    const entry = buildDecayEntry("https://api.example.com/v1", 60, createdAt, ONE_HOUR, NOW);
    expect(entry.currentScore).toBeCloseTo(60, 1);
  });
});

describe("buildDecayReport", () => {
  it("builds report for multiple entries", () => {
    const createdAt = new Date(NOW.getTime() - ONE_HOUR).toISOString();
    const report = buildDecayReport(
      [
        { url: "https://a.io/1", initialScore: 80, createdAt },
        { url: "https://a.io/2", initialScore: 40, createdAt },
      ],
      ONE_HOUR,
      NOW
    );
    expect(report.entries).toHaveLength(2);
    expect(report.entries[0].currentScore).toBeCloseTo(40, 1);
    expect(report.entries[1].currentScore).toBeCloseTo(20, 1);
    expect(report.generatedAt).toBe(NOW.toISOString());
  });
});

describe("formatDecayReport", () => {
  it("includes url and scores in output", () => {
    const createdAt = new Date(NOW.getTime() - ONE_HOUR).toISOString();
    const report = buildDecayReport(
      [{ url: "https://example.com", initialScore: 100, createdAt }],
      ONE_HOUR,
      NOW
    );
    const text = formatDecayReport(report);
    expect(text).toContain("https://example.com");
    expect(text).toContain("initial: 100");
  });
});
