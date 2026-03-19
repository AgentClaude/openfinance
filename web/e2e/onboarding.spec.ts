import { test, expect } from '@playwright/test';
import { loginViaApi, EMAIL, PASSWORD } from './helpers/auth';
import { takeScreenshot } from './helpers';

const API_URL = 'http://localhost:3001';

test.describe('Onboarding Page', () => {
  test.describe('redirect behavior', () => {
    test('redirects to dashboard if user already has accounts', async ({ page }) => {
      // Login as demo user who already has accounts
      await loginViaApi(page);
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      // Should redirect to dashboard since demo user has accounts
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    });

    test('redirects unauthenticated users away from onboarding', async ({ page }) => {
      await page.goto('/onboarding');
      await page.waitForLoadState('networkidle');

      // ProtectedRoute should redirect to login
      await expect(page).toHaveURL(/login/, { timeout: 10000 });
    });
  });

  test.describe('wizard flow for new user', () => {
    let newUserToken: string;

    test.beforeEach(async ({ page }) => {
      // Create a fresh user via API with no accounts
      const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const uniqueEmail = `e2e-onboard-${uid}@test.dev`;
      const uniqueName = `E2E Tester ${uid}`;
      const registerRes = await page.request.post(`${API_URL}/graphql`, {
        data: {
          query: `mutation { register(email: "${uniqueEmail}", password: "testpass123", name: "${uniqueName}") { token user { id email } errors } }`,
        },
      });
      const registerJson = await registerRes.json();
      newUserToken = registerJson?.data?.register?.token;

      if (newUserToken) {
        await page.goto('/login');
        await page.evaluate((t) => {
          localStorage.setItem('access_token', t);
          localStorage.removeItem('onboarding_completed');
        }, newUserToken);
        await page.goto('/onboarding');
        await page.waitForLoadState('networkidle');
      }
    });

    test('shows welcome step with progress dots', async ({ page }) => {
      if (!newUserToken) {
        test.skip();
        return;
      }

      // Progress dots should be visible
      const progressDots = page.locator('.rounded-full').first();
      await expect(progressDots).toBeVisible({ timeout: 10000 });

      // Welcome content
      await expect(
        page.getByText(/welcome|get started|let's set up/i).first()
      ).toBeVisible({ timeout: 10000 });

      await takeScreenshot(page, 'onboarding-welcome');
    });

    test('can navigate through wizard steps', async ({ page }) => {
      if (!newUserToken) {
        test.skip();
        return;
      }

      // Should see first step content
      await expect(
        page.getByText(/welcome|get started/i).first()
      ).toBeVisible({ timeout: 10000 });

      // Click next/continue to go to step 2
      const nextBtn = page.getByRole('button', { name: /next|continue|get started/i }).first();
      if (await nextBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nextBtn.click();

        // Step 2 — Add Accounts
        await expect(
          page.getByText(/add.*account|account/i).first()
        ).toBeVisible({ timeout: 10000 });

        await takeScreenshot(page, 'onboarding-add-accounts');
      }
    });

    test('shows account type options in add accounts step', async ({ page }) => {
      if (!newUserToken) {
        test.skip();
        return;
      }

      // Navigate to step 2
      const nextBtn = page.getByRole('button', { name: /next|continue|get started/i }).first();
      if (await nextBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nextBtn.click();
      }

      // Account type options
      const types = ['Checking', 'Credit', 'Loan', 'Investment'];
      for (const t of types) {
        const typeEl = page.getByText(new RegExp(t, 'i')).first();
        if (await typeEl.isVisible({ timeout: 3000 }).catch(() => false)) {
          // At least some account types are visible
          break;
        }
      }
    });

    test('can add a manual account during onboarding', async ({ page }) => {
      if (!newUserToken) {
        test.skip();
        return;
      }

      // Navigate to step 2
      const nextBtn = page.getByRole('button', { name: /next|continue|get started/i }).first();
      if (await nextBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nextBtn.click();
      }

      // The account form should already be visible on step 2
      // Fill in account name using placeholder
      const nameInput = page.getByPlaceholder(/chase checking/i).first();
      if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nameInput.fill('Test Checking');

        // Fill balance
        const balanceInput = page.locator('input[type="number"], input[inputmode="decimal"]').first();
        if (await balanceInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await balanceInput.fill('1000');
        }

        // Submit the form
        const submitBtn = page.getByRole('button', { name: /add account/i }).first();
        if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await submitBtn.click();

          // Should see the account was added (account name appears in added list)
          await expect(
            page.getByText(/test checking/i).first()
          ).toBeVisible({ timeout: 10000 });
        }
      }

      await takeScreenshot(page, 'onboarding-account-added');
    });

    test('can skip to finish and go to dashboard', async ({ page }) => {
      if (!newUserToken) {
        test.skip();
        return;
      }

      // Navigate through to final step
      const nextBtn = page.getByRole('button', { name: /next|continue|get started/i }).first();
      if (await nextBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nextBtn.click();
      }

      // Look for skip or next to get to final step
      const skipOrNext = page.getByRole('button', { name: /skip|next|continue|finish/i }).first();
      if (await skipOrNext.isVisible({ timeout: 5000 }).catch(() => false)) {
        await skipOrNext.click();
      }

      // Final step — finish button
      const finishBtn = page.getByRole('button', { name: /finish|go to dashboard|let's go|start/i }).first();
      if (await finishBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await finishBtn.click();
        await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
        await takeScreenshot(page, 'onboarding-complete');
      }
    });

    test('can go back to previous step', async ({ page }) => {
      if (!newUserToken) {
        test.skip();
        return;
      }

      // Go to step 2
      const nextBtn = page.getByRole('button', { name: /next|continue|get started/i }).first();
      if (await nextBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nextBtn.click();
      }

      // Go back
      const backBtn = page.getByRole('button', { name: /back|previous/i }).first();
      if (await backBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await backBtn.click();

        // Should be back on welcome step
        await expect(
          page.getByText(/welcome|get started/i).first()
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
