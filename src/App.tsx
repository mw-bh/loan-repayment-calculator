import { useMemo, useState, type ChangeEvent } from 'react';
import {
  Alert,
  AmortisationTable,
  Card,
  FormField,
  Layout,
  Select,
  Stat,
  StatGrid,
} from './components';
import { useExchangeRates } from './hooks/useExchangeRates';
import {
  BASE_CURRENCY,
  CURRENCIES,
  type Currency,
} from './utils/exchangeRates';
import { formatCurrency, formatIsoDate } from './utils/format';
import { buildAmortisationSchedule, summariseSchedule } from './utils/loan';
import {
  validateLoanForm,
  type LoanFormField,
  type LoanFormValues,
} from './utils/validation';

const initialValues: LoanFormValues = { amount: '', rate: '', term: '' };
const untouched: Record<LoanFormField, boolean> = {
  amount: false,
  rate: false,
  term: false,
};

export default function App() {
  const [values, setValues] = useState(initialValues);
  // Errors only show once a field has been left, so users aren't told off mid-typing.
  const [touched, setTouched] = useState(untouched);
  const [selectedCurrency, setSelectedCurrency] =
    useState<Currency>(BASE_CURRENCY);
  const { state: ratesState, retry: retryRates } = useExchangeRates();

  // Derived from `values` rather than stored, so it can never go stale.
  // Memoised on `values` so the schedule keeps the same identity across
  // renders that don't change the inputs (e.g. blur or a currency change),
  // letting the memoised table skip rebuilding.
  const { validation, schedule } = useMemo(() => {
    const result = validateLoanForm(values);
    return {
      validation: result,
      schedule: result.ok ? buildAmortisationSchedule(result.value) : null,
    };
  }, [values]);
  const summary = schedule ? summariseSchedule(schedule) : null;

  // Everything is calculated in GBP; conversion happens only at display time.
  // Without live rates we fall back to GBP so the calculator keeps working.
  const ratesReady = ratesState.status === 'success';
  const currency = ratesReady ? selectedCurrency : BASE_CURRENCY;
  const rate = ratesReady ? ratesState.data.rates[currency] : 1;
  const money = (gbp: number) => formatCurrency(gbp * rate, currency);

  const fieldProps = (field: LoanFormField) => ({
    name: field,
    value: values[field],
    onChange: (e: ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value })),
    onBlur: () => setTouched((t) => ({ ...t, [field]: true })),
    error:
      touched[field] && !validation.ok ? validation.errors[field] : undefined,
    required: true,
    autoComplete: 'off',
  });

  const currencyControls = (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        label="Currency"
        value={currency}
        onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
      >
        {CURRENCIES.map((code) => (
          <option
            key={code}
            value={code}
            // Only GBP is usable until live rates arrive.
            disabled={code !== BASE_CURRENCY && !ratesReady}
          >
            {code}
          </option>
        ))}
      </Select>
      <span className="text-xs text-gray-500">
        {ratesState.status === 'loading' && 'Loading exchange rates…'}
        {ratesState.status === 'success' &&
          `Rates: ${formatIsoDate(ratesState.data.date)}`}
      </span>
    </div>
  );

  return (
    <Layout title="Loan Repayment Calculator">
      <Card title="Loan details">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            label="Loan amount"
            prefix="£"
            inputMode="decimal"
            placeholder="200,000"
            hint="Required, must be positive"
            {...fieldProps('amount')}
          />
          <FormField
            label="Annual interest rate"
            suffix="%"
            inputMode="decimal"
            placeholder="5.5"
            hint="Required, 0–100"
            {...fieldProps('rate')}
          />
          <FormField
            label="Loan term (years)"
            inputMode="numeric"
            placeholder="25"
            hint="Required, whole number 1–30"
            {...fieldProps('term')}
          />
        </div>
      </Card>

      <Card title="Summary" actions={currencyControls}>
        {summary ? (
          <>
            <StatGrid>
              <Stat
                label="Monthly repayment"
                value={money(summary.monthlyPayment)}
              />
              <Stat label="Total repaid" value={money(summary.totalRepaid)} />
              <Stat
                label="Total interest"
                value={money(summary.totalInterest)}
              />
            </StatGrid>
            {summary.finalPayment !== summary.monthlyPayment && (
              <p className="mt-3 text-xs text-gray-500">
                Final payment of {money(summary.finalPayment)} settles the pence
                left over from rounding each payment.
              </p>
            )}
            {currency !== BASE_CURRENCY && (
              <p className="mt-1 text-xs text-gray-500">
                Converted from GBP at 1 GBP = {rate} {currency}.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">
            Enter your loan details to see your repayments.
          </p>
        )}
        {/* Announces currency changes to screen readers; visually hidden. */}
        <p role="status" className="sr-only">
          {`Amounts shown in ${currency}`}
        </p>
      </Card>

      {/* Always mounted so screen readers announce the message when it appears. */}
      <Alert tone="warning">
        {ratesState.status === 'error' && (
          <>
            Live exchange rates unavailable — showing amounts in GBP.{' '}
            <button
              type="button"
              onClick={retryRates}
              className="font-medium underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Try again
            </button>
          </>
        )}
      </Alert>

      <Card title="Amortisation schedule">
        {schedule ? (
          <AmortisationTable
            schedule={schedule}
            currency={currency}
            rate={rate}
          />
        ) : (
          <p className="text-sm text-gray-500">
            Your month-by-month schedule will appear here.
          </p>
        )}
      </Card>
    </Layout>
  );
}