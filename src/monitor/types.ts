export interface ResponseSample {
  endpoint: string;
  url: string;
  statusCode: number;
  durationMs: number;
  timestamp: string; // ISO 8601
  ok: boolean;
}

export interface SchemaDriftResult {
  endpoint: string;
  drifted: boolean;
  missingKeys: string[];
  extraKeys: string[];
  typeMismatches: Array<{
    key: string;
    expected: string;
    actual: string;
  }>;
}

export interface MonitorReport {
  generatedAt: string;
  samples: ResponseSample[];
  regressions: import('./analyzer').RegressionResult[];
  schemaDrifts: SchemaDriftResult[];
}
