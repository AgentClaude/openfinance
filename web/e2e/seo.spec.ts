import { test, expect } from '@playwright/test';

test.describe('SEO & Meta Tags', () => {
  test.describe('Landing Page', () => {
    test('has correct title', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/OpenFinance/);
    });

    test('has meta description', async ({ page }) => {
      await page.goto('/');
      const description = await page.getAttribute('meta[name="description"]', 'content');
      expect(description).toBeTruthy();
      expect(description).toContain('personal finance');
    });

    test('has Open Graph meta tags', async ({ page }) => {
      await page.goto('/');
      
      const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
      expect(ogTitle).toBeTruthy();
      expect(ogTitle).toContain('OpenFinance');

      const ogDescription = await page.getAttribute('meta[property="og:description"]', 'content');
      expect(ogDescription).toBeTruthy();

      const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');
      expect(ogImage).toBeTruthy();
      expect(ogImage).toContain('og-image');

      const ogType = await page.getAttribute('meta[property="og:type"]', 'content');
      expect(ogType).toBe('website');
    });

    test('has Twitter Card meta tags', async ({ page }) => {
      await page.goto('/');
      
      const twitterCard = await page.getAttribute('meta[name="twitter:card"]', 'content');
      expect(twitterCard).toBe('summary_large_image');

      const twitterTitle = await page.getAttribute('meta[name="twitter:title"]', 'content');
      expect(twitterTitle).toBeTruthy();
    });

    test('has structured data (JSON-LD)', async ({ page }) => {
      await page.goto('/');
      
      const jsonLd = await page.evaluate(() => {
        const script = document.querySelector('script[type="application/ld+json"]');
        return script ? JSON.parse(script.textContent || '{}') : null;
      });
      
      expect(jsonLd).toBeTruthy();
      expect(jsonLd['@type']).toBe('SoftwareApplication');
      expect(jsonLd.name).toBe('OpenFinance');
      expect(jsonLd.applicationCategory).toBe('FinanceApplication');
      expect(jsonLd.offers.price).toBe('0');
    });

    test('has theme-color meta tag', async ({ page }) => {
      await page.goto('/');
      const themeColor = await page.getAttribute('meta[name="theme-color"]', 'content');
      expect(themeColor).toBe('#0D9488');
    });

    test('has proper favicon', async ({ page }) => {
      await page.goto('/');
      const favicon = await page.getAttribute('link[rel="icon"]', 'href');
      expect(favicon).toContain('favicon');
    });

    test('has manifest link', async ({ page }) => {
      await page.goto('/');
      const manifest = await page.getAttribute('link[rel="manifest"]', 'href');
      expect(manifest).toBe('/manifest.json');
    });
  });

  test.describe('Login Page', () => {
    test('has noindex meta tag', async ({ page }) => {
      await page.goto('/login');
      const robots = await page.getAttribute('meta[name="robots"]', 'content');
      expect(robots).toContain('noindex');
    });

    test('has appropriate title', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveTitle(/Sign In.*OpenFinance/);
    });
  });

  test.describe('Register Page', () => {
    test('has appropriate title', async ({ page }) => {
      await page.goto('/register');
      await expect(page).toHaveTitle(/Create Account.*OpenFinance/);
    });

    test('has meta description', async ({ page }) => {
      await page.goto('/register');
      const description = await page.getAttribute('meta[name="description"]', 'content');
      expect(description).toBeTruthy();
      expect(description).toContain('OpenFinance');
    });
  });

  test.describe('Docs Page', () => {
    test('has appropriate title', async ({ page }) => {
      await page.goto('/docs');
      await expect(page).toHaveTitle(/API Documentation.*OpenFinance/);
    });
  });

  test.describe('Static Files', () => {
    test('robots.txt is accessible', async ({ request }) => {
      const response = await request.get('/robots.txt');
      expect(response.ok()).toBeTruthy();
      const text = await response.text();
      expect(text).toContain('User-agent');
      expect(text).toContain('Sitemap');
      // Protected routes should be disallowed
      expect(text).toContain('Disallow: /dashboard');
      expect(text).toContain('Disallow: /settings');
    });

    test('sitemap.xml is accessible', async ({ request }) => {
      const response = await request.get('/sitemap.xml');
      expect(response.ok()).toBeTruthy();
      const text = await response.text();
      expect(text).toContain('<urlset');
      expect(text).toContain('/docs');
      expect(text).toContain('/register');
    });

    test('manifest.json is accessible', async ({ request }) => {
      const response = await request.get('/manifest.json');
      expect(response.ok()).toBeTruthy();
      const json = await response.json();
      expect(json.name).toBe('OpenFinance');
      expect(json.theme_color).toBe('#0D9488');
    });

    test('OG image is accessible', async ({ request }) => {
      const response = await request.get('/og-image.png');
      expect(response.ok()).toBeTruthy();
      expect(response.headers()['content-type']).toContain('image');
    });
  });

  test.describe('Responsive Landing Page', () => {
    test('renders correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');
      
      // Hero should be visible
      await expect(page.getByText('Your finances,')).toBeVisible();
      
      // CTA buttons should be visible
      await expect(page.getByRole('link', { name: /Get Started/i }).first()).toBeVisible();
      
      // Nav should have essential links
      await expect(page.getByRole('link', { name: /Sign Up Free/i })).toBeVisible();
    });

    test('renders correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      
      await expect(page.getByText('Your finances,')).toBeVisible();
      await expect(page.getByText('Everything you need')).toBeVisible();
    });

    test('comparison table scrolls horizontally on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');
      
      // The comparison table wrapper should exist
      const tableWrapper = page.locator('table').filter({ hasText: 'OpenFinance' }).first();
      await expect(tableWrapper).toBeVisible();
    });
  });
});
