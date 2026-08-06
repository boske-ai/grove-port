import { describe, expect, test } from 'bun:test';
import { isConvertAdapterName, SUPPORTED_CONVERT_ADAPTERS } from './adapters.js';

describe('isConvertAdapterName', () => {
  test('accepts every supported adapter', () => {
    for (const name of SUPPORTED_CONVERT_ADAPTERS) {
      expect(isConvertAdapterName(name)).toBe(true);
    }
  });

  test('rejects unknown names', () => {
    expect(isConvertAdapterName('nope')).toBe(false);
    expect(isConvertAdapterName('')).toBe(false);
  });

  test('rejects inherited Object.prototype keys', () => {
    // Regression: `value in ADAPTERS` let these through, so `--from constructor`
    // reached `ADAPTERS[from].preview(...)` and crashed.
    for (const key of ['constructor', 'toString', 'valueOf', '__proto__', 'hasOwnProperty']) {
      expect(isConvertAdapterName(key)).toBe(false);
    }
  });

  test('does not list the retired Mistral adapter', () => {
    expect(isConvertAdapterName('mistral')).toBe(false);
  });
});
