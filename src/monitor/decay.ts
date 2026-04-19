// Alert score decay: reduces alert severity scores over time based on age

export interface DecayEntry {
  url: string;
  initialScore: number;
  currentScore: number;
  createdAt: string;
  updatedAt: string;
  decayedAt: string;
}

export interface DecayReport {
  entries: DecayEntry[];
  generatedAt: string;
}

export function applyDecay(
  score: number,
  ageMs: number,
  halfLifeMs: number
): number {
  if (halfLifeMs <= 0) return score;
  const factor = Math.pow(0.5, ageMs / halfLifeMs);
  return score * factor;
}

export function buildDecayEntry(
  url: string,
  initialScore: number,
  createdAt: string,
  halfLifeMs: number,
  now = new Date()
): DecayEntry {
  const created = new Date(createdAt).getTime();
  const ageMs = now.getTime() - created;
  const currentScore = applyDecay(initialScore, ageMs, halfLifeMs);
  return {
    url,
    initialScore,
    currentScore: Math.round(currentScore * 1000) / 1000,
    createdAt,
    updatedAt: now.toISOString(),
    decayedAt: now.toISOString(),
  };
}

export function buildDecayReport(
  entries: Array<{ url: string; initialScore: number; createdAt: string }>,
  halfLifeMs: number,
  now = new Date()
): DecayReport {
  return {
    entries: entries.map((e) =>
      buildDecayEntry(e.url, e.initialScore, e.createdAt, halfLifeMs, now)
    ),
    generatedAt: now.toISOString(),
  };
}

export function decayToJson(report: DecayReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatDecayReport(report: DecayReport): string {
  const lines: string[] = [`Decay Report — ${report.generatedAt}`, ""];
  for (const e of report.entries) {
    lines.push(`  ${e.url}`);
    lines.push(`    initial: ${e.initialScore}  current: ${e.currentScore}`);
  }
  return lines.join("\n");
}
