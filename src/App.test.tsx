import { act, render, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import App from './App';
import { ExchangeRateError } from './utils/exchangeRateError';
import { RATES_TIMEOUT_MS } from './utils/exchangeRates';
import { reportError } from './utils/reportError';

// Replace the logger so failure tests can assert on it without console noise.
vi.mock('./utils/reportError', () => ({ reportError: vi.fn() }));

// Round-number rates keep expected conversions easy to check by hand.
const ratesResponse = {
  amount: 1,
  base: 'GBP',
  date: '2026-07-29',
  rates: { USD: 1.25, EUR: 1.2, JPY: 200, CHF: 1.1 },
};

// A fresh Response per call, since a body can only be read once.
const respondWithRates = () => Promise.resolve(Response.json(ratesResponse));

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(respondWithRates));
  vi.mocked(reportError).mockClear();
});

/** Renders the app and waits for the exchange-rate request to settle. */
async function renderApp() {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByText('Rates: 29 Jul 2026');
  return user;
}

async function enterReferenceLoan(user: UserEvent) {
  await user.type(screen.getByLabelText(/loan amount/i), '200000');
  await user.type(screen.getByLabelText(/annual interest rate/i), '5.5');
  await user.type(screen.getByLabelText(/loan term/i), '25');
}

const scheduleRows = (months: number) => {
  const table = screen.getByRole('table', {
    name: `Repayment schedule over ${months} months`,
  });
  const [, ...bodyRows] = within(table).getAllByRole('row');
  return bodyRows;
};

test('renders the app heading', async () => {
  await renderApp();

  const heading = screen.getByRole('heading', {
    name: /loan repayment calculator/i,
  });

  expect(heading).toBeInTheDocument();
});

test('shows the repayment summary once all fields are valid', async () => {
  const user = await renderApp();

  await enterReferenceLoan(user);

  const summary = screen.getByRole('region', { name: 'Summary' });
  expect(within(summary).getByText('£1,228.17')).toBeInTheDocument();
  expect(within(summary).getByText('£368,454.14')).toBeInTheDocument();
  expect(within(summary).getByText('£168,454.14')).toBeInTheDocument();
});

test('shows a full schedule that ends at £0.00', async () => {
  const user = await renderApp();

  await enterReferenceLoan(user);

  const rows = scheduleRows(300);
  expect(rows).toHaveLength(300);
  expect(within(rows[299]).getAllByRole('cell').at(-1)).toHaveTextContent(
    '£0.00',
  );
});

test('does not show an error while the user is still typing', async () => {
  const user = await renderApp();
  const rate = screen.getByLabelText(/annual interest rate/i);

  await user.type(rate, '150');

  expect(rate).not.toBeInvalid();
});

test('shows an error after leaving an invalid field', async () => {
  const user = await renderApp();
  const rate = screen.getByLabelText(/annual interest rate/i);

  await user.type(rate, '150');
  await user.tab();

  expect(rate).toBeInvalid();
  expect(rate).toHaveAccessibleDescription(
    'Interest rate must be between 0 and 100',
  );
});

test('converts the summary and every schedule cell to the chosen currency', async () => {
  const user = await renderApp();
  await enterReferenceLoan(user);

  await user.selectOptions(screen.getByLabelText('Currency'), 'USD');

  const summary = screen.getByRole('region', { name: 'Summary' });
  expect(within(summary).getByText('US$1,535.21')).toBeInTheDocument();
  const rows = scheduleRows(300);
  expect(within(rows[0]).getAllByRole('cell')[1]).toHaveTextContent(
    'US$250,000.00',
  );
  expect(within(rows[299]).getAllByRole('cell').at(-1)).toHaveTextContent(
    'US$0.00',
  );
});

test('formats yen without decimal places', async () => {
  const user = await renderApp();
  await enterReferenceLoan(user);

  await user.selectOptions(screen.getByLabelText('Currency'), 'JPY');

  const summary = screen.getByRole('region', { name: 'Summary' });
  expect(within(summary).getByText('JP¥245,634')).toBeInTheDocument();
});

test('only GBP can be selected while rates are loading', () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise<Response>(() => {})),
  );

  render(<App />);

  expect(screen.getByText('Loading exchange rates…')).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'GBP' })).toBeEnabled();
  expect(screen.getByRole('option', { name: 'USD' })).toBeDisabled();
});

test('keeps calculating in GBP when the rates API is down', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  const user = userEvent.setup();
  render(<App />);
  await screen.findByText(/live exchange rates unavailable/i);

  await enterReferenceLoan(user);

  const summary = screen.getByRole('region', { name: 'Summary' });
  expect(within(summary).getByText('£1,228.17')).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'USD' })).toBeDisabled();
});

test('falls back to GBP when the rates API returns unusable data', async () => {
  const malformed = { base: 'GBP', date: '2026-07-29', rates: { USD: 'lots' } };
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(Response.json(malformed))),
  );
  const user = userEvent.setup();
  render(<App />);
  await screen.findByText(/live exchange rates unavailable/i);

  await enterReferenceLoan(user);

  const summary = screen.getByRole('region', { name: 'Summary' });
  expect(within(summary).getByText('£1,228.17')).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'USD' })).toBeDisabled();
});

test('gives up on a request that hangs and falls back to GBP', async () => {
  vi.useFakeTimers();
  // Never responds on its own; only settles when the hook aborts it.
  const hangUntilAborted = (_url: string, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () =>
        reject(new DOMException('Aborted', 'AbortError')),
      );
    });
  vi.stubGlobal('fetch', vi.fn(hangUntilAborted));
  render(<App />);

  await act(() => vi.advanceTimersByTimeAsync(RATES_TIMEOUT_MS));

  expect(
    screen.getByText(/live exchange rates unavailable/i),
  ).toBeInTheDocument();
  expect(screen.queryByText('Loading exchange rates…')).not.toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'USD' })).toBeDisabled();
});

test('logs a rates failure with its kind and status', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(null, { status: 503 }))),
  );
  render(<App />);

  await screen.findByText(/live exchange rates unavailable/i);

  expect(reportError).toHaveBeenCalledTimes(1);
  const [error, context] = vi.mocked(reportError).mock.calls[0];
  expect(error).toBeInstanceOf(ExchangeRateError);
  expect(context).toEqual({
    source: 'exchange-rates',
    kind: 'http',
    status: 503,
  });
});

test('does not log a request cancelled by leaving the page', async () => {
  const hangUntilAborted = (_url: string, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () =>
        reject(new DOMException('Aborted', 'AbortError')),
      );
    });
  vi.stubGlobal('fetch', vi.fn(hangUntilAborted));
  const { unmount } = render(<App />);

  unmount();
  await act(() => Promise.resolve());

  expect(reportError).not.toHaveBeenCalled();
});

test('"Try again" recovers once the rates API is back', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockImplementation(respondWithRates),
  );
  const user = userEvent.setup();
  render(<App />);
  await screen.findByText(/live exchange rates unavailable/i);

  await user.click(screen.getByRole('button', { name: 'Try again' }));

  expect(await screen.findByText('Rates: 29 Jul 2026')).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'USD' })).toBeEnabled();
  expect(
    screen.queryByText(/live exchange rates unavailable/i),
  ).not.toBeInTheDocument();
});
