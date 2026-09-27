import type { LoanInput } from './loan';

/** Raw form state. Kept as strings so partial input like "5." isn't lost. */
export interface LoanFormValues {
  amount: string;
  rate: string;
  term: string;
}

export type LoanFormField = keyof LoanFormValues;
export type LoanFormErrors = Partial<Record<LoanFormField, string>>;

export type LoanValidationResult =
  { ok: true; value: LoanInput } | { ok: false; errors: LoanFormErrors };

// Plain decimals only: rejects "1e5", "0x10", "Infinity" etc., which Number() would accept.
const DECIMAL = /^-?(\d+\.?\d*|\.\d+)$/;

/** Returns null for empty input, NaN for anything that isn't a plain number. */
export function parseNumber(raw: string): number | null {
  // Allow thousands separators and stray spaces: "200,000" → 200000.
  const cleaned = raw.replace(/[,\s]/g, '');
  if (cleaned === '') return null;
  return DECIMAL.test(cleaned) ? Number(cleaned) : NaN;
}

export function validateAmount(raw: string): string | undefined {
  const value = parseNumber(raw);
  if (value === null) return 'Enter a loan amount';
  if (Number.isNaN(value)) return 'Enter a number, e.g. 200000';
  if (value <= 0) return 'Loan amount must be more than £0';
}

export function validateRate(raw: string): string | undefined {
  const value = parseNumber(raw);
  if (value === null) return 'Enter an interest rate';
  if (Number.isNaN(value)) return 'Enter a number, e.g. 5.5';
  if (value < 0 || value > 100)
    return 'Interest rate must be between 0 and 100';
}

export function validateTerm(raw: string): string | undefined {
  const value = parseNumber(raw);
  if (value === null) return 'Enter a loan term';
  if (Number.isNaN(value)) return 'Enter a number, e.g. 25';
  // Check the text, not the number: "25.0" parses to the integer 25 but isn't a whole number as typed.
  if (raw.includes('.')) return 'Term must be a whole number of years';
  if (value < 1 || value > 30) return 'Term must be between 1 and 30 years';
}

export function validateLoanForm(values: LoanFormValues): LoanValidationResult {
  const errors: LoanFormErrors = {};
  const amountError = validateAmount(values.amount);
  const rateError = validateRate(values.rate);
  const termError = validateTerm(values.term);
  if (amountError) errors.amount = amountError;
  if (rateError) errors.rate = rateError;
  if (termError) errors.term = termError;

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      principal: parseNumber(values.amount)!,
      annualRatePercent: parseNumber(values.rate)!,
      termYears: parseNumber(values.term)!,
    },
  };
}
