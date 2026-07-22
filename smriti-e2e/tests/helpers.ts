// Inline helpers to avoid cross-file TS import issues with Playwright + Node 22
import { Page, expect } from '@playwright/test';

export async function waitForBackend(
  page: Page,
  url = 'http://localhost:8000/health',
  timeoutMs = 20_000
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await page.request.get(url);
      if (res.ok()) return;
    } catch { /* not ready */ }
    await page.waitForTimeout(500);
  }
  throw new Error(`Backend at ${url} did not respond in ${timeoutMs}ms`);
}

export async function dismissLoading(page: Page) {
  await page
    .locator('[class*="skeleton"], [class*="loading"], [class*="spinner"]')
    .first()
    .waitFor({ state: 'detached', timeout: 8_000 })
    .catch(() => {});
}
