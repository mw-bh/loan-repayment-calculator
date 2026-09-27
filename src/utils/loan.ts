export interface LoanInput {
  /** Amount borrowed, in GBP. */
  principal: number;
  /** Annual interest rate as a percentage, e.g. 5.5 for 5.5%. */
  annualRatePercent: number;
  /** Whole number of years. */
  termYears: number;
}

/** One month of the amortisation schedule. Amounts are in GBP, to the penny. */
export interface ScheduleRow {
  month: number;
  openingBalance: number;
  payment: number;
  interest: number;
  principal: number;
  closingBalance: number;
}

export interface LoanSummary {
  /** The regular monthly payment (every month except possibly the last). */
  monthlyPayment: number;
  /** The last payment, which settles any pence left over from rounding. */
  finalPayment: number;
  totalRepaid: number;
  totalInterest: number;
  numberOfPayments: number;
}

const toPence = (pounds: number) => Math.round(pounds * 100);
const toPounds = (pence: number) => pence / 100;

/**
 * Standard annuity formula: M = P × r(1+r)ⁿ / ((1+r)ⁿ − 1).
 * Falls back to P / n at 0% to avoid dividing by zero.
 *
 * Returns the exact (unrounded) value; see buildAmortisationSchedule for how
 * it's rounded to a payable amount.
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

/**
 * Month-by-month schedule, calculated in whole pence so it balances exactly.
 *
 * - The regular payment is the exact payment rounded DOWN to the penny.
 *   Rounding down (rather than to nearest or up) guarantees the loan is never
 *   paid off early, so the schedule always has exactly termYears × 12 rows.
 * - Each month's interest is rounded to the nearest penny.
 * - The final payment clears whatever balance remains, so the closing balance
 *   is exactly £0.00. It's usually a few pence more than the regular payment.
 */
export function buildAmortisationSchedule(input: LoanInput): ScheduleRow[] {
  const monthlyRate = input.annualRatePercent / 100 / 12;
  const numberOfPayments = input.termYears * 12;
  // Scrub floating-point noise (e.g. 2777.7799999) before flooring.
  const exactPaymentPence =
    Math.round(calculateMonthlyPayment(input) * 100 * 1e6) / 1e6;
  const regularPaymentPence = Math.floor(exactPaymentPence);

  const rows: ScheduleRow[] = [];
  let balancePence = toPence(input.principal);

  for (let month = 1; month <= numberOfPayments; month++) {
    const interestPence = Math.round(balancePence * monthlyRate);
    const isFinalMonth = month === numberOfPayments;
    const principalPence = isFinalMonth
      ? balancePence
      : Math.min(regularPaymentPence - interestPence, balancePence);
    const paymentPence = interestPence + principalPence;
    const closingPence = balancePence - principalPence;

    rows.push({
      month,
      openingBalance: toPounds(balancePence),
      payment: toPounds(paymentPence),
      interest: toPounds(interestPence),
      principal: toPounds(principalPence),
      closingBalance: toPounds(closingPence),
    });

    balancePence = closingPence;
  }

  return rows;
}

/** Totals derived from the schedule, so the summary always matches the table. */
export function summariseSchedule(schedule: ScheduleRow[]): LoanSummary {
  let repaidPence = 0;
  let interestPence = 0;
  for (const row of schedule) {
    repaidPence += toPence(row.payment);
    interestPence += toPence(row.interest);
  }

  return {
    monthlyPayment: schedule[0].payment,
    finalPayment: schedule[schedule.length - 1].payment,
    totalRepaid: toPounds(repaidPence),
    totalInterest: toPounds(interestPence),
    numberOfPayments: schedule.length,
  };
}
