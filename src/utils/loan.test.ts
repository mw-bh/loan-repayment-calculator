import { describe, expect, test } from 'vitest';
import {
  calculateLoanSummary,
  calculateMonthlyPayment,
  type LoanInput,
} from './loan';

// The core business logic: if these figures are wrong, nothing else matters.
// Expected values cross-checked against the README formula computed independently.
describe('calculateLoanSummary', () => {
  test('£200,000 at 5.5% over 25 years', () => {
    const input: LoanInput = {
      principal: 200_000,
      annualRatePercent: 5.5,
      termYears: 25,
    };

    const summary = calculateLoanSummary(input);

    expect(summary.numberOfPayments).toBe(300);
    // Unrounded value is £1,228.17498…, a hair under the .175 rounding boundary,
    // so asserted tightly rather than to 2dp (which would pass by luck).
    expect(summary.monthlyPayment).toBeCloseTo(1228.17498, 5);
    expect(summary.totalRepaid).toBeCloseTo(368_452.4954, 3);
    expect(summary.totalInterest).toBeCloseTo(168_452.4954, 3);
  });

  test('0% interest divides the principal evenly (no divide-by-zero)', () => {
    const input: LoanInput = {
      principal: 12_000,
      annualRatePercent: 0,
      termYears: 1,
    };

    const summary = calculateLoanSummary(input);

    expect(summary.monthlyPayment).toBe(1000);
    expect(summary.totalRepaid).toBe(12_000);
    expect(summary.totalInterest).toBe(0);
  });

  test('totals are consistent: repaid = principal + interest', () => {
    const input: LoanInput = {
      principal: 15_000,
      annualRatePercent: 7.9,
      termYears: 5,
    };

    const summary = calculateLoanSummary(input);

    expect(summary.totalRepaid).toBeCloseTo(
      input.principal + summary.totalInterest,
      8,
    );
  });
});

describe('calculateMonthlyPayment', () => {
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
