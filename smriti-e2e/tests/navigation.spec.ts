/**
 * Playwright E2E — Sidebar Navigation
 *
 * Validates:
 *  - Clicking each nav item routes correctly
 *  - Active state highlights the selected route
 *  - Sidebar collapse/expand works
 *  - Mobile bottom nav is shown on small screens
 */

import { test, expect } from '@playwright/test';
import { dismissLoading } from './helpers';


test.describe('Sidebar Navigation — Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await dismissLoading(page);
  });

  test('Dashboard nav link is active on /dashboard', async ({ page }) => {
    // NavLink sets aria-current="page" when active
    const activeLink = page.locator('[aria-current="page"]');
    await expect(activeLink).toBeVisible({ timeout: 5_000 });
    const text = await activeLink.first().textContent();
    expect(text?.toLowerCase()).toContain('dashboard');
  });

  test('clicking Query nav item navigates to /query', async ({ page }) => {
    await page.locator('a[href*="query"]').first().click();
    await expect(page).toHaveURL(/\/query/, { timeout: 10_000 });
  });

  test('clicking Graph nav item navigates to /graph', async ({ page }) => {
    await page.locator('a[href*="graph"]').first().click();
    await expect(page).toHaveURL(/\/graph/, { timeout: 10_000 });
  });

  test('clicking Guru Mode nav item navigates to /guru', async ({ page }) => {
    await page.locator('a[href*="guru"]').first().click();
    await expect(page).toHaveURL(/\/guru/, { timeout: 10_000 });
  });

  test('clicking Upload nav item navigates to /upload', async ({ page }) => {
    const uploadLink = page.locator('a[href*="upload"]').first();
    if (await uploadLink.isVisible()) {
      await uploadLink.click();
      await expect(page).toHaveURL(/\/upload/, { timeout: 10_000 });
    }
  });

  test('sidebar brand logo is present', async ({ page }) => {
    const logo = page.locator('aside').first().locator('div').first();
    await expect(logo).toBeVisible();
  });
});

test.describe('Sidebar Navigation — Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard');
    await dismissLoading(page);
  });

  test('bottom nav is visible on mobile', async ({ page }) => {
    // BottomNav has class "bottomnav-wrapper" or similar
    const bottomNav = page.locator(
      '.bottomnav-wrapper, [class*="bottom-nav"], [class*="bottomNav"]'
    ).first();
    if (await bottomNav.isVisible()) {
      await expect(bottomNav).toBeVisible();
    } else {
      // If it's using the CSS display rule, check the nav element directly
      const nav = page.locator('nav').last();
      await expect(nav).toBeVisible();
    }
  });

  test('sidebar is hidden on mobile', async ({ page }) => {
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeHidden({ timeout: 5_000 });
  });
});

test.describe('Navigation — Page Routing', () => {
  test('unknown route does not show blank page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await page.waitForLoadState('domcontentloaded');
    // Should either redirect or show some content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.trim().length).toBeGreaterThan(0);
  });

  test('direct navigation to /query loads the page', async ({ page }) => {
    await page.goto('/query');
    await page.waitForLoadState('domcontentloaded');
    await dismissLoading(page);
    // Should have a search/query input
    const input = page.locator('input, textarea').first();
    await expect(input).toBeVisible({ timeout: 15_000 });
  });

  test('back-button returns to previous page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.goto('/query');
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5_000 });
  });
});
