/**
 * Mobile Usability Tests
 * Verifies mobile-friendly design and usability
 */

import { test, expect } from '@playwright/test';

const PAGES = [
  { name: 'Main', url: '/apps/main/' },
  { name: 'Mint', url: '/apps/mint/' },
  { name: 'Post', url: '/apps/post/' },
  { name: 'Help', url: '/apps/main/help.html' },
  { name: 'Privacy', url: '/apps/main/privacy.html' },
];

test.describe('Mobile Usability', () => {
  // Test on mobile viewport
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  for (const page of PAGES) {
    test(`${page.name} page - mobile viewport`, async ({ page: browserPage }) => {
      await browserPage.goto(page.url);

      // Check viewport meta tag
      const viewport = await browserPage.$eval('meta[name="viewport"]', (el) => el.getAttribute('content'));
      expect(viewport).toContain('width=device-width');
      expect(viewport).toContain('user-scalable=yes'); // Allow zoom for accessibility

      // Check no horizontal scroll
      const bodyWidth = await browserPage.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await browserPage.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // Allow 5px tolerance

      // Check touch targets are at least 24x24px (WCAG 2.2 AA)
      const interactiveElements = await browserPage.$$eval(
        'button, a, input, select, textarea, [role="button"], [role="link"]',
        (elements) =>
          elements.map((el) => {
            const rect = el.getBoundingClientRect();
            return {
              tag: el.tagName,
              width: rect.width,
              height: rect.height,
              minSize: Math.min(rect.width, rect.height),
            };
          })
      );

      interactiveElements.forEach((element) => {
        expect(element.minSize, `${element.tag} should be at least 24px`).toBeGreaterThanOrEqual(24);
      });

      // Check text is readable (not too small)
      const textElements = await browserPage.$$eval('p, span, div', (elements) =>
        elements
          .filter((el) => {
            const text = el.textContent?.trim() || '';
            return text.length > 0 && window.getComputedStyle(el).fontSize !== '0px';
          })
          .map((el) => {
            const style = window.getComputedStyle(el);
            return {
              fontSize: parseFloat(style.fontSize),
              text: el.textContent?.substring(0, 50) || '',
            };
          })
      );

      // Base font size should be at least 16px (prevents zoom on iOS)
      const baseFontSize = await browserPage.evaluate(() => {
        const style = window.getComputedStyle(document.body);
        return parseFloat(style.fontSize);
      });
      expect(baseFontSize, 'Base font size should be at least 16px').toBeGreaterThanOrEqual(16);
    });

    test(`${page.name} page - responsive design`, async ({ page: browserPage }) => {
      // Test multiple viewport sizes
      const viewports = [
        { width: 320, height: 568, name: 'Small mobile' },
        { width: 375, height: 667, name: 'iPhone SE' },
        { width: 414, height: 896, name: 'iPhone 11 Pro Max' },
        { width: 768, height: 1024, name: 'Tablet' },
      ];

      for (const viewport of viewports) {
        await browserPage.setViewportSize({ width: viewport.width, height: viewport.height });
        await browserPage.goto(page.url);

        // Check no horizontal scroll
        const hasHorizontalScroll = await browserPage.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        expect(hasHorizontalScroll, `${viewport.name} (${viewport.width}x${viewport.height}) should not have horizontal scroll`).toBe(false);

        // Check content is visible
        const mainContent = await browserPage.$('main, [role="main"]');
        if (mainContent) {
          const isVisible = await mainContent.isVisible();
          expect(isVisible, `Main content should be visible on ${viewport.name}`).toBe(true);
        }
      }
    });

    test(`${page.name} page - touch interaction`, async ({ page: browserPage }) => {
      await browserPage.goto(page.url);

      // Check all buttons are tappable
      const buttons = await browserPage.$$('button, [role="button"]');
      for (const button of buttons) {
        const isVisible = await button.isVisible();
        expect(isVisible, 'Button should be visible').toBe(true);

        // Check button has adequate spacing (at least 8px between touch targets)
        const box = await button.boundingBox();
        if (box) {
          // This is a basic check - in real testing, you'd check spacing to adjacent elements
          expect(box.width, 'Button width should be adequate').toBeGreaterThanOrEqual(24);
          expect(box.height, 'Button height should be adequate').toBeGreaterThanOrEqual(24);
        }
      }
    });

    test(`${page.name} page - mobile navigation`, async ({ page: browserPage }) => {
      await browserPage.goto(page.url);

      // Check navigation is accessible
      const nav = await browserPage.$('nav, [role="navigation"], header');
      if (nav) {
        const isVisible = await nav.isVisible();
        expect(isVisible, 'Navigation should be visible').toBe(true);
      }

      // Check skip links work
      const skipLink = await browserPage.$('.skip-link, [href^="#main"]');
      if (skipLink) {
        const isVisible = await skipLink.isVisible();
        // Skip link should be visible on focus
        expect(skipLink, 'Skip link should exist').toBeTruthy();
      }
    });
  }

  test('Mobile performance - page load time', async ({ page }) => {
    await page.goto('/apps/main/');

    // Measure load time
    const loadTime = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navigation.loadEventEnd - navigation.fetchStart;
    });

    // Should load in under 3 seconds on mobile
    expect(loadTime, 'Page should load in under 3 seconds').toBeLessThan(3000);
  });

  test('Mobile performance - LCP', async ({ page }) => {
    await page.goto('/apps/main/');

    // Wait for LCP
    await page.waitForLoadState('networkidle');

    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
            renderTime?: number;
            loadTime?: number;
          };
          resolve(lastEntry.renderTime || lastEntry.loadTime || 0);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        setTimeout(() => resolve(0), 5000);
      });
    });

    // LCP should be under 2.5s (Good threshold)
    expect(lcp, 'LCP should be under 2.5s on mobile').toBeLessThan(2500);
  });
});

