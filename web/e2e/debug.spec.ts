import { test, expect } from '@playwright/test';

test('debug login then transactions', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Email address').fill('demo@openfinance.dev');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  
  await page.goto('/transactions');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/beforeeach-result.png' });
  console.log('URL:', page.url());
  
  // Try various selectors
  const h1Count = await page.locator('h1').count();
  console.log('h1 count:', h1Count);
  for (let i = 0; i < h1Count; i++) {
    const text = await page.locator('h1').nth(i).textContent();
    console.log(`h1[${i}]:`, text);
  }
  
  const bodyText = await page.textContent('body');
  console.log('Has Transactions text:', bodyText?.includes('Transactions'));
});
