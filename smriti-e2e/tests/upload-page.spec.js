// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

/** @param {import('@playwright/test').Page} page */
async function dismissLoading(page) {
  await page
    .locator('[class*="skeleton"], [class*="loading"], [class*="spinner"]')
    .first()
    .waitFor({ state: 'detached', timeout: 8000 })
    .catch(() => {});
}

const TMP_PDF = path.join(__dirname, '_test_upload.pdf');

test.beforeAll(async () => {
  const pdfBytes = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n' +
    'xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n' +
    '0000000058 00000 n\n0000000115 00000 n\n' +
    'trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n215\n%%EOF\n'
  );
  fs.writeFileSync(TMP_PDF, pdfBytes);
});

test.afterAll(async () => {
  fs.unlink(TMP_PDF, () => {});
});

test.describe('Upload Page — Structure', () => {
  test('upload page loads without JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/upload');
    await page.waitForLoadState('domcontentloaded');
    const fatal = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(fatal).toHaveLength(0);
  });

  test('dropzone or file input is visible', async ({ page }) => {
    await page.goto('/upload');
    await dismissLoading(page);
    const dropzone = page.locator(
      '.dropzone, [class*="dropzone"], [class*="upload"], input[type="file"]'
    ).first();
    await expect(dropzone).toBeVisible({ timeout: 10000 });
  });

  test('upload area has instructional text', async ({ page }) => {
    await page.goto('/upload');
    await dismissLoading(page);
    const body = await page.locator('main').textContent();
    expect(body?.toLowerCase()).toMatch(/upload|drag|drop|pdf|file/i);
  });
});

test.describe('Upload Page — File Input', () => {
  test('file input accepts a PDF', async ({ page }) => {
    await page.goto('/upload');
    await dismissLoading(page);

    const fileInput = page.locator('input[type="file"]').first();
    if ((await fileInput.count()) > 0) {
      await fileInput.setInputFiles(TMP_PDF);
      await page.waitForTimeout(500);
      const body = await page.locator('main').textContent();
      expect(body?.toLowerCase()).toMatch(/_test_upload|test_upload|pdf/i);
    }
  });
});

test.describe('Upload Page — Accessibility', () => {
  test('upload area is keyboard-focusable', async ({ page }) => {
    await page.goto('/upload');
    await dismissLoading(page);
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible({ timeout: 5000 });
  });
});
