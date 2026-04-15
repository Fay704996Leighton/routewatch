import { checkSchemaDrift, flattenKeys } from './schema-checker';

describe('checkSchemaDrift', () => {
  const baseline = { id: 1, name: 'Alice', active: true };

  it('returns no drift for identical schemas', () => {
    const result = checkSchemaDrift('/users', baseline, { id: 2, name: 'Bob', active: false });
    expect(result.drifted).toBe(false);
    expect(result.missingKeys).toHaveLength(0);
    expect(result.typeMismatches).toHaveLength(0);
  });

  it('detects missing keys', () => {
    const result = checkSchemaDrift('/users', baseline, { id: 2 } as any);
    expect(result.drifted).toBe(true);
    expect(result.missingKeys).toContain('name');
    expect(result.missingKeys).toContain('active');
  });

  it('detects type mismatches', () => {
    const result = checkSchemaDrift('/users', baseline, { id: '1', name: 'Alice', active: true });
    expect(result.drifted).toBe(true);
    expect(result.typeMismatches[0]).toMatchObject({
      key: 'id',
      expected: 'number',
      actual: 'string',
    });
  });

  it('reports extra keys without marking as drifted', () => {
    const result = checkSchemaDrift('/users', baseline, { id: 1, name: 'Alice', active: true, extra: 'x' });
    expect(result.drifted).toBe(false);
    expect(result.extraKeys).toContain('extra');
  });

  it('detects array vs object mismatch', () => {
    const result = checkSchemaDrift('/items', { tags: ['a'] }, { tags: { 0: 'a' } } as any);
    expect(result.typeMismatches[0]).toMatchObject({ key: 'tags', expected: 'array', actual: 'object' });
  });
});

describe('flattenKeys', () => {
  it('flattens nested objects', () => {
    const obj = { user: { id: 1, name: 'Alice' }, active: true };
    const flat = flattenKeys(obj);
    expect(flat).toMatchObject({
      'user.id': 'number',
      'user.name': 'string',
      active: 'boolean',
    });
  });

  it('marks arrays correctly', () => {
    const flat = flattenKeys({ tags: ['a', 'b'] });
    expect(flat['tags']).toBe('array');
  });
});
