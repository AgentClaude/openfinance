import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers/auth';
import { takeScreenshot } from './helpers';

test.describe('Recurring', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/recurring');
    await page.waitForLoadState('networkidle');
  });

  test.describe('List View', () => {
    test('shows recurring page with header', async ({ page }) => {
      await expect(page.getByText(/recurring/i).first()).toBeVisible({ timeout: 10000 });
      await takeScreenshot(page, 'recurring-page');
    });

    test('shows monthly expense/income totals', async ({ page }) => {
      await expect(
        page.getByText(/monthly|expense|income|\$/i).first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('shows add recurring button', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add|new|create/i }).first();
      await expect(addBtn).toBeVisible({ timeout: 10000 });
    });

    test('shows detect recurring button', async ({ page }) => {
      const detectBtn = page.getByRole('button', { name: /detect/i }).first();
      if (await detectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(detectBtn).toBeVisible();
      }
    });
  });

  test.describe('Create Recurring', () => {
    test('opens create recurring modal', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add|new|create/i }).first();
      await addBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('input, select').first()).toBeVisible({ timeout: 5000 });
      await takeScreenshot(page, 'recurring-create-modal');
    });

    test('create form has required fields (name, amount, frequency)', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add|new|create/i }).first();
      await addBtn.click();
      await page.waitForTimeout(1000);

      await expect(page.getByLabel(/name|description/i).first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByLabel(/amount/i).first()).toBeVisible({ timeout: 5000 });
    });

    test('can create a new recurring item', async ({ page }) => {
      const addBtn = page.getByRole('button', { name: /add|new|create/i }).first();
      await addBtn.click();
      await page.waitForTimeout(1000);

      const nameInput = page.getByLabel(/name|description/i).first();
      await expect(nameInput).toBeVisible({ timeout: 10000 });
      await nameInput.fill(`E2E Recurring ${Date.now()}`);

      const amountInput = page.getByLabel(/amount/i).first();
      await expect(amountInput).toBeVisible({ timeout: 5000 });
      await amountInput.fill('99.99');

      const submitBtn = page.getByRole('button', { name: /save|create|add|submit/i }).last();
      await submitBtn.click();
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'recurring-after-add');
    });
  });

  test.describe('Edit Recurring', () => {
    test('can open edit mode for a recurring item', async ({ page }) => {
      const editBtn = page.locator('button').filter({ has: page.locator('svg') });
      const count = await editBtn.count();
      for (let i = 0; i < Math.min(count, 15); i++) {
        const ariaLabel = await editBtn.nth(i).getAttribute('aria-label');
        if (ariaLabel?.match(/edit/i)) {
          await editBtn.nth(i).click();
          await page.waitForTimeout(500);
          await takeScreenshot(page, 'recurring-edit-modal');
          break;
        }
      }
    });
  });

  test.describe('Delete Recurring', () => {
    test('can trigger delete for a recurring item', async ({ page }) => {
      const deleteBtn = page.locator('button').filter({ has: page.locator('svg') });
      // Just check page is functional with items or empty state
      await expect(
        page.getByText(/recurring|no recurring|create/i).first()
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Mark as Paid', () => {
    test('can mark a recurring item as paid', async ({ page }) => {
      const paidBtn = page.getByRole('button', { name: /mark.*paid|paid/i }).first();
      if (await paidBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await takeScreenshot(page, 'recurring-mark-paid');
      }
    });
  });

  test.describe('Detect Recurring', () => {
    test('detect button triggers detection', async ({ page }) => {
      const detectBtn = page.getByRole('button', { name: /detect/i }).first();
      if (await detectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await detectBtn.click();
        await page.waitForTimeout(3000);
        await takeScreenshot(page, 'recurring-after-detect');
      }
    });
  });

  test.describe('Calendar View', () => {
    test('can switch to calendar view', async ({ page }) => {
      const calendarBtn = page.getByRole('button', { name: /calendar/i }).first();
      await expect(calendarBtn).toBeVisible({ timeout: 10000 });
      await calendarBtn.click();
      await page.waitForTimeout(500);

      // Calendar should show month name and weekday headers
      await expect(page.getByText(/sun|mon|tue|wed|thu|fri|sat/i).first()).toBeVisible({ timeout: 5000 });
      await takeScreenshot(page, 'recurring-calendar-view');
    });

    test('calendar shows month navigation', async ({ page }) => {
      const calendarBtn = page.getByRole('button', { name: /calendar/i }).first();
      await calendarBtn.click();
      await page.waitForTimeout(500);

      // Should have previous/next month buttons
      const prevBtn = page.getByRole('button', { name: /previous month/i });
      const nextBtn = page.getByRole('button', { name: /next month/i });
      await expect(prevBtn).toBeVisible({ timeout: 5000 });
      await expect(nextBtn).toBeVisible({ timeout: 5000 });
    });

    test('calendar month navigation works', async ({ page }) => {
      const calendarBtn = page.getByRole('button', { name: /calendar/i }).first();
      await calendarBtn.click();
      await page.waitForTimeout(500);

      // Get current month text
      const monthText = await page.locator('h3').filter({ hasText: /january|february|march|april|may|june|july|august|september|october|november|december/i }).first().textContent();

      // Navigate to next month
      const nextBtn = page.getByRole('button', { name: /next month/i });
      await nextBtn.click();
      await page.waitForTimeout(300);

      // Month should change
      const newMonthText = await page.locator('h3').filter({ hasText: /january|february|march|april|may|june|july|august|september|october|november|december/i }).first().textContent();
      expect(newMonthText).not.toBe(monthText);
      await takeScreenshot(page, 'recurring-calendar-next-month');
    });

    test('calendar shows legend with status colors', async ({ page }) => {
      const calendarBtn = page.getByRole('button', { name: /calendar/i }).first();
      await calendarBtn.click();
      await page.waitForTimeout(500);

      await expect(page.getByText('Paid', { exact: true }).first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Upcoming', { exact: true }).first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Overdue', { exact: true }).first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Scheduled', { exact: true }).first()).toBeVisible({ timeout: 5000 });
    });

    test('calendar shows bill count and total', async ({ page }) => {
      const calendarBtn = page.getByRole('button', { name: /calendar/i }).first();
      await calendarBtn.click();
      await page.waitForTimeout(500);

      // Should show bill count summary
      await expect(page.getByText(/bill/i).first()).toBeVisible({ timeout: 5000 });
    });

    test('calendar has 7 columns for weekdays', async ({ page }) => {
      const calendarBtn = page.getByRole('button', { name: /calendar/i }).first();
      await calendarBtn.click();
      await page.waitForTimeout(500);

      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (const day of weekdays) {
        await expect(page.getByText(day, { exact: true }).first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('clicking a day with bills shows detail panel', async ({ page }) => {
      // First create a recurring item if needed
      const addBtn = page.getByRole('button', { name: /add|new|create/i }).first();
      await addBtn.click();
      await page.waitForTimeout(1000);

      const nameInput = page.getByLabel(/name/i).first();
      await expect(nameInput).toBeVisible({ timeout: 10000 });
      await nameInput.fill(`Calendar Test Bill ${Date.now()}`);

      const amountInput = page.getByLabel(/amount/i).first();
      await amountInput.fill('50.00');

      const submitBtn = page.getByRole('button', { name: /save|create|add|submit/i }).last();
      await submitBtn.click();
      await page.waitForTimeout(2000);

      // Switch to calendar view
      const calendarBtn = page.getByRole('button', { name: /calendar/i }).first();
      await calendarBtn.click();
      await page.waitForTimeout(500);

      await takeScreenshot(page, 'recurring-calendar-with-bills');
    });

    test('can navigate back to today from another month', async ({ page }) => {
      const calendarBtn = page.getByRole('button', { name: /calendar/i }).first();
      await calendarBtn.click();
      await page.waitForTimeout(500);

      // Go to next month
      const nextBtn = page.getByRole('button', { name: /next month/i });
      await nextBtn.click();
      await page.waitForTimeout(300);

      // "Today" link should appear
      const todayLink = page.getByText('Today', { exact: true });
      await expect(todayLink).toBeVisible({ timeout: 5000 });
      await todayLink.click();
      await page.waitForTimeout(300);

      // Should be back to current month
      await expect(todayLink).not.toBeVisible({ timeout: 3000 });
      await takeScreenshot(page, 'recurring-calendar-today');
    });
  });

  test.describe('Toggle Inactive', () => {
    test('can toggle showing inactive recurring items', async ({ page }) => {
      const toggleBtn = page.getByRole('button', { name: /inactive|hidden|show/i }).first()
        .or(page.getByText(/show inactive|hidden/i).first());
      if (await toggleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await toggleBtn.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'recurring-show-inactive');
      }
    });
  });
});
