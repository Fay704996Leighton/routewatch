import { describe, it, expect } from 'vitest';
import {
  buildDependencyGraph,
  findImpacted,
  formatDependencyReport,
  DependencyEdge,
} from './dependency';

const edges: DependencyEdge[] = [
  { from: 'https://api/orders', to: 'https://api/users' },
  { from: 'https://api/orders', to: 'https://api/inventory' },
  { from: 'https://api/checkout', to: 'https://api/orders' },
];

describe('buildDependencyGraph', () => {
  it('creates nodes for all urls', () => {
    const g = buildDependencyGraph(edges);
    expect(Object.keys(g.nodes)).toHaveLength(4);
  });

  it('sets dependsOn correctly', () => {
    const g = buildDependencyGraph(edges);
    expect(g.nodes['https://api/orders'].dependsOn).toContain('https://api/users');
    expect(g.nodes['https://api/orders'].dependsOn).toContain('https://api/inventory');
  });

  it('sets dependents correctly', () => {
    const g = buildDependencyGraph(edges);
    expect(g.nodes['https://api/users'].dependents).toContain('https://api/orders');
  });
});

describe('findImpacted', () => {
  it('returns direct and transitive dependents', () => {
    const g = buildDependencyGraph(edges);
    const impacted = findImpacted(g, 'https://api/users');
    expect(impacted).toContain('https://api/orders');
    expect(impacted).toContain('https://api/checkout');
  });

  it('does not include the failed url itself', () => {
    const g = buildDependencyGraph(edges);
    const impacted = findImpacted(g, 'https://api/users');
    expect(impacted).not.toContain('https://api/users');
  });

  it('returns empty array for leaf node', () => {
    const g = buildDependencyGraph(edges);
    const impacted = findImpacted(g, 'https://api/checkout');
    expect(impacted).toHaveLength(0);
  });
});

describe('formatDependencyReport', () => {
  it('includes urls in output', () => {
    const g = buildDependencyGraph(edges);
    const out = formatDependencyReport(g);
    expect(out).toContain('https://api/orders');
    expect(out).toContain('depends on');
  });
});
