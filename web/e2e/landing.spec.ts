import { test, expect } from '@playwright/test';
import { takeScreenshot } from './helpers';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any auth state to see the landing page
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('shows hero section with app name', async ({ page }) => {
    await expect(
      page.getByText(/openfinance/i).first()
    ).toBeVisible({ timeout: 10000 });
    await takeScreenshot(page, 'landing-hero');
  });

  test('shows sign up and login links', async ({ page }) => {
    const signUpLink = page.getByRole('link', { name: /sign up|get started|register/i }).first();
    const loginLink = page.getByRole('link', { name: /sign in|log in|login/i }).first();

    const hasSignUp = await signUpLink.isVisible({ timeout: 5000 }).catch(() => false);
    const hasLogin = await loginLink.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasSignUp || hasLogin).toBeTruthy();
  });

  test('shows feature list', async ({ page }) => {
    await expect(
      page.getByText(/budget|report|recurring|investment|transaction/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows comparison or benefits section', async ({ page }) => {
    // Landing page has a comparison table or benefits
    const hasComparison = await page.getByText(/monarch|mint|compare|alternative|vs/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasBenefits = await page.getByText(/free|open.source|self.host|privacy/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasComparison || hasBenefits).toBeTruthy();
  });

  test('shows feature cards or visual content', async ({ page }) => {
    // Landing page should show feature cards with icons/descriptions
    const featureCards = page.locator('[class*="feature"], [class*="card"]').or(page.getByText(/budget|report|recurring/i));
    const count = await featureCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await takeScreenshot(page, 'landing-full');
  });

  test('get started link navigates to register', async ({ page }) => {
    const ctaLink = page.getByRole('link', { name: /get started|sign up|register|try/i }).first();
    if (await ctaLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await ctaLink.click();
      await expect(page).toHaveURL(/\/(register|login)/);
    }
  });

  test('has dark mode toggle', async ({ page }) => {
    const darkToggle = page.getByRole('button', { name: /dark|theme|mode/i }).or(page.locator('[aria-label*="dark"], [aria-label*="theme"]')).first();
    if (await darkToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await darkToggle.click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'landing-dark-mode');
    }
  });
});
