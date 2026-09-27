import { expect, test } from '@playwright/test';

// Confirms the Playwright setup works end to end; replace with real journeys.
test('loads the calculator', async ({ page }) => {
  await page.goto('/');

  const heading = page.getByRole('heading', {
    name: 'Loan Repayment Calculator',
  });

  await expect(heading).toBeVisible();
});
