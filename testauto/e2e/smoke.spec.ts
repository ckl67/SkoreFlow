import { test, expect } from '@playwright/test';

test('smoke test - homepage loads', async ({ page }) => {
  await page.goto('http://localhost:5173');

  //Verify that page answers
  await expect(page).toHaveTitle(/SkoreFlow/i);

  await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
});
