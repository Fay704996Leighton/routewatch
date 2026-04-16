/**
 * Tag-based filtering for routes.
 * Allows routes to be grouped and selectively monitored.
 */

export interface TagFilter {
  include?: string[];
  exclude?: string[];
}

export interface Tagged {
  tags?: string[];
}

/**
 * Returns true if the item passes the tag filter.
 * - If include is set, item must have at least one matching tag.
 * - If exclude is set, item must not have any matching tag.
 */
export function matchesTags(item: Tagged, filter: TagFilter): boolean {
  const tags = item.tags ?? [];

  if (filter.include && filter.include.length > 0) {
    const hasIncluded = filter.include.some((t) => tags.includes(t));
    if (!hasIncluded) return false;
  }

  if (filter.exclude && filter.exclude.length > 0) {
    const hasExcluded = filter.exclude.some((t) => tags.includes(t));
    if (hasExcluded) return false;
  }

  return true;
}

/**
 * Filters a list of tagged items by the given tag filter.
 */
export function filterByTags<T extends Tagged>(items: T[], filter: TagFilter): T[] {
  return items.filter((item) => matchesTags(item, filter));
}

/**
 * Collects all unique tags from a list of tagged items.
 */
export function collectTags(items: Tagged[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    for (const tag of item.tags ?? []) {
      set.add(tag);
    }
  }
  return Array.from(set).sort();
}
