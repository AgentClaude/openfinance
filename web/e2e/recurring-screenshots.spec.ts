import { test } from '@playwright/test';
import { login, takeScreenshot } from './helpers';

test('screenshot recurring page', async ({ page }) => {
  await login(page);
  await page.goto('/recurring');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await takeScreenshot(page, 'recurring-page');

  // Try clicking any button that might open a create/add modal
  const buttons = ['add', 'new', 'create', 'detect'];
  for (const name of buttons) {
    const btn = page.getByRole('button', { name: new RegExp(name, 'i') }).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(1500);
      await takeScreenshot(page, `recurring-${name}-action`);
      break;
    }
  }
});
