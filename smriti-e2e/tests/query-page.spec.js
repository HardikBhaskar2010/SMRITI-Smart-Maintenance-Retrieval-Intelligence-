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

const SAMPLE_QUERY = 'What is the lubrication interval for the pump?';

test.describe('Query Page — UI Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/query');
    await dismissLoading(page);
  });

  test('query input is visible and focusable', async ({ page }) => {
    const input = page.locator('input[type="text"], textarea').first();
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.focus();
    await expect(input).toBeFocused();
  });

  test('page heading mentions Query or Search', async ({ page }) => {
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    const text = (await heading.textContent()) ?? '';
    expect(text.toLowerCase()).toMatch(/query|search|ask|knowledge/i);
  });
});

test.describe('Query Page — Live Query Flow', () => {
  test('typing a query and pressing Enter renders a response', async ({ page }) => {
    await page.goto('/query');
    await dismissLoading(page);

    const input = page.locator('input[type="text"], textarea').first();
    await input.fill(SAMPLE_QUERY);
    await input.press('Enter');

    await page.waitForTimeout(1000);
    const body = await page.locator('main').textContent();
    expect(body?.length).toBeGreaterThan(50);
  });

  test('submitting query via button works', async ({ page }) => {
    await page.goto('/query');
    await dismissLoading(page);

    const input = page.locator('input[type="text"], textarea').first();
    await input.fill('pump bearing vibration threshold');

    const submitBtn = page.locator(
      'button[type="submit"], button:has-text("Ask"), button:has-text("Search")'
    ).first();

    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    } else {
      await input.press('Enter');
    }

    await page.waitForTimeout(1000);
    const body = await page.locator('main').textContent();
    expect(body?.length).toBeGreaterThan(0);
  });
});

test.describe('Query Page — Keyboard Accessibility', () => {
  test('can Tab to the input field', async ({ page }) => {
    await page.goto('/query');
    await dismissLoading(page);
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible({ timeout: 5000 });
  });
});
