export interface LoanInput {
  /** Amount borrowed, in GBP. */
  principal: number;
  /** Annual interest rate as a percentage, e.g. 5.5 for 5.5%. */
  annualRatePercent: number;
  /** Whole number of years. */
  termYears: number;
}

export interface LoanSummary {
  monthlyPayment: number;
  totalRepaid: number;
  totalInterest: number;
  numberOfPayments: number;
}

/**
 * Standard annuity formula: M = P × r(1+r)ⁿ / ((1+r)ⁿ − 1).
 * Falls back to P / n at 0% to avoid dividing by zero.
 *
 * Values are returned unrounded; rounding to pence happens only at display
 * time so errors don't compound across the schedule.
 */
export function calculateMonthlyPayment({
  principal,
  annualRatePercent,
  termYears,
}: LoanInput): number {
  const monthlyRate = annualRatePercent / 100 / 12;
  const numberOfPayments = termYears * 12;

  if (monthlyRate === 0) return principal / numberOfPayments;

  const growth = (1 + monthlyRate) ** numberOfPayments;
  return (principal * (monthlyRate * growth)) / (growth - 1);
}

export function calculateLoanSummary(input: LoanInput): LoanSummary {
  const numberOfPayments = input.termYears * 12;
  const monthlyPayment = calculateMonthlyPayment(input);
  const totalRepaid = monthlyPayment * numberOfPayments;

  return {
    monthlyPayment,
    totalRepaid,
    totalInterest: totalRepaid - input.principal,
    numberOfPayments,
  };
}
