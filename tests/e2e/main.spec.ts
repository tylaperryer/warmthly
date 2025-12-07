import { test, expect, type Page } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

test.describe('Main App', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/apps/main/');
    await injectAxe(page);
  });

  test('should load the main page', async ({ page }: { page: Page }) => {
    await expect(page).toHaveTitle(/Warmthly/i);
  });

  test('should have accessible navigation', async ({ page }: { page: Page }) => {
    const nav = page.locator('warmthly-header');
    await expect(nav).toBeVisible();
  });

  test('should pass accessibility checks', async ({ page }: { page: Page }) => {
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('should be keyboard navigable', async ({ page }: { page: Page }) => {
    // Press Tab to focus the first focusable element
    await page.keyboard.press('Tab');
    
    // Verify that an element is focused (keyboard navigation works)
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible({ timeout: 1000 });
    
    // Verify the focused element is actually focusable
    const focusedElement = focused.first();
    const tagName = await focusedElement.evaluate((el: Element) => el.tagName.toLowerCase());
    const focusableTags = ['a', 'button', 'input', 'select', 'textarea', 'details', 'summary'];
    expect(focusableTags.includes(tagName)).toBeTruthy();
  });
});

