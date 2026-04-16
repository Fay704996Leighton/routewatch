import { describe, it, expect } from 'vitest';
import { matchesTags, filterByTags, collectTags, Tagged } from './tags';

const makeItem = (tags?: string[]): Tagged => ({ tags });

describe('matchesTags', () => {
  it('returns true when no filter is set', () => {
    expect(matchesTags(makeItem(['a']), {})).toBe(true);
  });

  it('returns true when item has included tag', () => {
    expect(matchesTags(makeItem(['api', 'critical']), { include: ['critical'] })).toBe(true);
  });

  it('returns false when item lacks all included tags', () => {
    expect(matchesTags(makeItem(['api']), { include: ['critical'] })).toBe(false);
  });

  it('returns false when item has excluded tag', () => {
    expect(matchesTags(makeItem(['api', 'slow']), { exclude: ['slow'] })).toBe(false);
  });

  it('returns true when item has no excluded tags', () => {
    expect(matchesTags(makeItem(['api']), { exclude: ['slow'] })).toBe(true);
  });

  it('handles items with no tags', () => {
    expect(matchesTags(makeItem(), { include: ['api'] })).toBe(false);
    expect(matchesTags(makeItem(), { exclude: ['api'] })).toBe(true);
    expect(matchesTags(makeItem(), {})).toBe(true);
  });

  it('applies both include and exclude', () => {
    expect(matchesTags(makeItem(['api', 'slow']), { include: ['api'], exclude: ['slow'] })).toBe(false);
    expect(matchesTags(makeItem(['api']), { include: ['api'], exclude: ['slow'] })).toBe(true);
  });
});

describe('filterByTags', () => {
  const items = [
    { tags: ['api', 'critical'], name: 'a' },
    { tags: ['api'], name: 'b' },
    { tags: ['internal'], name: 'c' },
  ];

  it('filters by include', () => {
    const result = filterByTags(items, { include: ['critical'] });
    expect(result.map((r) => r.name)).toEqual(['a']);
  });

  it('filters by exclude', () => {
    const result = filterByTags(items, { exclude: ['internal'] });
    expect(result.map((r) => r.name)).toEqual(['a', 'b']);
  });

  it('returns all when filter is empty', () => {
    expect(filterByTags(items, {})).toHaveLength(3);
  });
});

describe('collectTags', () => {
  it('collects unique sorted tags', () => {
    const items = [makeItem(['b', 'a']), makeItem(['c', 'a'])];
    expect(collectTags(items)).toEqual(['a', 'b', 'c']);
  });

  it('handles empty tags', () => {
    expect(collectTags([makeItem(), makeItem([])])).toEqual([]);
  });
});
