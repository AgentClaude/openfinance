import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';

test('debug label html', async ({ page }) => {
  await loginViaApi(page);
  await page.goto('/recurring');
  await page.waitForLoadState('networkidle');
  const addBtn = page.getByRole('button', { name: /add/i }).first();
  await addBtn.click();
  await page.waitForTimeout(2000);
  
  const html = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return 'NO DIALOG';
    const labels = dialog.querySelectorAll('label');
    const results: string[] = [];
    labels.forEach(l => {
      results.push(`outerHTML: ${l.outerHTML.substring(0, 200)}`);
    });
    const inputs = dialog.querySelectorAll('input, select, textarea');
    inputs.forEach(i => {
      results.push(`input: tag=${i.tagName} id="${i.id}"`);
    });
    return results.join('\n');
  });
  console.log(html);
});
