import { injectAxe, checkA11y } from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

describe('Admin App', () => {
  (test as any).beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/apps/admin/');
    await injectAxe(page as any);
  });

  test('should show login form', async ({ page }: { page: Page }) => {
    const loginForm = (page as any).locator('#login-form');
    await (expect(loginForm) as any).toBeVisible();
  });

  test('should have accessible form inputs', async ({ page }: { page: Page }) => {
    const passwordInput = (page as any).locator('#password-input');
    await (expect(passwordInput) as any).toHaveAttribute('type', 'password');
    await (expect(passwordInput) as any).toHaveAttribute('aria-label');
  });

  test('should pass accessibility checks', async ({ page }: { page: Page }) => {
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('should handle form submission', async ({ page }: { page: Page }) => {
    const passwordInput = (page as any).locator('#password-input');
    const submitButton = (page as any).locator('button[type="submit"]');

    // Fill the form
    await passwordInput.fill('test-password');
    expect(await passwordInput.inputValue()).toBe('test-password');

    // Submit the form and wait for network activity to complete
    await Promise.all([(page as any).waitForLoadState('networkidle'), submitButton.click()]);

    // After submission, the input should be cleared (form resets after submission)
    // Wait for the input value to change
    await (expect(passwordInput) as any).toHaveValue('', { timeout: 5000 });
  });
});
