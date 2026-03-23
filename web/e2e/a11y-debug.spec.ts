import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { loginViaApi } from './helpers/auth';

test('debug a11y violations on login page', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  for (const v of results.violations) {
    console.log(`\n=== ${v.id} (${v.impact}) ===`);
    console.log(`Help: ${v.help}`);
    for (const node of v.nodes) {
      console.log(`  HTML: ${node.html}`);
      console.log(`  Target: ${JSON.stringify(node.target)}`);
      console.log(`  Fix: ${node.failureSummary}`);
    }
  }
  
  expect(true).toBe(true);
});

test('debug a11y on transactions page', async ({ page }) => {
  await loginViaApi(page);
  await page.goto('/transactions');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  for (const v of results.violations) {
    console.log(`\n=== ${v.id} (${v.impact}) ===`);
    console.log(`Help: ${v.help}`);
    for (const node of v.nodes.slice(0, 3)) {
      console.log(`  HTML: ${node.html}`);
      console.log(`  Target: ${JSON.stringify(node.target)}`);
      console.log(`  Fix: ${node.failureSummary}`);
    }
    if (v.nodes.length > 3) {
      console.log(`  ... and ${v.nodes.length - 3} more`);
    }
  }
  
  expect(true).toBe(true);
});

test('debug a11y on budget page', async ({ page }) => {
  await loginViaApi(page);
  await page.goto('/budget');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  for (const v of results.violations) {
    console.log(`\n=== ${v.id} (${v.impact}) ===`);
    console.log(`Help: ${v.help}`);
    for (const node of v.nodes.slice(0, 3)) {
      console.log(`  HTML: ${node.html}`);
      console.log(`  Target: ${JSON.stringify(node.target)}`);
      console.log(`  Fix: ${node.failureSummary}`);
    }
    if (v.nodes.length > 3) {
      console.log(`  ... and ${v.nodes.length - 3} more`);
    }
  }
  
  expect(true).toBe(true);
});

test('debug a11y on reports page', async ({ page }) => {
  await loginViaApi(page);
  await page.goto('/reports');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  for (const v of results.violations) {
    console.log(`\n=== ${v.id} (${v.impact}) ===`);
    console.log(`Help: ${v.help}`);
    for (const node of v.nodes.slice(0, 3)) {
      console.log(`  HTML: ${node.html}`);
      console.log(`  Target: ${JSON.stringify(node.target)}`);
      console.log(`  Fix: ${node.failureSummary}`);
    }
    if (v.nodes.length > 3) {
      console.log(`  ... and ${v.nodes.length - 3} more`);
    }
  }
  
  expect(true).toBe(true);
});

test('debug a11y on categories page', async ({ page }) => {
  await loginViaApi(page);
  await page.goto('/categories');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  for (const v of results.violations) {
    console.log(`\n=== ${v.id} (${v.impact}) ===`);
    console.log(`Help: ${v.help}`);
    for (const node of v.nodes.slice(0, 3)) {
      console.log(`  HTML: ${node.html}`);
      console.log(`  Target: ${JSON.stringify(node.target)}`);
      console.log(`  Fix: ${node.failureSummary}`);
    }
    if (v.nodes.length > 3) {
      console.log(`  ... and ${v.nodes.length - 3} more`);
    }
  }
  
  expect(true).toBe(true);
});
