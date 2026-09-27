import { describe, expect, test } from 'vitest';
import { formatCurrency, formatIsoDate } from './format';

describe('formatCurrency', () => {
  test.each([
    ['GBP', 1228.17, '£1,228.17'],
    ['USD', 1632.12, 'US$1,632.12'],
    ['EUR', 1434.14, '€1,434.14'],
    // Intl separates the code with a non-breaking space.
    ['CHF', 1338.34, 'CHF 1,338.34'],
    // JPY has no minor unit, so Intl rounds to whole yen.
    ['JPY', 267_151.54, 'JP¥267,152'],
  ])('formats %s with its own minor units', (currency, amount, expected) => {
    const value = amount;

    const formatted = formatCurrency(value, currency);

    expect(formatted).toBe(expected);
  });
});

describe('formatIsoDate', () => {
  test('formats an ISO date without shifting the day', () => {
    const isoDate = '2026-07-29';

    const formatted = formatIsoDate(isoDate);

    expect(formatted).toBe('29 Jul 2026');
  });
});
