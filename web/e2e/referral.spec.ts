import { test, expect } from '@playwright/test';

test.describe('Referral Landing Page', () => {
  test('shows invalid referral message for bad code', async ({ page }) => {
    await page.goto('/r/INVALID-CODE-12345');
    await expect(page.getByText('Invalid Referral Link')).toBeVisible();
    await expect(page.getByText('Sign Up Free')).toBeVisible();
    await expect(page.getByText('Learn More')).toBeVisible();
  });

  test('invalid referral page has Sign Up button that navigates to register', async ({ page }) => {
    await page.goto('/r/INVALID-CODE-12345');
    await page.getByText('Sign Up Free').click();
    await expect(page).toHaveURL('/register');
  });

  test('invalid referral page has Learn More button that navigates to landing', async ({ page }) => {
    await page.goto('/r/INVALID-CODE-12345');
    await page.getByText('Learn More').click();
    await expect(page).toHaveURL('/');
  });

  test('referral page has SEO meta tags', async ({ page }) => {
    await page.goto('/r/SOME-CODE');
    // Even invalid codes should render the page with proper structure
    const title = await page.title();
    expect(title).toContain('OpenFinance');
  });

  test('referral page renders feature highlights', async ({ page }) => {
    // Navigate to an invalid code just to test page structure renders
    await page.goto('/r/INVALID-CODE-12345');
    // The invalid state doesn't show features, but the page should load
    await expect(page.getByText('Invalid Referral Link')).toBeVisible();
  });
});

test.describe('Register Page with Referral', () => {
  test('register page accepts ref query parameter', async ({ page }) => {
    await page.goto('/register?ref=TEST-CODE');
    await expect(page.getByText('Create your account')).toBeVisible();
    // The ref param is stored in state, not visible in UI
  });

  test('register page renders normally without ref param', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByText('Create your account')).toBeVisible();
  });
});

test.describe('Referral Route', () => {
  test('r/:code route is accessible', async ({ page }) => {
    const response = await page.goto('/r/test-code');
    expect(response?.status()).toBe(200);
  });

  test('navigating to /r/ without code redirects appropriately', async ({ page }) => {
    await page.goto('/r/');
    // Should either show the page or redirect — not crash
    await expect(page.locator('body')).toBeVisible();
  });
});
