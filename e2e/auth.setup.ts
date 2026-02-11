import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Ensure auth directory exists
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await page.goto('/login');
  await page.getByRole('textbox', { name: /email/i }).fill('demo@openfinance.dev');
  await page.locator('input[type="password"]').fill('password123');
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

  // Save storage state (includes localStorage with JWT)
  await page.context().storageState({ path: authFile });
});
