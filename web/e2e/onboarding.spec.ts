import { test, expect } from '@playwright/test';
import { loginViaApi, EMAIL, PASSWORD } from './helpers/auth';
import { takeScreenshot } from './helpers';

const API_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('Onboarding Page', () => {
  test.describe('redirect behavior', () => {
    test('redirects to dashboard if user already has accounts', async ({ page }) => {
      await loginViaApi(page);
      await page.goto('/onboarding');

      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    });

    test('redirects unauthenticated users away from onboarding', async ({ page }) => {
      await page.goto('/onboarding');

      await expect(page).toHaveURL(/login/, { timeout: 10000 });
    });
  });

  test.describe('wizard flow for new user', () => {
    let newUserToken: string;

    test.beforeEach(async ({ page }) => {
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
      }
    });

    test('shows welcome step with progress dots', async ({ page }) => {
      test.skip(!newUserToken, 'Registration failed — cannot test onboarding');

      const progressDots = page.locator('.rounded-full').first();
      await expect(progressDots).toBeVisible({ timeout: 10000 });

      await expect(
        page.getByText(/welcome|get started|let's set up/i).first()
      ).toBeVisible({ timeout: 10000 });

      await takeScreenshot(page, 'onboarding-welcome');
    });

    test('can navigate through wizard steps', async ({ page }) => {
      test.skip(!newUserToken, 'Registration failed — cannot test onboarding');

      await expect(
        page.getByText(/welcome|get started/i).first()
      ).toBeVisible({ timeout: 10000 });

      const nextBtn = page.getByRole('button', { name: /next|continue|get started/i }).first();
      await expect(nextBtn).toBeVisible({ timeout: 5000 });
      await nextBtn.click();

      await expect(
        page.getByText(/add.*account|account/i).first()
      ).toBeVisible({ timeout: 10000 });

      await takeScreenshot(page, 'onboarding-add-accounts');
    });

    test('shows account type options in add accounts step', async ({ page }) => {
      test.skip(!newUserToken, 'Registration failed — cannot test onboarding');

      const nextBtn = page.getByRole('button', { name: /next|continue|get started/i }).first();
      await expect(nextBtn).toBeVisible({ timeout: 5000 });
      await nextBtn.click();

      // At least one account type should be visible
      const types = ['Checking', 'Credit', 'Loan', 'Investment'];
      const typeLocators = types.map((t) => page.getByText(new RegExp(t, 'i')).first());
      await expect(
        typeLocators[0].or(typeLocators[1]).or(typeLocators[2]).or(typeLocators[3])
      ).toBeVisible({ timeout: 5000 });
    });

    test('can add a manual account during onboarding', async ({ page }) => {
      test.skip(!newUserToken, 'Registration failed — cannot test onboarding');

      const nextBtn = page.getByRole('button', { name: /next|continue|get started/i }).first();
      await expect(nextBtn).toBeVisible({ timeout: 5000 });
      await nextBtn.click();

      const nameInput = page.getByPlaceholder(/chase checking/i).first();
      await expect(nameInput).toBeVisible({ timeout: 5000 });
      await nameInput.fill('Test Checking');

      const balanceInput = page.locator('input[type="number"], input[inputmode="decimal"]').first();
      await expect(balanceInput).toBeVisible({ timeout: 3000 });
      await balanceInput.fill('1000');

      const submitBtn = page.getByRole('button', { name: /add account/i }).first();
      await expect(submitBtn).toBeVisible({ timeout: 3000 });
      await submitBtn.click();

      await expect(
        page.getByText(/test checking/i).first()
      ).toBeVisible({ timeout: 10000 });

      await takeScreenshot(page, 'onboarding-account-added');
    });

    test('can skip to finish and go to dashboard', async ({ page }) => {
      test.skip(!newUserToken, 'Registration failed — cannot test onboarding');

      const nextBtn = page.getByRole('button', { name: /next|continue|get started/i }).first();
      await expect(nextBtn).toBeVisible({ timeout: 5000 });
      await nextBtn.click();

      const skipOrNext = page.getByRole('button', { name: /skip|next|continue|finish/i }).first();
      await expect(skipOrNext).toBeVisible({ timeout: 5000 });
      await skipOrNext.click();

      const finishBtn = page.getByRole('button', { name: /finish|go to dashboard|let's go|start/i }).first();
      await expect(finishBtn).toBeVisible({ timeout: 5000 });
      await finishBtn.click();

      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
      await takeScreenshot(page, 'onboarding-complete');
    });

    test('can go back to previous step', async ({ page }) => {
      test.skip(!newUserToken, 'Registration failed — cannot test onboarding');

      const nextBtn = page.getByRole('button', { name: /next|continue|get started/i }).first();
      await expect(nextBtn).toBeVisible({ timeout: 5000 });
      await nextBtn.click();

      const backBtn = page.getByRole('button', { name: /back|previous/i }).first();
      await expect(backBtn).toBeVisible({ timeout: 5000 });
      await backBtn.click();

      await expect(
        page.getByText(/welcome|get started/i).first()
      ).toBeVisible({ timeout: 5000 });
    });
  });
});
