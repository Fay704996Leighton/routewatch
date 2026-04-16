import {
  fingerprintBody,
  buildFingerprintEntry,
  compareFingerprints,
  FingerprintEntry,
} from "./fingerprint";

const sampleBody = { b: 2, a: 1, nested: { z: 26, y: 25 } };

describe("fingerprintBody", () => {
  it("returns a 64-char hex string", () => {
    const fp = fingerprintBody(sampleBody, "schema");
    expect(fp).toMatch(/^[0-9a-f]{64}$/);
  });

  it("schema mode: same keys → same fingerprint regardless of values", () => {
    const a = fingerprintBody({ x: 1, y: 2 }, "schema");
    const b = fingerprintBody({ x: 99, y: 0 }, "schema");
    expect(a).toBe(b);
  });

  it("schema mode: different keys → different fingerprint", () => {
    const a = fingerprintBody({ x: 1 }, "schema");
    const b = fingerprintBody({ x: 1, y: 2 }, "schema");
    expect(a).not.toBe(b);
  });

  it("full mode: same structure different values → different fingerprint", () => {
    const a = fingerprintBody({ x: 1 }, "full");
    const b = fingerprintBody({ x: 2 }, "full");
    expect(a).not.toBe(b);
  });

  it("full mode: identical objects → same fingerprint", () => {
    const a = fingerprintBody({ x: 1, y: 2 }, "full");
    const b = fingerprintBody({ x: 1, y: 2 }, "full");
    expect(a).toBe(b);
  });

  it("handles arrays", () => {
    const a = fingerprintBody([1, 2, 3], "schema");
    const b = fingerprintBody([1, 2, 3], "schema");
    expect(a).toBe(b);
  });

  it("handles null / primitives", () => {
    expect(() => fingerprintBody(null, "schema")).not.toThrow();
    expect(() => fingerprintBody("string", "full")).not.toThrow();
  });
});

describe("buildFingerprintEntry", () => {
  it("returns entry with url, mode, fingerprint, capturedAt", () => {
    const entry = buildFingerprintEntry("https://api.example.com/v1", sampleBody);
    expect(entry.url).toBe("https://api.example.com/v1");
    expect(entry.mode).toBe("schema");
    expect(entry.fingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(new Date(entry.capturedAt).getTime()).not.toBeNaN();
  });
});

describe("compareFingerprints", () => {
  function makeEntry(body: unknown, mode: "schema" | "full" = "schema"): FingerprintEntry {
    return buildFingerprintEntry("https://example.com", body, mode);
  }

  it("reports changed=false when fingerprints match", () => {
    const a = makeEntry(sampleBody);
    const b = makeEntry(sampleBody);
    const result = compareFingerprints(a, b);
    expect(result.changed).toBe(false);
  });

  it("reports changed=true when fingerprints differ", () => {
    const a = makeEntry({ x: 1 });
    const b = makeEntry({ x: 1, y: 2 });
    const result = compareFingerprints(a, b);
    expect(result.changed).toBe(true);
    expect(result.previous).toBe(a.fingerprint);
    expect(result.current).toBe(b.fingerprint);
  });
});
