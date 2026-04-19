import { formatShadowEntry, formatShadowReportText, shadowSummaryLine, shadowReportToJson } from "./shadow-formatter";
import { buildShadowEntry, buildShadowReport } from "../monitor/shadow";

function makeEntry(primary = 100, shadow = 130): ReturnType<typeof buildShadowEntry> {
  return buildShadowEntry("https://api.example.com/test", primary, shadow);
}

describe("formatShadowEntry", () => {
  it("includes all fields", () => {
    const text = formatShadowEntry(makeEntry());
    expect(text).toContain("https://api.example.com/test");
    expect(text).toContain("100ms");
    expect(text).toContain("130ms");
    expect(text).toContain("+30ms");
  });

  it("shows negative delta", () => {
    const text = formatShadowEntry(makeEntry(200, 150));
    expect(text).toContain("-50ms");
  });
});

describe("formatShadowReportText", () => {
  it("returns empty message when no entries", () => {
    const r = buildShadowReport([]);
    expect(formatShadowReportText(r)).toContain("no comparisons");
  });

  it("includes header and summary", () => {
    const r = buildShadowReport([makeEntry(), makeEntry(50, 60)]);
    const text = formatShadowReportText(r);
    expect(text).toContain("Shadow Comparison");
    expect(text).toContain("Total: 2");
  });
});

describe("shadowSummaryLine", () => {
  it("returns a one-liner", () => {
    const r = buildShadowReport([makeEntry()]);
    const line = shadowSummaryLine(r);
    expect(line).toContain("1 compared");
    expect(line).toContain("avg delta");
  });
});

describe("shadowReportToJson", () => {
  it("produces valid JSON", () => {
    const r = buildShadowReport([makeEntry()]);
    expect(() => JSON.parse(shadowReportToJson(r))).not.toThrow();
  });
});
