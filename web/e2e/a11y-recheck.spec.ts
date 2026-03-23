import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Transactions', path: '/transactions' },
  { name: 'Budget', path: '/budget' },
  { name: 'Reports', path: '/reports' },
];

test('count remaining a11y violations after fixes', async ({ page }) => {
  await page.goto('http://localhost:3002/login');
  await page.fill('input[type="email"]', 'demo@openfinance.dev');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  for (const p of pages) {
    await page.goto(`http://localhost:3002${p.path}`);
    await page.waitForTimeout(2000);
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    const violations = results.violations.reduce((sum, v) => sum + v.nodes.length, 0);
    
    if (results.violations.length > 0) {
      console.log(`\n${p.name} — ${violations} violations`);
      for (const v of results.violations) {
        console.log(`  ${v.id} (${v.impact}): ${v.nodes.length}`);
        for (const n of v.nodes.slice(0, 1)) {
          console.log(`    ${n.html.substring(0, 150)}`);
        }
      }
    } else {
      console.log(`\n${p.name} — CLEAN ✓`);
    }
  }
});
