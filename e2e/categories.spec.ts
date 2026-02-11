import { test, expect } from '@playwright/test';

test.describe('Categories', () => {
  test('lists categories', async ({ page }) => {
    await page.goto('/categories');
    await expect(page.getByText('Groceries')).toBeVisible();
    await expect(page.getByText('Dining Out')).toBeVisible();
  });

  test('shows category management UI', async ({ page }) => {
    await page.goto('/categories');
    // Should show some kind of add/create button
    await expect(page.getByRole('button').first()).toBeVisible();
  });
});
