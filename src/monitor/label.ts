// label.ts — attach and filter routes by human-readable labels

export interface Labeled {
  labels?: Record<string, string>;
}

export interface LabelSelector {
  [key: string]: string;
}

/**
 * Returns true if item's labels satisfy ALL key=value pairs in selector.
 */
export function matchesLabels<T extends Labeled>(item: T, selector: LabelSelector): boolean {
  if (!item.labels) return Object.keys(selector).length === 0;
  for (const [k, v] of Object.entries(selector)) {
    if (item.labels[k] !== v) return false;
  }
  return true;
}

/**
 * Filter a list of labeled items by a selector.
 */
export function filterByLabels<T extends Labeled>(items: T[], selector: LabelSelector): T[] {
  return items.filter((i) => matchesLabels(i, selector));
}

/**
 * Collect all unique label keys across items.
 */
export function collectLabelKeys<T extends Labeled>(items: T[]): string[] {
  const keys = new Set<string>();
  for (const item of items) {
    if (item.labels) Object.keys(item.labels).forEach((k) => keys.add(k));
  }
  return [...keys].sort();
}

/**
 * Parse a "key=value,key2=value2" string into a LabelSelector.
 */
export function parseLabelSelector(raw: string): LabelSelector {
  const selector: LabelSelector = {};
  if (!raw.trim()) return selector;
  for (const part of raw.split(',')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) selector[k] = v;
  }
  return selector;
}
