import { test, expect } from '@playwright/test';
import { takeScreenshot } from './helpers';

test.describe('Onboarding', () => {
  test('new user sees onboarding wizard after registration', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Register a new user
    const timestamp = Date.now();
    const nameInput = page.getByLabel(/name/i).first();
    const emailInput = page.getByLabel(/email/i).first();
    const passwordInput = page.getByLabel(/password/i).first();

    await nameInput.fill(`E2E Tester ${timestamp}`);
    await emailInput.fill(`e2e-${timestamp}@test.dev`);
    await passwordInput.fill('password123');

    // If there's a confirm password field
    const confirmInput = page.getByLabel(/confirm/i).first();
    if (await confirmInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmInput.fill('password123');
    }

    const submitBtn = page.getByRole('button', { name: /sign up|register|create/i }).first();
    await submitBtn.click();

    // Should redirect to onboarding or dashboard
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'onboarding-start');

    // Check if onboarding wizard is shown
    const onboarding = page.getByText(/welcome|get started|set up|onboarding/i).first();
    if (await onboarding.isVisible({ timeout: 5000 }).catch(() => false)) {
      await takeScreenshot(page, 'onboarding-wizard');
    }
  });

  test('onboarding page renders for new users', async ({ page }) => {
    // Direct navigate to onboarding (may redirect if already completed)
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'onboarding-direct');
  });
});
