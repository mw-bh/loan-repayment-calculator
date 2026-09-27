const currencyFormatters = new Map<string, Intl.NumberFormat>();

/**
 * Formats using the currency's own minor units (GBP → pence, JPY → none).
 * Formatters are cached because constructing Intl.NumberFormat is relatively
 * expensive and a 360-row schedule formats ~2,000 values.
 */
export function formatCurrency(amount: number, currency = 'GBP'): string {
  let formatter = currencyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-GB', { style: 'currency', currency });
    currencyFormatters.set(currency, formatter);
  }
  return formatter.format(amount);
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  // ISO dates like "2026-07-29" parse as UTC midnight; format in UTC too so the day doesn't shift for users west of Greenwich.
  timeZone: 'UTC',
});

/** "2026-07-29" → "29 Jul 2026". */
export function formatIsoDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}
