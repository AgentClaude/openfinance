import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('find specific a11y violations on dashboard', async ({ page }) => {
  await page.goto('http://localhost:3002/login');
  await page.fill('input[type="email"]', 'demo@openfinance.dev');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  
  for (const violation of results.violations) {
    console.log(`\n=== ${violation.id} (${violation.impact}) ===`);
    console.log(violation.help);
    for (const node of violation.nodes) {
      console.log(`  HTML: ${node.html.substring(0, 200)}`);
      console.log(`  Target: ${JSON.stringify(node.target)}`);
    }
  }
});

test('find specific a11y violations on transactions', async ({ page }) => {
  await page.goto('http://localhost:3002/login');
  await page.fill('input[type="email"]', 'demo@openfinance.dev');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto('http://localhost:3002/transactions');
  await page.waitForTimeout(2000);
  
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  
  for (const violation of results.violations) {
    console.log(`\n=== ${violation.id} (${violation.impact}) ===`);
    console.log(violation.help);
    for (const node of violation.nodes.slice(0, 5)) {
      console.log(`  HTML: ${node.html.substring(0, 200)}`);
      console.log(`  Target: ${JSON.stringify(node.target)}`);
    }
    if (violation.nodes.length > 5) {
      console.log(`  ... and ${violation.nodes.length - 5} more`);
    }
  }
});

test('find specific a11y violations on budget', async ({ page }) => {
  await page.goto('http://localhost:3002/login');
  await page.fill('input[type="email"]', 'demo@openfinance.dev');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.goto('http://localhost:3002/budget');
  await page.waitForTimeout(2000);
  
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  
  for (const violation of results.violations) {
    console.log(`\n=== ${violation.id} (${violation.impact}) ===`);
    console.log(violation.help);
    for (const node of violation.nodes.slice(0, 3)) {
      console.log(`  HTML: ${node.html.substring(0, 200)}`);
      console.log(`  Target: ${JSON.stringify(node.target)}`);
    }
  }
});
