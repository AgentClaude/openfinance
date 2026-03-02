import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';

test('debug label', async ({ page }) => {
  await loginViaApi(page);
  await page.goto('/recurring');
  await page.waitForLoadState('networkidle');
  const addBtn = page.getByRole('button', { name: /add/i }).first();
  await addBtn.click();
  await page.waitForTimeout(2000);
  
  const html = await page.evaluate(() => {
    const labels = document.querySelectorAll('label');
    const results: string[] = [];
    labels.forEach(l => {
      results.push(`label: for="${l.htmlFor}" text="${l.textContent?.trim()}" -> control=${l.control?.tagName || 'NONE'} controlId="${l.control?.id || 'N/A'}"`);
    });
    return results.join('\n');
  });
  console.log(html);
});
