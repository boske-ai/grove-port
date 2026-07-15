import { describe, expect, test } from 'bun:test';
import { stableStringify } from './canonical.js';

describe('stableStringify', () => {
  test('sorts object keys', () => {
    const value = { z: 1, a: 2, m: { b: 1, a: 2 } };
    expect(stableStringify(value)).toBe('{"a":2,"m":{"a":2,"b":1},"z":1}');
  });

  test('drops undefined keys like JSON.stringify', () => {
    const value = { a: 1, b: undefined };
    expect(stableStringify(value)).toBe('{"a":1}');
  });
});
