import { ExchangeRateError } from './exchangeRateError';

/** Give up after this long so a hanging request can't leave us loading forever. */
export const RATES_TIMEOUT_MS = 10_000;

export const BASE_CURRENCY = 'GBP';
export const CURRENCIES = [BASE_CURRENCY, 'USD', 'EUR', 'JPY', 'CHF'] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Units of each currency per 1 GBP. GBP itself is always 1. */
export type Rates = Record<Currency, number>;

export interface ExchangeRates {
  /** ISO date the rates were published, e.g. "2026-07-29". */
  date: string;
  rates: Rates;
}

const TARGET_CURRENCIES = CURRENCIES.filter((c) => c !== BASE_CURRENCY);

// Only request the currencies we offer, to keep the payload small.
export const RATES_URL = `https://api.frankfurter.dev/v1/latest?from=${BASE_CURRENCY}&to=${TARGET_CURRENCIES.join(',')}`;

/**
 * Validates the API response at runtime rather than trusting its shape.
 * A missing or nonsensical rate is treated as a failure for the whole
 * response, so we never show a mix of real and made-up conversions.
 */
export function parseRatesResponse(data: unknown): ExchangeRates {
  const invalid = (message: string) =>
    new ExchangeRateError('invalid-data', message);

  if (typeof data !== 'object' || data === null) {
    throw invalid('Unexpected exchange rate response');
  }
  const { base, date, rates } = data as Record<string, unknown>;
  if (base !== BASE_CURRENCY) {
    throw invalid(`Expected rates based on ${BASE_CURRENCY}`);
  }
  if (typeof date !== 'string' || typeof rates !== 'object' || rates === null) {
    throw invalid('Unexpected exchange rate response');
  }

  const parsed = { [BASE_CURRENCY]: 1 } as Rates;
  for (const currency of TARGET_CURRENCIES) {
    const rate = (rates as Record<string, unknown>)[currency];
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
      throw invalid(`Missing or invalid rate for ${currency}`);
    }
    parsed[currency] = rate;
  }

  return { date, rates: parsed };
}

interface FetchExchangeRatesOptions {
  /** Abort from the caller (e.g. on unmount). Rejects with the abort reason, not an ExchangeRateError. */
  signal?: AbortSignal;
  timeoutMs?: number;
}

/**
 * Fetches and validates today's rates. Every failure is thrown as an
 * ExchangeRateError with a `kind`, so callers can log and branch on it —
 * except a caller-initiated abort, which isn't a failure and is rethrown as-is.
 */
export async function fetchExchangeRates({
  signal,
  timeoutMs = RATES_TIMEOUT_MS,
}: FetchExchangeRatesOptions = {}): Promise<ExchangeRates> {
  // Our own controller lets us tell "we timed out" apart from "caller aborted";
  // to fetch, both look like the same AbortError.
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const forwardAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', forwardAbort);

  // Classifies a rejection from fetch() or response.json().
  const classify = (cause: unknown, fallback: ExchangeRateError) => {
    if (signal?.aborted) return cause;
    if (timedOut) {
      return new ExchangeRateError(
        'timeout',
        `No response from the exchange rate service within ${timeoutMs / 1000}s`,
        { cause },
      );
    }
    return fallback;
  };

  try {
    let response: Response;
    try {
      response = await fetch(RATES_URL, { signal: controller.signal });
    } catch (cause) {
      throw classify(
        cause,
        new ExchangeRateError(
          'network',
          'Could not reach the exchange rate service',
          { cause },
        ),
      );
    }

    if (!response.ok) {
      throw new ExchangeRateError(
        'http',
        `Exchange rate request failed (${response.status})`,
        { status: response.status },
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (cause) {
      throw classify(
        cause,
        new ExchangeRateError(
          'invalid-json',
          'Exchange rate response was not valid JSON',
          { cause },
        ),
      );
    }

    return parseRatesResponse(body);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forwardAbort);
  }
}
