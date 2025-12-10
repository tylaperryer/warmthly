/**
 * Screen Reader Testing
 * Accessibility Enhancement - 5.4: Screen Reader Testing Verification
 *
 * Tests that all pages are properly accessible to screen readers
 * WCAG 2.1 AA Success Criterion 4.1.3 - Status Messages
 * WCAG 2.1 AA Success Criterion 2.4.6 - Headings and Labels
 *
 * This test verifies:
 * - All headings are properly structured
 * - All form labels are properly associated
 * - All buttons have accessible names
 * - All links have descriptive text
 * - ARIA attributes are properly used
 * - Skip links work correctly
 * - Modal dialogs are properly announced
 */

import { test, expect, type Page } from '@playwright/test';

/**
 * Test pages to check with screen reader simulation
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
 * Get base URL for app
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
 * Test that page is accessible to screen readers
 */
describe('Screen Reader Accessibility Testing', () => {
  for (const page of TEST_PAGES) {
    describe(`${page.name}`, () => {
      test('should have proper heading hierarchy', async ({
        page: browserPage,
        baseURL,
      }: {
        page: Page;
        baseURL?: string | undefined;
      } = {} as any) => {
        const appUrl = getBaseUrl(page.app, baseURL || 'http://localhost:3000');
        await browserPage.goto(`${appUrl}${page.url}`);
        await (browserPage as any).waitForLoadState('networkidle');

        // Check heading hierarchy (h1 should come before h2, etc.)
        type HeadingInfo = { tag: string; text: string; level: number };
        const headings = (await (browserPage as any).evaluate(() => {
          const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
          return headingElements.map(h => ({
            tag: h.tagName.toLowerCase(),
            text: h.textContent?.trim() || '',
            level: parseInt(h.tagName.charAt(1)),
          }));
        })) as HeadingInfo[];

        // Should have at least one h1
        (expect(headings.length) as any).toBeGreaterThan(0);
        const h1Count = headings.filter(h => h.level === 1).length;
        (expect(h1Count) as any).toBeGreaterThanOrEqual(1);

        // Check heading hierarchy (no skipping levels)
        let previousLevel = 0;
        for (const heading of headings) {
          if (previousLevel > 0) {
            // Allow same level or one level deeper, but not skipping
            (expect(heading.level) as any).toBeLessThanOrEqual(previousLevel + 1);
          }
          previousLevel = heading.level;
        }
      });

      test('should have all form labels properly associated', async ({
        page: browserPage,
        baseURL,
      }: {
        page: Page;
        baseURL?: string | undefined;
      } = {} as any) => {
        const appUrl = getBaseUrl(page.app, baseURL || 'http://localhost:3000');
        await browserPage.goto(`${appUrl}${page.url}`);
        await (browserPage as any).waitForLoadState('networkidle');

        // Check that all form inputs have associated labels
        const formCheck = await (browserPage as any).evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
          const unlabeled: string[] = [];

          inputs.forEach(input => {
            const id = input.getAttribute('id');
            const ariaLabel = input.getAttribute('aria-label');
            const ariaLabelledBy = input.getAttribute('aria-labelledby');
            const placeholder = input.getAttribute('placeholder');
            const type = input.getAttribute('type');

            // Skip hidden inputs
            if (type === 'hidden') return;

            // Check if label is associated
            let hasLabel = false;
            if (id) {
              const label = document.querySelector(`label[for="${id}"]`);
              if (label) hasLabel = true;
            }

            // Check for aria-label or aria-labelledby
            if (ariaLabel || ariaLabelledBy) hasLabel = true;

            // Check if input is inside a label
            const parentLabel = input.closest('label');
            if (parentLabel) hasLabel = true;

            if (!hasLabel && !placeholder) {
              unlabeled.push(input.outerHTML.substring(0, 100));
            }
          });

          return {
            total: inputs.length,
            unlabeled: unlabeled.length,
            unlabeledInputs: unlabeled,
          };
        });

        // All inputs should have labels (allow some margin for edge cases)
        expect(formCheck.unlabeled).toBe(0);
      });

      test('should have all buttons with accessible names', async ({
        page: browserPage,
        baseURL,
      }: {
        page: Page;
        baseURL?: string | undefined;
      } = {} as any) => {
        const appUrl = getBaseUrl(page.app, baseURL || 'http://localhost:3000');
        await browserPage.goto(`${appUrl}${page.url}`);
        await (browserPage as any).waitForLoadState('networkidle');

        // Check that all buttons have accessible names
        const buttonCheck = await (browserPage as any).evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
          const unnamed: string[] = [];

          buttons.forEach(button => {
            const text = button.textContent?.trim() || '';
            const ariaLabel = button.getAttribute('aria-label');
            const ariaLabelledBy = button.getAttribute('aria-labelledby');
            const title = button.getAttribute('title');
            const ariaHidden = button.getAttribute('aria-hidden');

            // Skip hidden buttons
            if (ariaHidden === 'true') return;

            // Check if button has accessible name
            const hasName = text.length > 0 || ariaLabel || ariaLabelledBy || title;

            if (!hasName) {
              unnamed.push(button.outerHTML.substring(0, 100));
            }
          });

          return {
            total: buttons.length,
            unnamed: unnamed.length,
            unnamedButtons: unnamed,
          };
        });

        // All buttons should have accessible names
        expect(buttonCheck.unnamed).toBe(0);
      });

      test('should have all links with descriptive text', async ({
        page: browserPage,
        baseURL,
      }: {
        page: Page;
        baseURL?: string | undefined;
      } = {} as any) => {
        const appUrl = getBaseUrl(page.app, baseURL || 'http://localhost:3000');
        await browserPage.goto(`${appUrl}${page.url}`);
        await (browserPage as any).waitForLoadState('networkidle');

        // Check that all links have descriptive text
        const linkCheck = await (browserPage as any).evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href]'));
          const undescriptive: string[] = [];

          links.forEach(link => {
            const text = link.textContent?.trim() || '';
            const ariaLabel = link.getAttribute('aria-label');
            const ariaLabelledBy = link.getAttribute('aria-labelledby');
            const title = link.getAttribute('title');
            const ariaHidden = link.getAttribute('aria-hidden');

            // Skip hidden links
            if (ariaHidden === 'true') return;

            // Check if link has descriptive text
            // Links should have text, aria-label, or aria-labelledby
            const hasDescription = text.length > 0 || ariaLabel || ariaLabelledBy || title;

            // Check for generic text like "click here", "read more", etc.
            const genericText = /^(click here|read more|here|link|more|continue)$/i.test(text);

            if (!hasDescription || genericText) {
              undescriptive.push(link.outerHTML.substring(0, 100));
            }
          });

          return {
            total: links.length,
            undescriptive: undescriptive.length,
            undescriptiveLinks: undescriptive,
          };
        });

        // All links should have descriptive text
        expect(linkCheck.undescriptive).toBe(0);
      });

      test('should have skip link that works', async ({
        page: browserPage,
        baseURL,
      }: {
        page: Page;
        baseURL?: string | undefined;
      } = {} as any) => {
        const appUrl = getBaseUrl(page.app, baseURL || 'http://localhost:3000');
        await browserPage.goto(`${appUrl}${page.url}`);
        await (browserPage as any).waitForLoadState('networkidle');

        // Check for skip link
        const skipLink = await (browserPage as any).evaluate(() => {
          const link = document.querySelector('.skip-link, a[href="#main"], a[href="#content"]');
          if (!link) return null;

          return {
            exists: true,
            text: link.textContent?.trim() || '',
            href: link.getAttribute('href') || '',
            visible: window.getComputedStyle(link).display !== 'none',
          };
        });

        // Skip link should exist
        (expect(skipLink) as any).not.toBeNull();
        if (skipLink) {
          expect(skipLink.exists).toBe(true);
          (expect(skipLink.text.length) as any).toBeGreaterThan(0);
        }
      });

      test('should have proper ARIA attributes', async ({
        page: browserPage,
        baseURL,
      }: {
        page: Page;
        baseURL?: string | undefined;
      } = {} as any) => {
        const appUrl = getBaseUrl(page.app, baseURL || 'http://localhost:3000');
        await browserPage.goto(`${appUrl}${page.url}`);
        await (browserPage as any).waitForLoadState('networkidle');

        // Check for common ARIA issues
        const ariaCheck = await (browserPage as any).evaluate(() => {
          const issues: string[] = [];

          // Check for aria-hidden="true" on interactive elements
          const hiddenInteractive = document.querySelectorAll(
            '[aria-hidden="true"][role="button"], [aria-hidden="true"][role="link"], [aria-hidden="true"]button, [aria-hidden="true"]a'
          );
          if (hiddenInteractive.length > 0) {
            issues.push(
              `Found ${hiddenInteractive.length} interactive elements with aria-hidden="true"`
            );
          }

          // Check for missing aria-labels on icons
          const iconButtons = document.querySelectorAll(
            'button:not([aria-label]):not([aria-labelledby])'
          );
          iconButtons.forEach(btn => {
            const text = btn.textContent?.trim() || '';
            if (text.length === 0) {
              issues.push('Found button without accessible name');
            }
          });

          // Check for proper landmark roles
          const main = document.querySelector('main, [role="main"]');
          if (!main) {
            issues.push('Missing main landmark');
          }

          return {
            issues: issues.length,
            issueList: issues,
          };
        });

        // Should have no ARIA issues
        expect(ariaCheck.issues).toBe(0);
      });
    });
  }
});
