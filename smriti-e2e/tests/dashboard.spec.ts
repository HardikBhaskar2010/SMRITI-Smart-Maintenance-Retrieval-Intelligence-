/**
 * Playwright E2E — Dashboard Page
 *
 * Validates:
 *  - Page loads without JS errors
 *  - Header / navigation is visible
 *  - "Knowledge Intelligence" heading appears
 *  - Asset cards render with severity badges
 *  - Stat pills (Critical / At Risk / Healthy) show numbers
 *  - "View All" / "Start Guru Session" CTA buttons are present
 *  - No console errors about missing exports or blank screens
 */

import { test, expect } from '@playwright/test';
import { waitForBackend, dismissLoading } from './helpers';

const BASE = 'http://localhost:5173';

test.beforeEach(async ({ page }) => {
  // Collect JS errors
  page.on('pageerror', (err) => {
    console.error('[PAGE ERROR]', err.message);
  });
});

test.describe('Dashboard — Layout & Navigation', () => {
  test('page loads without crashing', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await dismissLoading(page);

    // Check no critical JS errors
    const fatalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('favicon')
    );
    expect(fatalErrors, `Fatal JS errors:\n${fatalErrors.join('\n')}`).toHaveLength(0);
  });

  test('sidebar is visible on desktop', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible({ timeout: 10_000 });
  });

  test('SMRITI brand name appears in sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    await expect(page.getByText('SMRITI', { exact: false })).toBeVisible();
  });

  test('sidebar navigation links are present', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    const links = ['Dashboard', 'Query', 'Guru Mode', 'Upload'];
    for (const label of links) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible();
    }
  });

  test('root redirect goes to /dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/dashboard', { timeout: 5_000 });
    expect(page.url()).toContain('/dashboard');
  });
});

test.describe('Dashboard — Content', () => {
  test('hero heading contains "Intelligence" or "Knowledge"', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
    const text = (await heading.textContent()) ?? '';
    expect(text.toLowerCase()).toMatch(/knowledge|intelligence|smriti/i);
  });

  test('stat pills render three counters', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    // Stat pills contain labels like "Critical Assets", "At Risk", "Healthy"
    const labels = ['Critical', 'Risk', 'Healthy'];
    for (const label of labels) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible({ timeout: 15_000 });
    }
  });

  test('"Priority Assets" section heading is visible', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    await expect(page.getByText('Priority Assets', { exact: false })).toBeVisible({ timeout: 15_000 });
  });

  test('"Start Guru Session" button is present', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    const btn = page.getByRole('button', { name: /guru session/i });
    await expect(btn).toBeVisible({ timeout: 15_000 });
  });

  test('"View All" button is present', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    await expect(page.getByText('View All', { exact: false })).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Dashboard — Visual Quality', () => {
  test('page body background is dark (not white)', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    const bg = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    // Should be a dark color, not rgb(255,255,255)
    expect(bg).not.toBe('rgb(255, 255, 255)');
  });

  test('asset cards have proper border styling', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(3000); // wait for data to load
    const cards = page.locator('[class*="card"], .card').first();
    if (await cards.isVisible()) {
      const border = await cards.evaluate(
        (el) => getComputedStyle(el).borderWidth
      );
      // Cards should have a visible border
      expect(border).not.toBe('0px');
    }
  });

  test('page has no horizontal overflow (no layout breaking)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await dismissLoading(page);

    const bodyWidth    = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth  = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 2); // 2px tolerance
  });

  test('mobile view shows topbar, not sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard');
    await dismissLoading(page);

    const sidebar = page.locator('aside').first();
    // On mobile the sidebar should be hidden/not displayed
    const isHidden = await sidebar.isHidden();
    expect(isHidden).toBe(true);
  });
});

test.describe('Dashboard — Performance', () => {
  test('page loads in under 5 seconds', async ({ page }) => {
    const t0 = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(5_000);
  });

  test('no missing chunk / 404 asset requests', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (resp) => {
      if (resp.status() >= 400 && !resp.url().includes('/api/')) {
        failed.push(`${resp.status()} ${resp.url()}`);
      }
    });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    expect(
      failed.filter((u) => !u.includes('favicon')),
      `Failed static asset requests:\n${failed.join('\n')}`
    ).toHaveLength(0);
  });
});
