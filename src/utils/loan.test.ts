import { describe, expect, test } from 'vitest';
import {
  buildAmortisationSchedule,
  calculateMonthlyPayment,
  summariseSchedule,
  type LoanInput,
} from './loan';

// The core business logic: if these figures are wrong, nothing else matters.
// Expected values cross-checked against the README formula computed independently.
const reference: LoanInput = {
  principal: 200_000,
  annualRatePercent: 5.5,
  termYears: 25,
};

// Compare money in whole pence so floating-point noise can't cause false failures.
const pence = (pounds: number) => Math.round(pounds * 100);

describe('calculateMonthlyPayment', () => {
  test('£200,000 at 5.5% over 25 years', () => {
    const input = reference;

    const payment = calculateMonthlyPayment(input);

    // Unrounded value is £1,228.17498…, a hair under the .175 rounding boundary,
    // so asserted tightly rather than to 2dp (which would pass by luck).
    expect(payment).toBeCloseTo(1228.17498, 5);
  });

  test('0% interest divides the principal evenly (no divide-by-zero)', () => {
    const input: LoanInput = {
      principal: 12_000,
      annualRatePercent: 0,
      termYears: 1,
    };

    const payment = calculateMonthlyPayment(input);

    expect(payment).toBe(1000);
  });

  test('handles boundary inputs (100%, 30 years) without overflow', () => {
    const input: LoanInput = {
      principal: 1_000,
      annualRatePercent: 100,
      termYears: 30,
    };
    // At very high rates the payment approaches interest-only: P × r.
    const interestOnlyPayment = input.principal * (1 / 12);

    const payment = calculateMonthlyPayment(input);

    expect(Number.isFinite(payment)).toBe(true);
    expect(payment).toBeCloseTo(interestOnlyPayment, 2);
  });
});

describe('buildAmortisationSchedule', () => {
  test('first month splits the payment into interest and principal', () => {
    const input = reference;

    const [first] = buildAmortisationSchedule(input);

    expect(first).toEqual({
      month: 1,
      openingBalance: 200_000,
      payment: 1228.17,
      interest: 916.67,
      principal: 311.5,
      closingBalance: 199_688.5,
    });
  });

  test('final month settles the remaining balance to exactly £0.00', () => {
    const input = reference;

    const schedule = buildAmortisationSchedule(input);

    expect(schedule.at(-1)).toEqual({
      month: 300,
      openingBalance: 1225.69,
      payment: 1231.31,
      interest: 5.62,
      principal: 1225.69,
      closingBalance: 0,
    });
  });

  test('every payment except the last is the same fixed amount', () => {
    const input = reference;

    const schedule = buildAmortisationSchedule(input);

    const regularPayments = new Set(
      schedule.slice(0, -1).map((r) => r.payment),
    );
    expect([...regularPayments]).toEqual([1228.17]);
  });

  test('0% interest charges no interest and still clears the balance', () => {
    const input: LoanInput = {
      principal: 1_000,
      annualRatePercent: 0,
      termYears: 3,
    };

    const schedule = buildAmortisationSchedule(input);

    expect(schedule.every((row) => row.interest === 0)).toBe(true);
    expect(schedule[0].payment).toBe(27.77);
    expect(schedule.at(-1)?.payment).toBe(28.05);
  });

  // Invariants that must hold for any valid loan, including extremes where
  // rounding is most likely to go wrong.
  describe.each<[string, LoanInput]>([
    ['reference mortgage', reference],
    ['car loan', { principal: 15_000, annualRatePercent: 7.9, termYears: 5 }],
    [
      'long, low rate',
      { principal: 250_000, annualRatePercent: 3.75, termYears: 30 },
    ],
    [
      'short, high rate',
      { principal: 5_000, annualRatePercent: 12, termYears: 2 },
    ],
    [
      'maximum rate and term',
      { principal: 1_000, annualRatePercent: 100, termYears: 30 },
    ],
    [
      'tiny 0% loan over 30 years',
      { principal: 100, annualRatePercent: 0, termYears: 30 },
    ],
  ])('%s', (_name, input) => {
    test('has one row per month of the term', () => {
      const expectedMonths = input.termYears * 12;

      const schedule = buildAmortisationSchedule(input);

      expect(schedule.map((row) => row.month)).toEqual(
        Array.from({ length: expectedMonths }, (_, i) => i + 1),
      );
    });

    test('ends with a closing balance of exactly zero', () => {
      const loan = input;

      const schedule = buildAmortisationSchedule(loan);

      expect(schedule.at(-1)?.closingBalance).toBe(0);
    });

    test('each row balances and carries over to the next', () => {
      const loan = input;

      const schedule = buildAmortisationSchedule(loan);

      schedule.forEach((row, i) => {
        expect(pence(row.interest) + pence(row.principal)).toBe(
          pence(row.payment),
        );
        expect(pence(row.openingBalance) - pence(row.principal)).toBe(
          pence(row.closingBalance),
        );
        if (i > 0) {
          expect(row.openingBalance).toBe(schedule[i - 1].closingBalance);
        }
      });
    });

    test('repays exactly the amount borrowed', () => {
      const loan = input;

      const schedule = buildAmortisationSchedule(loan);

      const principalRepaid = schedule.reduce(
        (sum, row) => sum + pence(row.principal),
        0,
      );
      expect(principalRepaid).toBe(pence(loan.principal));
    });
  });
});

describe('summariseSchedule', () => {
  test('totals the reference schedule', () => {
    const schedule = buildAmortisationSchedule(reference);

    const summary = summariseSchedule(schedule);

    expect(summary).toEqual({
      monthlyPayment: 1228.17,
      finalPayment: 1231.31,
      totalRepaid: 368_454.14,
      totalInterest: 168_454.14,
      numberOfPayments: 300,
    });
  });

  test('total repaid equals principal plus total interest', () => {
    const input: LoanInput = {
      principal: 15_000,
      annualRatePercent: 7.9,
      termYears: 5,
    };
    const schedule = buildAmortisationSchedule(input);

    const summary = summariseSchedule(schedule);

    expect(pence(summary.totalRepaid)).toBe(
      pence(input.principal) + pence(summary.totalInterest),
    );
  });
});
