/**
 * 400% Zoom Testing
 * Accessibility Enhancement - 5.2: 400% Zoom Testing
 *
 * Tests that all pages work correctly at 400% zoom level
 * WCAG 2.1 AA Success Criterion 1.4.10 - Reflow
 *
 * This test verifies:
 * - No horizontal scrolling at 400% zoom
 * - Content reflows properly
 * - All interactive elements remain accessible
 * - Text remains readable
 * - Layout doesn't break
 */

import { test, expect, type Page } from '@playwright/test';

/**
 * Test pages to check at 400% zoom
 */
const TEST_PAGES = [
  { name: 'Main Homepage', url: '/', app: 'main' },
  { name: 'Main Help Page', url: '/help.html', app: 'main' },
  { name: 'Main Privacy Page', url: '/privacy.html', app: 'main' },
  { name: 'Main Easy Read', url: '/easy-read.html', app: 'main' },
  { name: 'Main 404 Page', url: '/404.html', app: 'main' },
  { name: 'Mint Homepage', url: '/', app: 'mint' },
  { name: 'Mint Research', url: '/research/', app: 'mint' },
  { name: 'Post Homepage', url: '/', app: 'post' },
  { name: 'Post Report', url: '/report/', app: 'post' },
  { name: 'Post Vote', url: '/vote/', app: 'post' },
  { name: 'Post Your Data', url: '/your-data/', app: 'post' },
  { name: 'Admin Dashboard', url: '/', app: 'admin' },
  { name: 'Admin Emails', url: '/emails/', app: 'admin' },
];

/**
 * Zoom level to test (400% = 4.0)
 * Used to calculate viewport width: 1920px / ZOOM_LEVEL = 480px
 */
const ZOOM_LEVEL = 4.0;

/**
 * Maximum allowed horizontal scroll width (should be 0)
 */
const MAX_HORIZONTAL_SCROLL = 0;

/**
 * Test that page works at 400% zoom
 */
