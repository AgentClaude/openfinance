import { test, expect } from '@playwright/test';
import { takeScreenshot } from './helpers';

test.describe('API Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs');
  });

  test('renders the docs page with sidebar and main content', async ({ page }) => {
    await expect(page.getByText('OpenFinance').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('API Documentation', { exact: true }).first()).toBeVisible();

    await expect(page.getByText('Getting Started').first()).toBeVisible();
    await takeScreenshot(page, 'docs-overview');
  });

  test('sidebar navigation links are all present', async ({ page }) => {
    const navItems = [
      'Getting Started',
      'Authentication',
      'REST API',
      'GraphQL API',
      'Embeddable Widgets',
      'Rate Limits',
      'Error Codes',
    ];

    for (const item of navItems) {
      await expect(page.locator(`aside button:has-text("${item}")`).first()).toBeVisible();
    }
  });

  test('sidebar has REST API sub-navigation items', async ({ page }) => {
    const subItems = [
      'Accounts',
      'Transactions',
      'Budgets',
      'Net Worth',
      'Monthly Summary',
      'Daily Spend',
      'Account Balances',
    ];

    for (const item of subItems) {
      await expect(page.locator(`aside button:has-text("${item}")`).first()).toBeVisible();
    }
  });

  test('sidebar has GraphQL API sub-navigation items', async ({ page }) => {
    await expect(page.locator('aside button:has-text("Queries")').first()).toBeVisible();
    await expect(page.locator('aside button:has-text("Mutations")').first()).toBeVisible();
  });

  test('clicking sidebar nav scrolls to the correct section', async ({ page }) => {
    await page.locator('aside button:has-text("Authentication")').first().click();
    await expect(page.locator('#authentication')).toBeVisible();
    await expect(page.getByText('API key and share token')).toBeVisible();
  });

  test('displays base URL in top bar', async ({ page }) => {
    await expect(page.locator('code:has-text("/api/v1")').first()).toBeVisible();
  });

  test('has theme toggle button', async ({ page }) => {
    const toggle = page.locator('button:has-text("☀️"), button:has-text("🌙")').first();
    await expect(toggle).toBeVisible();
  });

  test('Getting Started section shows REST and GraphQL info', async ({ page }) => {
    await expect(page.getByText('REST API v1').first()).toBeVisible();
    await expect(page.getByText('GraphQL API').first()).toBeVisible();
    await expect(page.getByText('/graphql').first()).toBeVisible();
  });

  test('Authentication section has API key instructions', async ({ page }) => {
    await page.locator('aside button:has-text("Authentication")').first().click();
    await expect(page.locator('#authentication')).toBeVisible();
    await expect(page.getByText('X-API-Key').first()).toBeVisible();
    await expect(page.getByText('Settings → API Keys')).toBeVisible();
    await expect(page.getByText('Share Tokens').first()).toBeVisible();
  });

  test('REST API endpoints display method badges and paths', async ({ page }) => {
    await page.locator('aside button:has-text("Accounts")').first().click();

    await expect(page.locator('span:has-text("GET")').first()).toBeVisible();
    await expect(page.locator('code:has-text("/api/v1/accounts")').first()).toBeVisible();
  });

  test('REST API endpoints have curl examples with copy button', async ({ page }) => {
    await page.locator('aside button:has-text("Accounts")').first().click();

    await expect(page.getByText('curl').first()).toBeVisible();
    await expect(page.locator('button:has-text("Copy")').first()).toBeAttached();
  });

  test('REST API endpoints have response examples', async ({ page }) => {
    await page.locator('aside button:has-text("Accounts")').first().click();

    await expect(page.getByText('Example Response').first()).toBeVisible();
    await expect(page.getByText('"accounts"').first()).toBeVisible();
  });

  test('Transactions endpoint shows query parameters', async ({ page }) => {
    await page.locator('aside button:has-text("Transactions")').first().click();
    await expect(page.locator('#rest-transactions')).toBeVisible();

    await expect(page.getByText('start_date').first()).toBeVisible();
    await expect(page.getByText('end_date').first()).toBeVisible();
    await expect(page.getByText('category').first()).toBeVisible();
    await expect(page.getByText('account_id').first()).toBeVisible();
    await expect(page.getByText('limit').first()).toBeVisible();
    await expect(page.getByText('offset').first()).toBeVisible();
  });

  test('GraphQL section shows queries list', async ({ page }) => {
    await page.locator('aside button:has-text("Queries")').first().click();
    await expect(page.locator('#graphql-queries')).toBeVisible();

    const queries = ['me', 'accounts', 'transactions', 'dashboardSummary', 'budgetSummary', 'goals'];
    for (const q of queries) {
      await expect(page.locator(`code:has-text("${q}")`).first()).toBeVisible();
    }
  });

  test('GraphQL section shows mutations list', async ({ page }) => {
    await page.locator('aside button:has-text("Mutations")').first().click();
    await expect(page.locator('#graphql-mutations')).toBeVisible();

    const mutations = ['login', 'register', 'createTransaction', 'updateBudgetItem'];
    for (const m of mutations) {
      await expect(page.locator(`code:has-text("${m}")`).first()).toBeVisible();
    }
  });

  test('GraphQL section has example query code block', async ({ page }) => {
    await page.locator('aside button:has-text("Queries")').first().click();
    await expect(page.getByText('Example Query')).toBeVisible();
    await expect(page.getByText('dashboardSummary').first()).toBeVisible();
  });

  test('Embeddable Widgets section shows embed endpoints', async ({ page }) => {
    await page.locator('aside button:has-text("Embeddable Widgets")').first().click();
    await expect(page.locator('#embeds')).toBeVisible();

    await expect(page.getByText('embed/net_worth').first()).toBeVisible();
    await expect(page.getByText('embed/spending').first()).toBeVisible();
    await expect(page.getByText('iframe').first()).toBeVisible();
  });

  test('Rate Limits section shows limit info', async ({ page }) => {
    await page.locator('aside button:has-text("Rate Limits")').first().click();
    await expect(page.locator('#rate-limits')).toBeVisible();

    await expect(page.getByText('60 requests per minute').first()).toBeVisible();
    await expect(page.getByText('X-RateLimit-Limit').first()).toBeVisible();
    await expect(page.getByText('X-RateLimit-Remaining').first()).toBeVisible();
    await expect(page.getByText('429').first()).toBeVisible();
  });

  test('Error Codes section shows error table', async ({ page }) => {
    await page.locator('aside button:has-text("Error Codes")').first().click();
    await expect(page.locator('#errors')).toBeVisible();

    const codes = ['200', '400', '401', '403', '404', '422', '429', '500'];
    for (const code of codes) {
      await expect(page.locator(`code:has-text("${code}")`).first()).toBeVisible();
    }

    await expect(page.getByText('Error Response Format')).toBeVisible();
    await takeScreenshot(page, 'docs-errors');
  });

  test('page footer is visible', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.getByText('Built with ❤️')).toBeVisible();
  });
});
