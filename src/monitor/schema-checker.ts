import { SchemaDriftResult } from './types';

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

export function checkSchemaDrift(
  endpoint: string,
  baseline: JsonObject,
  current: JsonObject
): SchemaDriftResult {
  const baselineKeys = Object.keys(baseline);
  const currentKeys = Object.keys(current);

  const missingKeys = baselineKeys.filter((k) => !(k in current));
  const extraKeys = currentKeys.filter((k) => !(k in baseline));

  const typeMismatches: SchemaDriftResult['typeMismatches'] = [];

  for (const key of baselineKeys) {
    if (!(key in current)) continue;
    const expectedType = Array.isArray(baseline[key]) ? 'array' : typeof baseline[key];
    const actualType = Array.isArray(current[key]) ? 'array' : typeof current[key];
    if (expectedType !== actualType) {
      typeMismatches.push({ key, expected: expectedType, actual: actualType });
    }
  }

  const drifted =
    missingKeys.length > 0 || typeMismatches.length > 0;

  return { endpoint, drifted, missingKeys, extraKeys, typeMismatches };
}

export function flattenKeys(obj: JsonObject, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenKeys(value as JsonObject, fullKey));
    } else {
      result[fullKey] = Array.isArray(value) ? 'array' : typeof value;
    }
  }
  return result;
}
