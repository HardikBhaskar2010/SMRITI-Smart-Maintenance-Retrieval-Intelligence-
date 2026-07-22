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

// ── Dashboard — Layout & Navigation ────────────────────────────────────────

test.describe('Dashboard — Layout & Navigation', () => {
  test('page loads without crashing', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await dismissLoading(page);

    const fatalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('favicon')
    );
    expect(fatalErrors, `Fatal JS errors:\n${fatalErrors.join('\n')}`).toHaveLength(0);
  });

  test('sidebar is visible on desktop', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  });

  test('SMRITI brand name appears', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    // SMRITI appears in the sidebar brand section
    await expect(page.getByText('SMRITI', { exact: false }).first()).toBeVisible();
  });

  test('sidebar navigation links are present', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    for (const label of ['Dashboard', 'Query', 'Guru Mode', 'Upload']) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible();
    }
  });

  test('root redirect goes to /dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    expect(page.url()).toContain('/dashboard');
  });
});

// ── Dashboard — Content ────────────────────────────────────────────────────

test.describe('Dashboard — Content', () => {
  test('hero heading mentions Knowledge Intelligence', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    const text = (await heading.textContent()) ?? '';
    expect(text.toLowerCase()).toMatch(/knowledge.*intelligence/i);
  });

  test('Quick Stats pills render three counters', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    // The immersive UI shows 'Critical Assets', 'At Risk', 'Healthy'
    for (const label of ['Critical Assets', 'At Risk', 'Healthy']) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible({ timeout: 15000 });
    }
  });

  test('Priority Assets section is visible', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    await expect(page.getByText('Priority Assets', { exact: false })).toBeVisible({ timeout: 15000 });
  });

  test('Start Guru Session button is present', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    const btn = page.getByRole('button', { name: /guru session/i });
    await expect(btn).toBeVisible({ timeout: 15000 });
  });

  test('View All button is present', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    await expect(page.getByText('View All', { exact: false })).toBeVisible({ timeout: 15000 });
  });
});


// ── Dashboard — Visual Quality ─────────────────────────────────────────────

test.describe('Dashboard — Visual Quality', () => {
  test('page body background is dark (not white)', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).not.toBe('rgb(255, 255, 255)');
  });

  test('page has no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await dismissLoading(page);
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 2);
  });

  test('mobile view hides sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard');
    await dismissLoading(page);
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeHidden({ timeout: 5000 });
  });
});

// ── Dashboard — Performance ────────────────────────────────────────────────

test.describe('Dashboard — Performance', () => {
  test('page loads in under 5 seconds', async ({ page }) => {
    const t0 = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const elapsed = Date.now() - t0;
    expect(elapsed).toBeLessThan(5000);
  });

  test('no broken static asset requests', async ({ page }) => {
    const failed = [];
    page.on('response', (resp) => {
      if (resp.status() >= 400 && !resp.url().includes('/api/')) {
        failed.push(`${resp.status()} ${resp.url()}`);
      }
    });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    expect(
      failed.filter((u) => !u.includes('favicon')),
      `Failed static requests:\n${failed.join('\n')}`
    ).toHaveLength(0);
  });
});
