export interface DependencyEdge {
  from: string;
  to: string;
  weight?: number;
}

export interface DependencyNode {
  url: string;
  dependsOn: string[];
  dependents: string[];
}

export interface DependencyGraph {
  nodes: Record<string, DependencyNode>;
  edges: DependencyEdge[];
}

export function buildDependencyGraph(edges: DependencyEdge[]): DependencyGraph {
  const nodes: Record<string, DependencyNode> = {};

  const ensure = (url: string) => {
    if (!nodes[url]) nodes[url] = { url, dependsOn: [], dependents: [] };
  };

  for (const edge of edges) {
    ensure(edge.from);
    ensure(edge.to);
    nodes[edge.from].dependsOn.push(edge.to);
    nodes[edge.to].dependents.push(edge.from);
  }

  return { nodes, edges };
}

export function findImpacted(graph: DependencyGraph, failedUrl: string): string[] {
  const visited = new Set<string>();
  const queue = [failedUrl];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const node = graph.nodes[current];
    if (!node) continue;
    for (const dep of node.dependents) {
      if (!visited.has(dep)) {
        visited.add(dep);
        queue.push(dep);
      }
    }
  }

  visited.delete(failedUrl);
  return Array.from(visited);
}

export function dependencyToJson(graph: DependencyGraph): string {
  return JSON.stringify(graph, null, 2);
}

export function formatDependencyReport(graph: DependencyGraph): string {
  const lines: string[] = ['Dependency Graph:'];
  for (const node of Object.values(graph.nodes)) {
    lines.push(`  ${node.url}`);
    if (node.dependsOn.length > 0)
      lines.push(`    depends on: ${node.dependsOn.join(', ')}`);
    if (node.dependents.length > 0)
      lines.push(`    depended by: ${node.dependents.join(', ')}`);
  }
  return lines.join('\n');
}
