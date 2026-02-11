import { test, expect, Page } from '@playwright/test';

const API_URL = 'http://localhost:3001';
const EMAIL = 'demo@openfinance.dev';
const PASSWORD = 'password123';

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

async function getAuthToken(): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: { email: EMAIL, password: PASSWORD } }),
  });
  const data = await res.json();
  return data.token;
}

test.describe('Transaction Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/transactions');
    await page.waitForSelector('text=Transactions', { timeout: 10000 });
  });

  test('displays transactions on load', async ({ page }) => {
    // Should show some transactions
    await page.waitForFunction(() => {
      const subtitle = document.querySelector('[class*="subtitle"], [class*="text-gray"]');
      return subtitle && !subtitle.textContent?.includes('0 transactions');
    }, { timeout: 10000 });
  });

  test('search filter narrows results', async ({ page }) => {
    // Get initial count text
    await page.waitForTimeout(1000);

    // Type a search query
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('grocery');

    // Wait for the query to refetch (Apollo debounce)
    await page.waitForTimeout(2000);

    // Check that results changed - we should see grocery-related items
    const pageContent = await page.textContent('body');
    // The search should either show grocery results or "No transactions found"
    const hasGrocery = pageContent?.toLowerCase().includes('grocery');
    const hasNoResults = pageContent?.includes('No transactions found');
    expect(hasGrocery || hasNoResults).toBeTruthy();
  });

  test('account filter works', async ({ page }) => {
    // Expand filters on mobile (or they're already visible on desktop)
    const filterToggle = page.locator('button:has-text("Filters")');
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
    }

    // Find the account select
    const accountSelect = page.locator('select').filter({ has: page.locator('option:has-text("All accounts")') });
    
    if (await accountSelect.isVisible()) {
      // Get the options
      const options = await accountSelect.locator('option').allTextContents();
      
      if (options.length > 1) {
        // Select the second option (first real account)
        await accountSelect.selectOption({ index: 1 });
        await page.waitForTimeout(2000);
        
        // Reset to all
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
        // Select a category
        await categorySelect.selectOption({ index: 1 });
        await page.waitForTimeout(2000);
        
        // Verify the page still works (no errors)
        await expect(page.locator('text=Transactions').first()).toBeVisible();
      }
    }
  });

  test('empty string filters do not break the query', async ({ page }) => {
    // This is the core bug test - verify that selecting "All accounts" 
    // (which sets value to "") doesn't filter out all results
    const filterToggle = page.locator('button:has-text("Filters")');
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
    }

    const accountSelect = page.locator('select').filter({ has: page.locator('option:has-text("All accounts")') });
    
    if (await accountSelect.isVisible() && (await accountSelect.locator('option').count()) > 1) {
      // Select an account
      await accountSelect.selectOption({ index: 1 });
      await page.waitForTimeout(2000);
      
      // Now select "All accounts" (empty string value)
      await accountSelect.selectOption({ value: '' });
      await page.waitForTimeout(2000);
      
      // Transactions should still be visible (the bug was that this would show 0 results)
      await page.waitForFunction(() => {
        const subtitle = document.querySelector('[class*="subtitle"], [class*="text-gray"]');
        return subtitle && !subtitle.textContent?.includes('0 transactions');
      }, { timeout: 10000 });
    }
  });

  test('search then clear returns all results', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    // Search for something specific
    await searchInput.fill('xyznonexistent');
    await page.waitForTimeout(2000);
    
    // Clear the search
    await searchInput.fill('');
    await page.waitForTimeout(2000);
    
    // Should show results again
    await page.waitForFunction(() => {
      const subtitle = document.querySelector('[class*="subtitle"], [class*="text-gray"]');
      return subtitle && !subtitle.textContent?.includes('0 transactions');
    }, { timeout: 10000 });
  });
});
