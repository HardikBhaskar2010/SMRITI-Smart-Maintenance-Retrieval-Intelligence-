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

const PAGES = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Query',     path: '/query'     },
  { name: 'Upload',    path: '/upload'    },
  { name: 'Guru',      path: '/guru'      },
  { name: 'Graph',     path: '/graph'     },
];

const BREAKPOINTS = [
  { name: 'Mobile S', width: 375,  height: 667  },
  { name: 'Mobile L', width: 414,  height: 896  },
  { name: 'Tablet',   width: 768,  height: 1024 },
  { name: 'Laptop',   width: 1280, height: 800  },
  { name: 'Desktop',  width: 1920, height: 1080 },
];

// ── ARIA Landmarks ──────────────────────────────────────────────────────────

test.describe('Accessibility — ARIA Landmarks', () => {
  for (const { name, path } of PAGES) {
    test(`${name}: has main landmark`, async ({ page }) => {
      await page.goto(path);
      await dismissLoading(page);
      const main = page.locator('main, [role="main"]').first();
      await expect(main).toBeVisible({ timeout: 10000 });
    });

    test(`${name}: has at least one heading`, async ({ page }) => {
      await page.goto(path);
      await dismissLoading(page);
      // Graph page loads a 3D canvas — give extra time for React to mount the header
      const timeout = path === '/graph' ? 20000 : 10000;
      const heading = page.locator('h1, h2, h3').first();
      await expect(heading).toBeVisible({ timeout });
    });
  }
});

// ── Focus Management ────────────────────────────────────────────────────────

test.describe('Accessibility — Focus Management', () => {
  test('interactive elements have visible focus outline', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    const outlineStyle = await focused.evaluate((el) => {
      const s = getComputedStyle(el);
      return { outline: s.outline, boxShadow: s.boxShadow };
    });

    const hasFocusRing =
      outlineStyle.outline !== 'none' ||
      outlineStyle.boxShadow.includes('0 0') ||
      outlineStyle.outline.includes('solid');
    expect(hasFocusRing, `No focus ring: ${JSON.stringify(outlineStyle)}`).toBe(true);
  });

  test('all visible buttons have accessible names', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    await page.waitForTimeout(2000);

    const buttons = await page.locator('button').all();
    const unnamed = [];
    for (const btn of buttons) {
      if (!await btn.isVisible()) continue;
      const ariaLabel = await btn.getAttribute('aria-label') ?? '';
      const ariaLabelledBy = await btn.getAttribute('aria-labelledby') ?? '';
      const title = await btn.getAttribute('title') ?? '';
      const text = (await btn.textContent() ?? '').trim();
      // A button is accessible if it has ANY of: text, aria-label, aria-labelledby, title
      if (!text && !ariaLabel && !ariaLabelledBy && !title) {
        unnamed.push(await btn.evaluate((el) => el.outerHTML.slice(0, 80)));
      }
    }
    expect(unnamed, `Buttons with no accessible name:\n${unnamed.join('\n')}`).toHaveLength(0);
  });
});

// ── Images ──────────────────────────────────────────────────────────────────

test.describe('Accessibility — Images', () => {
  test('all images have alt attributes', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    const imgs = await page.locator('img').all();
    const noAlt = [];
    for (const img of imgs) {
      const alt = await img.getAttribute('alt');
      if (alt === null) noAlt.push(await img.getAttribute('src') ?? 'unknown');
    }
    expect(noAlt, `Images without alt: ${noAlt.join(', ')}`).toHaveLength(0);
  });

  test('no broken images on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    const broken = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img'))
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.src)
    );
    expect(broken, `Broken images: ${broken.join(', ')}`).toHaveLength(0);
  });
});

// ── Responsive Layout ───────────────────────────────────────────────────────

test.describe('Responsive Layout', () => {
  for (const { name: bp, width, height } of BREAKPOINTS) {
    test(`Dashboard at ${bp} (${width}x${height}) — no horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/dashboard');
      await dismissLoading(page);
      const main = page.locator('main').first();
      await expect(main).toBeVisible({ timeout: 10000 });
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(width + 5);
    });
  }
});

// ── Dark Mode ───────────────────────────────────────────────────────────────

test.describe('Visual — Dark Mode Compliance', () => {
  test('dashboard uses dark background color', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      expect(luma, `Background luma ${luma.toFixed(0)} is too bright`).toBeLessThan(128);
    }
  });
});
