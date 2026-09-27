const formatters = new Map<string, Intl.NumberFormat>();

/**
 * Formats using the currency's own minor units (GBP → pence, JPY → none).
 * Formatters are cached because constructing Intl.NumberFormat is relatively
 * expensive and a 360-row schedule formats ~2,000 values.
 */
export function formatCurrency(amount: number, currency = 'GBP'): string {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-GB', { style: 'currency', currency });
    formatters.set(currency, formatter);
  }
  return formatter.format(amount);
}
