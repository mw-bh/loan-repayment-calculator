import { useCallback, useEffect, useState } from 'react';
import {
  ExchangeRateError,
  type ExchangeRateErrorKind,
} from '../utils/exchangeRateError';
import { fetchExchangeRates, type ExchangeRates } from '../utils/exchangeRates';
import { reportError } from '../utils/reportError';

/**
 * A discriminated union rather than separate `loading` / `error` / `data`
 * flags, so impossible combinations (e.g. loading with an error) can't exist.
 */
export type ExchangeRatesState =
  | { status: 'loading' }
  | { status: 'success'; data: ExchangeRates }
  | { status: 'error'; kind: ExchangeRateErrorKind };

/** Anything that isn't already an ExchangeRateError is unexpected — likely a bug. */
function toExchangeRateError(error: unknown): ExchangeRateError {
  if (error instanceof ExchangeRateError) return error;
  return new ExchangeRateError(
    'unknown',
    'Unexpected error loading exchange rates',
    { cause: error },
  );
}

export function useExchangeRates() {
  const [state, setState] = useState<ExchangeRatesState>({
    status: 'loading',
  });
  // Bumping this re-runs the effect, which is how "Try again" refetches.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Aborted on unmount or before a newer attempt (including React
    // StrictMode's double-run in dev). An aborted request isn't a failure,
    // so it's neither logged nor shown.
    const controller = new AbortController();

    fetchExchangeRates({ signal: controller.signal }).then(
      (data) => {
        if (!controller.signal.aborted) setState({ status: 'success', data });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        const rateError = toExchangeRateError(error);
        reportError(rateError, {
          source: 'exchange-rates',
          kind: rateError.kind,
          status: rateError.status,
        });
        setState({ status: 'error', kind: rateError.kind });
      },
    );

    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
}
