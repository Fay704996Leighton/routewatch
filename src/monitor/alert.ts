export type AlertType = 'regression' | 'schema-drift';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  endpoint: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
}

import { RegressionResult } from './regression';
import { SchemaDriftResult } from './schema-checker';

export function buildAlertsFromRegressions(results: RegressionResult[]): Alert[] {
  return results.map((r) => ({
    endpoint: r.endpoint,
    type: 'regression',
    severity: r.ratio >= 2 ? 'critical' : 'warning',
    message: `Response time regression: ${r.avgDuration}ms vs baseline ${r.baselineDuration}ms (${r.ratio.toFixed(2)}x)`,
    timestamp: new Date().toISOString(),
  }));
}

export function buildAlertsFromSchemaDrift(results: SchemaDriftResult[]): Alert[] {
  return results
    .filter((r) => r.drifted)
    .map((r) => ({
      endpoint: r.endpoint,
      type: 'schema-drift',
      severity: 'warning',
      message: `Schema drift detected. Added: [${r.addedKeys.join(', ')}] Removed: [${r.removedKeys.join(', ')}]`,
      timestamp: new Date().toISOString(),
    }));
}

export function mergeAlerts(...groups: Alert[][]): Alert[] {
  return groups.flat();
}

export function filterAlertsBySeverity(alerts: Alert[], severity: AlertSeverity): Alert[] {
  const order: AlertSeverity[] = ['info', 'warning', 'critical'];
  const minIndex = order.indexOf(severity);
  return alerts.filter((a) => order.indexOf(a.severity) >= minIndex);
}
