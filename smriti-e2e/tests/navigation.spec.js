// @ts-check
const { test, expect } = require('@playwright/test');

/** @param {import('@playwright/test').Page} page */
async function dismissLoading(page) {
  await page
    .locator('[class*="skeleton"], [class*="loading"], [class*="spinner"]')
    .first()
    .waitFor({ state: 'detached', timeout: 8000 })
    .catch(() => {});
}

// ── Desktop Navigation ──────────────────────────────────────────────────────

test.describe('Sidebar Navigation — Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await dismissLoading(page);
  });

  test('Dashboard nav link is active on /dashboard', async ({ page }) => {
    // Use .first() to avoid strict mode violation when both sidebar and topbar render active links
    const activeLink = page.locator('[aria-current="page"]').first();
    await expect(activeLink).toBeVisible({ timeout: 5000 });
    const text = await activeLink.textContent();
    expect(text?.toLowerCase()).toMatch(/dashboard|home/i);
  });

  test('clicking Query navigates to /query', async ({ page }) => {
    await page.locator('a[href*="query"]').first().click();
    await expect(page).toHaveURL(/\/query/, { timeout: 10000 });
  });

  test('clicking Graph navigates to /graph', async ({ page }) => {
    await page.locator('a[href*="graph"]').first().click();
    await expect(page).toHaveURL(/\/graph/, { timeout: 10000 });
  });

  test('clicking Guru navigates to /guru', async ({ page }) => {
    await page.locator('a[href*="guru"]').first().click();
    await expect(page).toHaveURL(/\/guru/, { timeout: 10000 });
  });
});

// ── Mobile Navigation ───────────────────────────────────────────────────────

test.describe('Sidebar Navigation — Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard');
    await dismissLoading(page);
  });

  test('sidebar is hidden on mobile', async ({ page }) => {
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeHidden({ timeout: 5000 });
  });
});

// ── Routing ─────────────────────────────────────────────────────────────────

test.describe('Navigation — Page Routing', () => {
  test('direct navigation to /query loads the page', async ({ page }) => {
    await page.goto('/query');
    await page.waitForLoadState('domcontentloaded');
    await dismissLoading(page);
    const input = page.locator('input, textarea').first();
    await expect(input).toBeVisible({ timeout: 15000 });
  });

  test('back-button returns to previous page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.goto('/query');
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });
});
