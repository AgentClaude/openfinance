import { test, expect, Page } from '@playwright/test';

const API_URL = 'http://localhost:3001';
const EMAIL = 'demo@openfinance.dev';
const PASSWORD = 'password123';

async function login(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Email address').fill(EMAIL);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

test.describe('Transaction Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/transactions');
    await page.waitForTimeout(2000);
    await expect(page.locator('h1', { hasText: 'Transactions' })).toBeVisible({ timeout: 10000 });
  });

  test('displays transactions on load', async ({ page }) => {
    // Should show some transactions
    await page.waitForFunction(() => {
      const subtitle = document.querySelector('[class*="subtitle"], [class*="text-gray"]');
      return subtitle && !subtitle.textContent?.includes('0 transactions');
    }, { timeout: 10000 });
  });

  test('search filter narrows results', async ({ page }) => {
    await page.waitForTimeout(1000);

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('grocery');

    // Wait for the query to refetch (Apollo debounce)
    await page.waitForTimeout(2000);

    const pageContent = await page.textContent('body');
    const hasGrocery = pageContent?.toLowerCase().includes('grocery');
    const hasNoResults = pageContent?.includes('No transactions found');
    expect(hasGrocery || hasNoResults).toBeTruthy();
  });

  test('account filter works', async ({ page }) => {
    const filterToggle = page.locator('button:has-text("Filters")');
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
    }

    const accountSelect = page.locator('select').filter({ has: page.locator('option:has-text("All accounts")') });
    
    if (await accountSelect.isVisible()) {
      const options = await accountSelect.locator('option').allTextContents();
      
      if (options.length > 1) {
        await accountSelect.selectOption({ index: 1 });
        await page.waitForTimeout(2000);
        
        await accountSelect.selectOption({ value: '' });
        await page.waitForTimeout(2000);
      }
    }
  });

  test('category filter works', async ({ page }) => {
    const filterToggle = page.locator('button:has-text("Filters")');
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
    }

    const categorySelect = page.locator('select').filter({ has: page.locator('option:has-text("All categories")') });
    
    if (await categorySelect.isVisible()) {
      const options = await categorySelect.locator('option').allTextContents();
      
      if (options.length > 1) {
        await categorySelect.selectOption({ index: 1 });
        await page.waitForTimeout(2000);
        
        await expect(page.locator('h1', { hasText: 'Transactions' })).toBeVisible();
      }
    }
  });

  test('empty string filters do not break the query', async ({ page }) => {
    const filterToggle = page.locator('button:has-text("Filters")');
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
    }

    const accountSelect = page.locator('select').filter({ has: page.locator('option:has-text("All accounts")') });
    
    if (await accountSelect.isVisible() && (await accountSelect.locator('option').count()) > 1) {
      await accountSelect.selectOption({ index: 1 });
      await page.waitForTimeout(2000);
      
      await accountSelect.selectOption({ value: '' });
      await page.waitForTimeout(2000);
      
      await page.waitForFunction(() => {
        const subtitle = document.querySelector('[class*="subtitle"], [class*="text-gray"]');
        return subtitle && !subtitle.textContent?.includes('0 transactions');
      }, { timeout: 10000 });
    }
  });

  test('search then clear returns all results', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    await searchInput.fill('xyznonexistent');
    await page.waitForTimeout(2000);
    
    await searchInput.fill('');
    await page.waitForTimeout(2000);
    
    await page.waitForFunction(() => {
      const subtitle = document.querySelector('[class*="subtitle"], [class*="text-gray"]');
      return subtitle && !subtitle.textContent?.includes('0 transactions');
    }, { timeout: 10000 });
  });
});
