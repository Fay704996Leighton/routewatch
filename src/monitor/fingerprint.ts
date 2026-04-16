/**
 * Fingerprinting: produce a stable hash of a JSON response body
 * so we can detect structural or value-level changes across polls.
 */
import { createHash } from "crypto";

export type FingerprintMode = "schema" | "full";

/**
 * Flatten all keys from an object (recursive), sorted for stability.
 */
function flattenKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  if (Array.isArray(obj)) {
    if (obj.length === 0) return [prefix + "[]"];
    return obj.flatMap((item, i) => flattenKeys(item, `${prefix}[${i}]`));
  }
  return Object.keys(obj as Record<string, unknown>)
    .sort()
    .flatMap((k) =>
      flattenKeys((obj as Record<string, unknown>)[k], prefix ? `${prefix}.${k}` : k)
    );
}

/**
 * Produce a SHA-256 fingerprint of a response body.
 * - mode "schema": hash only the sorted key paths (ignores values)
 * - mode "full":   hash the entire stable-serialised body
 */
export function fingerprintBody(
  body: unknown,
  mode: FingerprintMode = "schema"
): string {
  const hash = createHash("sha256");
  if (mode === "schema") {
    const keys = flattenKeys(body).join("\n");
    hash.update(keys);
  } else {
    hash.update(JSON.stringify(body, Object.keys(body as object).sort()));
  }
  return hash.digest("hex");
}

export interface FingerprintEntry {
  url: string;
  mode: FingerprintMode;
  fingerprint: string;
  capturedAt: string;
}

export function buildFingerprintEntry(
  url: string,
  body: unknown,
  mode: FingerprintMode = "schema"
): FingerprintEntry {
  return {
    url,
    mode,
    fingerprint: fingerprintBody(body, mode),
    capturedAt: new Date().toISOString(),
  };
}

export function compareFingerprints(
  previous: FingerprintEntry,
  current: FingerprintEntry
): { changed: boolean; previous: string; current: string } {
  return {
    changed: previous.fingerprint !== current.fingerprint,
    previous: previous.fingerprint,
    current: current.fingerprint,
  };
}
