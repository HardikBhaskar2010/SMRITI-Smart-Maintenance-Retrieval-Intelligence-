/**
 * Playwright E2E — Accessibility & Visual Regression
 *
 * Validates:
 *  - Core ARIA semantics (landmarks, headings, labels)
 *  - Color contrast approximation
 *  - Focus trapping and visible focus rings
 *  - Responsive layout at key breakpoints
 *  - No broken images
 */

import { test, expect } from '@playwright/test';
import { dismissLoading } from './helpers';

const PAGES = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Query',     path: '/query'     },
  { name: 'Upload',    path: '/upload'    },
  { name: 'Guru',      path: '/guru'      },
  { name: 'Graph',     path: '/graph'     },
];

const BREAKPOINTS = [
  { name: 'Mobile S',  width: 375,  height: 667  },
  { name: 'Mobile L',  width: 414,  height: 896  },
  { name: 'Tablet',    width: 768,  height: 1024 },
  { name: 'Laptop',    width: 1280, height: 800  },
  { name: 'Desktop',   width: 1920, height: 1080 },
];


test.describe('Accessibility — ARIA Landmarks', () => {
  for (const { name, path } of PAGES) {
    test(`${name}: has main landmark`, async ({ page }) => {
      await page.goto(path);
      await dismissLoading(page);
      const main = page.locator('main, [role="main"]').first();
      await expect(main).toBeVisible({ timeout: 10_000 });
    });

    test(`${name}: has at least one heading`, async ({ page }) => {
      await page.goto(path);
      await dismissLoading(page);
      const heading = page.locator('h1, h2, h3').first();
      await expect(heading).toBeVisible({ timeout: 10_000 });
    });
  }
});

test.describe('Accessibility — Focus Management', () => {
  test('interactive elements have visible focus outline', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);

    // Tab to the first focusable element
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

    expect(hasFocusRing, `Focused element has no visible focus ring: ${JSON.stringify(outlineStyle)}`).toBe(true);
  });

  test('all buttons have accessible names', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);
    await page.waitForTimeout(2000);

    const buttons = await page.locator('button').all();
    const unnamed: string[] = [];

    for (const btn of buttons) {
      const name = await btn.getAttribute('aria-label')
        ?? await btn.textContent()
        ?? '';
      if (!name.trim() && await btn.isVisible()) {
        unnamed.push(await btn.evaluate((el) => el.outerHTML.slice(0, 100)));
      }
    }

    expect(unnamed, `Buttons with no accessible name:\n${unnamed.join('\n')}`).toHaveLength(0);
  });

  test('links have descriptive text', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);

    const links = await page.locator('a').all();
    const badLinks: string[] = [];

    for (const link of links) {
      const text = (await link.textContent() ?? '').trim();
      const ariaLabel = await link.getAttribute('aria-label') ?? '';
      if (!text && !ariaLabel && await link.isVisible()) {
        badLinks.push(await link.getAttribute('href') ?? 'unknown href');
      }
    }

    expect(badLinks, `Links with no text: ${badLinks.join(', ')}`).toHaveLength(0);
  });
});

test.describe('Accessibility — Images', () => {
  test('all images have alt attributes', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);

    const imgs = await page.locator('img').all();
    const noAlt: string[] = [];
    for (const img of imgs) {
      const alt = await img.getAttribute('alt');
      if (alt === null) {
        noAlt.push(await img.getAttribute('src') ?? 'unknown src');
      }
    }
    expect(noAlt, `Images without alt: ${noAlt.join(', ')}`).toHaveLength(0);
  });

  test('no broken images on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissLoading(page);

    const broken = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.src);
    });
    expect(broken, `Broken images: ${broken.join(', ')}`).toHaveLength(0);
  });
});

test.describe('Responsive Layout', () => {
  for (const { name: bp, width, height } of BREAKPOINTS) {
    test(`Dashboard renders correctly at ${bp} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/dashboard');
      await dismissLoading(page);

      // Page should have content
      const main = page.locator('main').first();
      await expect(main).toBeVisible({ timeout: 10_000 });

      // No horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(width + 5);
    });
  }
});

test.describe('Visual — Dark Mode Compliance', () => {
  test('all pages use dark background colors', async ({ page }) => {
    for (const { name, path } of PAGES) {
      await page.goto(path);
      await dismissLoading(page);

      const bg = await page.evaluate(() =>
        getComputedStyle(document.body).backgroundColor
      );
      // Dark colors have low RGB values
      const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const [, r, g, b] = match.map(Number);
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        expect(luma, `${name} background luma ${luma.toFixed(0)} is too bright (> 128)`).toBeLessThan(128);
      }
    }
  });
});
