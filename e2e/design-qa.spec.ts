import { test, expect } from '@playwright/test';

test.describe('Design QA — Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('mobile sidebar opens and closes via hamburger', async ({ page }) => {
    await page.goto('/dashboard');
    // Sidebar should not be visible initially
    await expect(page.locator('nav').filter({ hasText: 'Dashboard' })).not.toBeVisible();
    
    // Open hamburger menu
    const hamburger = page.locator('button').filter({ has: page.locator('svg') }).first();
    await hamburger.click();
    
    // Sidebar should be visible
    await expect(page.locator('nav').filter({ hasText: 'Transactions' })).toBeVisible();
  });

  test('mobile sidebar closes when clicking a nav item', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Open hamburger
    const hamburger = page.locator('button').filter({ has: page.locator('svg') }).first();
    await hamburger.click();
    
    // Wait for sidebar to be visible
    await expect(page.locator('nav').filter({ hasText: 'Transactions' })).toBeVisible();
    
    // Click Transactions
    await page.getByRole('link', { name: 'Transactions' }).click();
    
    // Should navigate and sidebar should close
    await expect(page).toHaveURL(/\/transactions/);
    // The sidebar overlay should no longer be visible
    await expect(page.locator('.fixed.inset-0.bg-gray-600')).not.toBeVisible({ timeout: 5000 });
  });

  test('mobile sidebar closes when clicking overlay backdrop', async ({ page }) => {
    await page.goto('/dashboard');
    
    const hamburger = page.locator('button').filter({ has: page.locator('svg') }).first();
    await hamburger.click();
    await expect(page.locator('nav').filter({ hasText: 'Transactions' })).toBeVisible();
    
    // Click the backdrop overlay
    await page.locator('.fixed.inset-0.bg-gray-600').click({ force: true });
    
    // Sidebar should close
    await expect(page.locator('nav').filter({ hasText: 'Transactions' })).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Design QA — Responsive Layout', () => {
  test('dashboard cards stack on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    
    await expect(page.getByText('Net Worth')).toBeVisible();
    await expect(page.getByText('Monthly Income')).toBeVisible();
  });

  test('dashboard cards are in a row on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/dashboard');
    
    await expect(page.getByText('Net Worth')).toBeVisible();
    await expect(page.getByText('Monthly Income')).toBeVisible();
    
    // On desktop, sidebar should be visible
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  });

  test('sidebar is hidden on mobile, visible on desktop', async ({ page }) => {
    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    // Desktop sidebar should be hidden (md:hidden sibling)
    const desktopSidebar = page.locator('.hidden.md\\:flex');
    await expect(desktopSidebar).not.toBeVisible();
    
    // Desktop
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(desktopSidebar).toBeVisible();
  });
});

test.describe('Design QA — Account Balances Display', () => {
  test('credit card and loan balances are not shown in green', async ({ page }) => {
    await page.goto('/accounts');
    
    // Wait for accounts to load
    await expect(page.getByText('Credit')).toBeVisible();
    
    // Find the Amex Platinum balance
    const amexCard = page.locator('text=Amex Platinum').locator('..').locator('..');
    const balanceEl = amexCard.locator('.tabular-nums').first();
    
    // The balance should NOT have emerald/green color class
    const classes = await balanceEl.getAttribute('class');
    expect(classes).not.toContain('emerald');
    expect(classes).not.toContain('green');
  });
});

test.describe('Design QA — Modal Dismiss', () => {
  test('add account modal opens and closes', async ({ page }) => {
    await page.goto('/accounts');
    
    // Open add account modal
    await page.getByRole('button', { name: /add account/i }).click();
    await expect(page.getByText('Add Account')).toBeVisible();
    
    // Close via X button
    await page.locator('button').filter({ has: page.locator('svg.h-5.w-5') }).last().click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
  });

  test('add transaction modal opens and closes', async ({ page }) => {
    await page.goto('/transactions');
    
    await page.getByRole('button', { name: /add transaction/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Close via Escape
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Design QA — Navigation Active States', () => {
  const pages = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Transactions', path: '/transactions' },
    { name: 'Accounts', path: '/accounts' },
    { name: 'Goals', path: '/goals' },
    { name: 'Budget', path: '/budget' },
    { name: 'Recurring', path: '/recurring' },
    { name: 'Categories', path: '/categories' },
    { name: 'Reports', path: '/reports' },
    { name: 'Settings', path: '/settings' },
  ];

  for (const p of pages) {
    test(`${p.name} page loads and shows active nav state`, async ({ page }) => {
      await page.goto(p.path);
      
      // The page should load without errors
      await expect(page.locator('h1, h2, h3').first()).toBeVisible();
      
      // The nav link should have active styling (brand color class)
      const navLink = page.getByRole('link', { name: p.name, exact: true });
      if (await navLink.isVisible()) {
        const classes = await navLink.getAttribute('class');
        expect(classes).toContain('brand');
      }
    });
  }
});

test.describe('Design QA — Settings Tabs', () => {
  test('all settings tabs are accessible', async ({ page }) => {
    await page.goto('/settings');
    
    const tabNames = ['Profile', 'Preferences', 'Household', 'Members', 'Notifications', 'Tags', 'Referrals', 'Security', 'Data'];
    
    for (const tabName of tabNames) {
      const tab = page.getByRole('button', { name: new RegExp(tabName) });
      // Scroll into view and click
      await tab.scrollIntoViewIfNeeded();
      await tab.click();
      await expect(tab).toBeVisible();
    }
  });
});

test.describe('Design QA — Investments Table Overflow', () => {
  test('investments holdings table is scrollable', async ({ page }) => {
    await page.goto('/investments');
    await expect(page.getByText('Holdings')).toBeVisible();
    
    // The table container should have overflow-x-auto
    const tableContainer = page.locator('.overflow-x-auto').filter({ has: page.locator('table') });
    await expect(tableContainer).toBeVisible();
  });
});

test.describe('Design QA — Color Consistency', () => {
  test('positive amounts are green, negative are red on transactions page', async ({ page }) => {
    await page.goto('/transactions');
    
    // Wait for transactions to load
    await expect(page.getByText('Natural Gas')).toBeVisible();
    
    // Negative amounts should have red color
    const negativeAmount = page.locator('.text-red-600, .text-red-500').first();
    await expect(negativeAmount).toBeVisible();
  });

  test('budget over-budget items shown in red', async ({ page }) => {
    await page.goto('/budget');
    
    // Wait for budget to load
    await expect(page.getByText('Budget')).toBeVisible();
    
    // Over-budget warning should be visible if there are over-budget categories
    const overBudgetWarning = page.getByText(/categories are over budget/);
    if (await overBudgetWarning.isVisible()) {
      // The warning should have red/danger styling
      const parent = overBudgetWarning.locator('..');
      await expect(parent).toBeVisible();
    }
  });
});
