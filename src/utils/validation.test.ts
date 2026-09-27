import { describe, expect, test } from 'vitest';
import {
  parseNumber,
  validateAmount,
  validateLoanForm,
  validateRate,
  validateTerm,
  type LoanFormValues,
} from './validation';

describe('parseNumber', () => {
  test.each([
    ['200000', 200_000],
    ['5.5', 5.5],
    ['0', 0],
    ['-100', -100],
    ['.5', 0.5],
    ['5.', 5],
  ])('parses plain decimal %j as %d', (raw, expected) => {
    const input = raw;

    const result = parseNumber(input);

    expect(result).toBe(expected);
  });

  test.each([
    ['200,000', 200_000],
    ['1,000,000.50', 1_000_000.5],
    [' 5.5 ', 5.5],
    ['200 000', 200_000],
  ])('ignores separators and whitespace in %j', (raw, expected) => {
    const input = raw;

    const result = parseNumber(input);

    expect(result).toBe(expected);
  });

  test.each(['', '   ', ',,'])('returns null for empty input %j', (raw) => {
    const input = raw;

    const result = parseNumber(input);

    expect(result).toBeNull();
  });

  test.each(['abc', '1e5', '0x10', 'Infinity', '1.2.3', '.', '-', '£200'])(
    'returns NaN for non-plain-decimal %j',
    (raw) => {
      const input = raw;

      const result = parseNumber(input);

      expect(result).toBeNaN();
    },
  );
});

describe('validateAmount', () => {
  test.each(['200000', '200,000', '0.01'])('accepts %j', (raw) => {
    const input = raw;

    const error = validateAmount(input);

    expect(error).toBeUndefined();
  });

  test.each([
    ['', 'Enter a loan amount'],
    ['abc', 'Enter a number, e.g. 200000'],
    ['1e5', 'Enter a number, e.g. 200000'],
    ['0', 'Loan amount must be more than £0'],
    ['-100', 'Loan amount must be more than £0'],
  ])('rejects %j with %j', (raw, message) => {
    const input = raw;

    const error = validateAmount(input);

    expect(error).toBe(message);
  });
});

describe('validateRate', () => {
  test.each(['0', '5.5', '100'])('accepts %j (bounds inclusive)', (raw) => {
    const input = raw;

    const error = validateRate(input);

    expect(error).toBeUndefined();
  });

  test.each([
    ['', 'Enter an interest rate'],
    ['abc', 'Enter a number, e.g. 5.5'],
    ['-0.1', 'Interest rate must be between 0 and 100'],
    ['100.1', 'Interest rate must be between 0 and 100'],
  ])('rejects %j with %j', (raw, message) => {
    const input = raw;

    const error = validateRate(input);

    expect(error).toBe(message);
  });
});

describe('validateTerm', () => {
  test.each(['1', '25', '30'])('accepts %j (bounds inclusive)', (raw) => {
    const input = raw;

    const error = validateTerm(input);

    expect(error).toBeUndefined();
  });

  test.each([
    ['', 'Enter a loan term'],
    ['abc', 'Enter a number, e.g. 25'],
    ['2.5', 'Term must be a whole number of years'],
    ['25.0', 'Term must be a whole number of years'],
    ['25.', 'Term must be a whole number of years'],
    ['0', 'Term must be between 1 and 30 years'],
    ['31', 'Term must be between 1 and 30 years'],
    ['-5', 'Term must be between 1 and 30 years'],
  ])('rejects %j with %j', (raw, message) => {
    const input = raw;

    const error = validateTerm(input);

    expect(error).toBe(message);
  });
});

describe('validateLoanForm', () => {
  const valid: LoanFormValues = { amount: '200000', rate: '5.5', term: '25' };

  test('returns parsed numbers when every field is valid', () => {
    const values: LoanFormValues = {
      amount: '200,000',
      rate: '5.5',
      term: '25',
    };

    const result = validateLoanForm(values);

    expect(result).toEqual({
      ok: true,
      value: { principal: 200_000, annualRatePercent: 5.5, termYears: 25 },
    });
  });

  test('reports only the field that is invalid', () => {
    const values: LoanFormValues = { ...valid, rate: '150' };

    const result = validateLoanForm(values);

    expect(result).toEqual({
      ok: false,
      errors: { rate: 'Interest rate must be between 0 and 100' },
    });
  });

  test('reports every invalid field at once', () => {
    const values: LoanFormValues = { amount: '', rate: 'abc', term: '2.5' };

    const result = validateLoanForm(values);

    expect(result).toEqual({
      ok: false,
      errors: {
        amount: 'Enter a loan amount',
        rate: 'Enter a number, e.g. 5.5',
        term: 'Term must be a whole number of years',
      },
    });
  });
});
