import { expect, test } from '@playwright/test';

// Stub the live API so the journey is deterministic and runs offline.
// Round-number rates keep the expected conversions easy to check by hand.
const ratesResponse = {
  amount: 1,
  base: 'GBP',
  date: '2026-07-29',
  rates: { USD: 1.25, EUR: 1.2, JPY: 200, CHF: 1.1 },
};

test('calculates a loan and views it in another currency', async ({ page }) => {
  await page.route('https://api.frankfurter.dev/v1/latest**', (route) =>
    route.fulfill({ json: ratesResponse }),
  );
  await page.goto('/');
  const summary = page.getByRole('region', { name: 'Summary' });
  const rows = page
    .getByRole('table', { name: 'Repayment schedule over 300 months' })
    .locator('tbody tr');
  const finalClosingBalance = rows.last().getByRole('cell').last();

  await test.step('enter a £200,000 loan at 5.5% over 25 years', async () => {
    await page.getByLabel('Loan amount').fill('200000');
    await page.getByLabel('Annual interest rate').fill('5.5');
    await page.getByLabel('Loan term (years)').fill('25');
  });

  await test.step('see the GBP summary and a schedule ending at £0.00', async () => {
    await expect(summary.getByText('£1,228.17')).toBeVisible();
    await expect(summary.getByText('£368,454.14')).toBeVisible();
    await expect(summary.getByText('£168,454.14')).toBeVisible();
    await expect(rows).toHaveCount(300);
    await expect(finalClosingBalance).toHaveText('£0.00');
  });

  await test.step('switch to USD once rates have loaded', async () => {
    await expect(page.getByText('Rates: 29 Jul 2026')).toBeVisible();
    await page.getByLabel('Currency').selectOption('USD');
  });

  await test.step('see every amount converted to USD', async () => {
    await expect(summary.getByText('US$1,535.21')).toBeVisible();
    await expect(rows.first().getByRole('cell').nth(1)).toHaveText(
      'US$250,000.00',
    );
    await expect(finalClosingBalance).toHaveText('US$0.00');
  });
});
