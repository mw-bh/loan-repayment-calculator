import { useMemo, useState, type ChangeEvent } from 'react';
import {
  AmortisationTable,
  Card,
  FormField,
  Layout,
  Stat,
  StatGrid,
} from './components';
import { formatCurrency } from './utils/format';
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

  // Derived from `values` rather than stored, so it can never go stale.
  // Memoised on `values` so the schedule keeps the same identity across
  // renders that don't change the inputs (e.g. blur), letting the memoised
  // table skip re-rendering 360 rows.
  const { validation, schedule } = useMemo(() => {
    const result = validateLoanForm(values);
    return {
      validation: result,
      schedule: result.ok ? buildAmortisationSchedule(result.value) : null,
    };
  }, [values]);
  const summary = schedule ? summariseSchedule(schedule) : null;

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

      <Card title="Summary">
        {summary ? (
          <>
            <StatGrid>
              <Stat
                label="Monthly repayment"
                value={formatCurrency(summary.monthlyPayment)}
              />
              <Stat
                label="Total repaid"
                value={formatCurrency(summary.totalRepaid)}
              />
              <Stat
                label="Total interest"
                value={formatCurrency(summary.totalInterest)}
              />
            </StatGrid>
            {summary.finalPayment !== summary.monthlyPayment && (
              <p className="mt-3 text-xs text-gray-500">
                Final payment of {formatCurrency(summary.finalPayment)} settles
                the pence left over from rounding each payment.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">
            Enter your loan details to see your repayments.
          </p>
        )}
      </Card>

      <Card title="Amortisation schedule">
        {schedule ? (
          <AmortisationTable schedule={schedule} />
        ) : (
          <p className="text-sm text-gray-500">
            Your month-by-month schedule will appear here.
          </p>
        )}
      </Card>
    </Layout>
  );
}
