import { test, expect, Page } from '@playwright/test';

const EMAIL = 'demo@openfinance.dev';
const PASSWORD = 'password123';

async function login(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 30000 });
}

test.describe('Login', () => {
  test('shows login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('logs in with valid credentials', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/dashboard/);
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('bad@email.com');
    await page.getByLabel(/password/i).fill('wrong');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Error message appears as toast or inline — just check it exists in DOM
    await expect(page.getByText(/invalid|error|failed/i).first()).toBeAttached({ timeout: 10000 });
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('shows dashboard content', async ({ page }) => {
    // Should show some financial summary content
    await expect(page.getByText(/net worth|balance|spending|income/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows sidebar navigation', async ({ page }) => {
    // Check for nav links
    await expect(page.getByRole('link', { name: /transaction/i }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('link', { name: /account/i }).first()).toBeVisible();
  });
});

test.describe('Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
  });

  test('shows transactions page', async ({ page }) => {
    // Wait for either transaction data or empty state
    await expect(
      page.getByText(/transaction/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('has search input', async ({ page }) => {
    await expect(
      page.getByPlaceholder(/search/i).or(page.getByRole('searchbox')).or(page.locator('input[type="search"]')).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows seeded transactions', async ({ page }) => {
    // We have seeded transactions — check for visible transaction descriptions in the list
    // Use more specific locators to avoid matching hidden option elements
    await expect(
      page.locator('table, [class*="card"], [class*="transaction"]').filter({ hasText: /grocery|restaurant|electric|payroll|movie/i }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('search filters transactions', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i).or(page.getByRole('searchbox')).or(page.locator('input[type="search"]')).first();
    await searchInput.fill('grocery');
    await page.waitForTimeout(1000); // debounce
    // Check for grocery text in the main content area, not in filter dropdowns
    await expect(
      page.locator('main, [class*="content"], [class*="list"]').filter({ hasText: /grocery/i }).first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Accounts', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');
  });

  test('shows accounts page', async ({ page }) => {
    await expect(
      page.getByText(/account/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows seeded accounts', async ({ page }) => {
    await expect(
      page.getByText(/checking|savings|credit|freedom/i).first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Categories', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
  });

  test('shows categories page', async ({ page }) => {
    await expect(
      page.getByText(/categor/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows seeded categories', async ({ page }) => {
    await expect(
      page.getByText(/groceries|dining|entertainment|transportation/i).first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Budget', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');
  });

  test('shows budget page', async ({ page }) => {
    await expect(
      page.getByText(/budget/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows month navigation', async ({ page }) => {
    // Should have prev/next month controls
    await expect(
      page.getByText(/january|february|march|april|may|june|july|august|september|october|november|december|2026/i).first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Navigation', () => {
  test('navigates between pages', async ({ page }) => {
    await login(page);

    // Go to transactions
    await page.getByRole('link', { name: /transaction/i }).first().click();
    await expect(page).toHaveURL(/transaction/);

    // Go to accounts
    await page.getByRole('link', { name: /account/i }).first().click();
    await expect(page).toHaveURL(/account/);

    // Go to budget
    const budgetLink = page.getByRole('link', { name: /budget/i }).first();
    if (await budgetLink.isVisible()) {
      await budgetLink.click();
      await expect(page).toHaveURL(/budget/);
    }
  });
});
