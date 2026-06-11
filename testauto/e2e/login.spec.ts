import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  // email (input)
  await page.locator('input').first().fill('user2@test.com');

  // password (input)
  await page.locator('input[type="password"]').fill('password123');

  // click login
  await page.getByRole('button', { name: /login/i }).click();

  // verification post-login
  await expect(page).not.toHaveURL(/login/);
});