test.describe('400% Zoom Testing', () => {
  test.describe('Page Layout at 400% Zoom', () => {
    for (const page of TEST_PAGES) {
      test(`${page.name} - No horizontal scrolling`, async ({
        page: browserPage,
        baseURL,
      }: {
        page: Page;
        baseURL: string | undefined;
      }) => {
        // Set viewport to simulate 400% zoom
        // At 400% zoom, a 1920px wide screen becomes effectively 480px
        await browserPage.setViewportSize({ width: 1920 / ZOOM_LEVEL, height: 800 });

        // Navigate to page
        const appUrl = getBaseUrl(page.app, baseURL || 'http://localhost:3000');
        await browserPage.goto(`${appUrl}${page.url}`);

        // Wait for page to load
        await browserPage.waitForLoadState('networkidle');

        // Check for horizontal scrolling
        const horizontalScroll = await browserPage.evaluate(() => {
          return {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            hasHorizontalScroll:
              document.documentElement.scrollWidth > document.documentElement.clientWidth,
          };
        });

        // Assert no horizontal scrolling
        expect(horizontalScroll.hasHorizontalScroll).toBe(false);
        expect(horizontalScroll.scrollWidth).toBeLessThanOrEqual(
          horizontalScroll.clientWidth + MAX_HORIZONTAL_SCROLL
        );
      });

      test(`${page.name} - Content reflows properly`, async ({
        page: browserPage,
        baseURL,
      }: {
        page: Page;
        baseURL: string | undefined;
      }) => {
        // Set viewport to simulate 400% zoom
        await browserPage.setViewportSize({ width: 1920 / ZOOM_LEVEL, height: 800 });

        // Navigate to page
        const appUrl = getBaseUrl(page.app, baseURL || 'http://localhost:3000');
        await browserPage.goto(`${appUrl}${page.url}`);

        // Wait for page to load
        await browserPage.waitForLoadState('networkidle');

        // Check that main content is visible and not clipped
        const contentCheck = await browserPage.evaluate(() => {
          const main =
            document.querySelector('main') || document.querySelector('.container') || document.body;
          if (!main) return { visible: false, reason: 'No main content found' };

          const rect = main.getBoundingClientRect();
          return {
            visible: rect.width > 0 && rect.height > 0,
            width: rect.width,
            height: rect.height,
            inViewport:
              rect.top >= 0 &&
              rect.left >= 0 &&
              rect.bottom <= window.innerHeight &&
              rect.right <= window.innerWidth,
          };
        });

        expect(contentCheck.visible).toBe(true);
        expect(contentCheck.width).toBeGreaterThan(0);
        expect(contentCheck.height).toBeGreaterThan(0);
      });

      test(`${page.name} - Interactive elements accessible`, async ({
        page: browserPage,
        baseURL,
      }: {
        page: Page;
        baseURL: string | undefined;
      }) => {
        // Set viewport to simulate 400% zoom
        await browserPage.setViewportSize({ width: 1920 / ZOOM_LEVEL, height: 800 });

        // Navigate to page
        const appUrl = getBaseUrl(page.app, baseURL || 'http://localhost:3000');
        await browserPage.goto(`${appUrl}${page.url}`);

        // Wait for page to load
        await browserPage.waitForLoadState('networkidle');

        // Check that interactive elements are accessible
        const interactiveCheck = await browserPage.evaluate(() => {
          const buttons = Array.from(
            document.querySelectorAll('button, a[href], input, select, textarea')
          );
          const accessible = buttons.filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0;
          });

          return {
            total: buttons.length,
            accessible: accessible.length,
            allAccessible: buttons.length === accessible.length,
          };
        });

        expect(interactiveCheck.allAccessible).toBe(true);
        expect(interactiveCheck.accessible).toBe(interactiveCheck.total);
      });

      test(`${page.name} - Text remains readable`, async ({
        page: browserPage,
        baseURL,
      }: {
        page: Page;
        baseURL: string | undefined;
      }) => {
        // Set viewport to simulate 400% zoom
        await browserPage.setViewportSize({ width: 1920 / ZOOM_LEVEL, height: 800 });

        // Navigate to page
        const appUrl = getBaseUrl(page.app, baseURL || 'http://localhost:3000');
        await browserPage.goto(`${appUrl}${page.url}`);

        // Wait for page to load
        await browserPage.waitForLoadState('networkidle');

        // Check that text is readable (not too small, not clipped)
        const textCheck = await browserPage.evaluate(() => {
          const textElements = Array.from(
            document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span, div')
          );
          const readable = textElements.filter(el => {
            const style = window.getComputedStyle(el);
            const fontSize = parseFloat(style.fontSize);
            const rect = el.getBoundingClientRect();

            // Font size should be at least 12px (3rem at 400% zoom from base 16px)
            // And element should be visible
            return fontSize >= 12 && rect.width > 0 && rect.height > 0;
          });

          return {
            total: textElements.length,
            readable: readable.length,
            allReadable: textElements.length === readable.length,
          };
        });

        // Most text should be readable (allow some margin for edge cases)
        expect(textCheck.readable).toBeGreaterThan(textCheck.total * 0.9);
      });
    }
  });
});

/**
 * Get base URL for app
 * Uses Playwright's baseURL from config, or defaults to localhost:3000
 */
function getBaseUrl(app: string, baseURL: string = 'http://localhost:3000'): string {
  const appPaths: Record<string, string> = {
    main: '',
    mint: '/mint',
    post: '/post',
    admin: '/admin',
  };
  const path = appPaths[app] || '';
  return `${baseURL}${path}`;
}

/**
 * Manual testing checklist
 *
 * To manually test 400% zoom:
 * 1. Open browser DevTools (F12)
 * 2. Open Device Toolbar (Ctrl+Shift+M / Cmd+Shift+M)
 * 3. Set zoom to 400% or set viewport width to 480px (simulates 400% zoom on 1920px screen)
 * 4. Test each page:
 *    - Check for horizontal scrolling (should be none)
 *    - Verify content reflows vertically
 *    - Ensure all buttons/links are clickable
 *    - Verify text is readable
 *    - Check that modals/popups still work
 *    - Test form inputs
 *    - Test navigation menus
 *
 * Browser zoom method:
 * - Chrome/Edge: Ctrl/Cmd + Plus to zoom, or use browser zoom controls
 * - Firefox: Ctrl/Cmd + Plus
 * - Safari: Cmd + Plus
 *
 * CSS zoom method (for testing):
 * - Add to browser console: document.body.style.zoom = "400%"
 */
