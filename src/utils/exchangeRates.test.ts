import { describe, expect, test, vi } from 'vitest';
import { ExchangeRateError } from './exchangeRateError';
import {
  fetchExchangeRates,
  parseRatesResponse,
  RATES_TIMEOUT_MS,
  RATES_URL,
} from './exchangeRates';

const validResponse = {
  amount: 1,
  base: 'GBP',
  date: '2026-07-29',
  rates: { CHF: 1.0897, EUR: 1.1677, JPY: 217.52, USD: 1.3289 },
};

/** Returns whatever `fn` throws, so assertions can inspect it. */
function thrownBy(fn: () => unknown): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Expected function to throw');
}

/** A fetch that never responds on its own; it only rejects when aborted. */
const hangUntilAborted = (_url: string, init?: RequestInit) =>
  new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () =>
      reject(new DOMException('Aborted', 'AbortError')),
    );
  });

describe('parseRatesResponse', () => {
  test('returns the date and rates, with GBP fixed at 1', () => {
    const data = validResponse;

    const result = parseRatesResponse(data);

    expect(result).toEqual({
      date: '2026-07-29',
      rates: { GBP: 1, CHF: 1.0897, EUR: 1.1677, JPY: 217.52, USD: 1.3289 },
    });
  });

  test.each([null, 'oops', 42])('rejects a non-object body %j', (data) => {
    const body = data;

    const error = thrownBy(() => parseRatesResponse(body));

    expect(error).toBeInstanceOf(ExchangeRateError);
    expect(error).toMatchObject({
      kind: 'invalid-data',
      message: 'Unexpected exchange rate response',
    });
  });

  test('rejects rates based on a different currency', () => {
    const data = { ...validResponse, base: 'EUR' };

    const error = thrownBy(() => parseRatesResponse(data));

    expect(error).toMatchObject({
      kind: 'invalid-data',
      message: 'Expected rates based on GBP',
    });
  });

  test('rejects a response with a currency missing', () => {
    const rates: Record<string, number> = { ...validResponse.rates };
    delete rates.USD;
    const data = { ...validResponse, rates };

    const error = thrownBy(() => parseRatesResponse(data));

    expect(error).toMatchObject({
      kind: 'invalid-data',
      message: 'Missing or invalid rate for USD',
    });
  });

  test.each(['1.2', 0, -1, Number.NaN])(
    'rejects an invalid rate value %j',
    (value) => {
      const data = {
        ...validResponse,
        rates: { ...validResponse.rates, EUR: value },
      };

      const error = thrownBy(() => parseRatesResponse(data));

      expect(error).toMatchObject({
        kind: 'invalid-data',
        message: 'Missing or invalid rate for EUR',
      });
    },
  );
});

describe('fetchExchangeRates', () => {
  test('requests only the supported currencies from GBP', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(validResponse));
    vi.stubGlobal('fetch', fetchMock);

    await fetchExchangeRates();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.frankfurter.dev/v1/latest?from=GBP&to=USD,EUR,JPY,CHF',
      expect.anything(),
    );
    expect(RATES_URL).toBe(fetchMock.mock.calls[0][0]);
  });

  test('classifies a failed connection as a network error', async () => {
    const offline = new TypeError('Failed to fetch');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(offline));

    const error = await fetchExchangeRates().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ExchangeRateError);
    expect(error).toMatchObject({ kind: 'network', cause: offline });
  });

  test('classifies an error status as an http error with the status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
    );

    const error = await fetchExchangeRates().catch((e: unknown) => e);

    expect(error).toMatchObject({
      kind: 'http',
      status: 503,
      message: 'Exchange rate request failed (503)',
    });
  });

  test('classifies a non-JSON body as invalid-json', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html>Bad gateway</html>')),
    );

    const error = await fetchExchangeRates().catch((e: unknown) => e);

    expect(error).toMatchObject({ kind: 'invalid-json' });
  });

  test('classifies a malformed body as invalid-data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ base: 'GBP' })),
    );

    const error = await fetchExchangeRates().catch((e: unknown) => e);

    expect(error).toMatchObject({ kind: 'invalid-data' });
  });

  test('classifies a request that hangs as a timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(hangUntilAborted));
    const request = fetchExchangeRates().catch((e: unknown) => e);

    await vi.advanceTimersByTimeAsync(RATES_TIMEOUT_MS);

    expect(await request).toMatchObject({
      kind: 'timeout',
      message: 'No response from the exchange rate service within 10s',
    });
  });

  test('passes a caller abort through untouched rather than as a failure', async () => {
    vi.stubGlobal('fetch', vi.fn(hangUntilAborted));
    const controller = new AbortController();
    const request = fetchExchangeRates({ signal: controller.signal }).catch(
      (e: unknown) => e,
    );

    controller.abort();

    const error = await request;
    expect(error).not.toBeInstanceOf(ExchangeRateError);
    expect(error).toMatchObject({ name: 'AbortError' });
  });
});
