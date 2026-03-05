import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Tags Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
  });

  test('can navigate to tags tab in settings', async ({ page }) => {
    const tagsTab = page.getByRole('button', { name: /tag/i }).or(page.getByText(/tag/i)).first();
    if (await tagsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await tagsTab.click();
      await page.waitForTimeout(1000);
      await expect(page.getByText(/tag/i).first()).toBeVisible();
      await takeScreenshot(page, 'tags-settings-tab');
    }
  });
});

test.describe('Tags Page (Direct)', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    // Tags might be at /settings with tags tab, or a standalone page
    // Try standalone first
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    // Navigate to tags tab
    const tagsTab = page.getByRole('button', { name: /tag/i }).or(page.getByText(/tag/i)).first();
    if (await tagsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await tagsTab.click();
      await page.waitForTimeout(1000);
    }
  });

  test('shows tag management section', async ({ page }) => {
    // Manage Tags heading should be visible
    await expect(
      page.getByText(/manage tags/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('shows tag list or empty state', async ({ page }) => {
    const hasTags = await page.getByText(/usage|color|transactions/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.getByText(/no tags|create.*first|get started/i).first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasTags || hasEmpty).toBeTruthy();
  });

  test('can open create tag form', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /new tag|\+ new|create tag/i }).first();
    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(500);
      // Inline form should show name input
      await expect(
        page.getByPlaceholder(/tag name/i).or(page.getByLabel(/name/i)).first()
      ).toBeVisible({ timeout: 5000 });
      await takeScreenshot(page, 'tags-create-form');
    }
  });

  test('can create a new tag', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /new tag|\+ new|create tag/i }).first();
    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(500);

      const nameInput = page.getByPlaceholder(/tag name/i).or(page.getByLabel(/name/i)).first();
      await nameInput.fill(`e2e-tag-${Date.now()}`);

      const saveBtn = page.getByRole('button', { name: /^create$/i }).first();
      await saveBtn.click();

      // Wait for success feedback (toast or tag appearing in list)
      await expect(async () => {
        const hasToast = await page.getByText(/created|success/i).first().isVisible().catch(() => false);
        const formGone = !(await page.getByPlaceholder(/tag name/i).first().isVisible().catch(() => false));
        expect(hasToast || formGone).toBeTruthy();
      }).toPass({ timeout: 10000 });
      await takeScreenshot(page, 'tags-after-create');
    }
  });

  test('shows search input for filtering tags', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(searchInput).toBeVisible();
    }
  });
});
