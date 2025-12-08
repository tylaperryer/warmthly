import { test, expect, type Page } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

test.describe('Admin App', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/apps/admin/');
    await injectAxe(page);
  });

  test('should show login form', async ({ page }: { page: Page }) => {
    const loginForm = page.locator('#login-form');
    await expect(loginForm).toBeVisible();
  });

  test('should have accessible form inputs', async ({ page }: { page: Page }) => {
    const passwordInput = page.locator('#password-input');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordInput).toHaveAttribute('aria-label');
  });

  test('should pass accessibility checks', async ({ page }: { page: Page }) => {
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('should handle form submission', async ({ page }: { page: Page }) => {
    const passwordInput = page.locator('#password-input');
    const submitButton = page.locator('button[type="submit"]');

    // Fill the form
    await passwordInput.fill('test-password');
    expect(await passwordInput.inputValue()).toBe('test-password');

    // Submit the form and wait for network activity to complete
    await Promise.all([page.waitForLoadState('networkidle'), submitButton.click()]);

    // After submission, the input should be cleared (form resets after submission)
    // Wait for the input value to change
    await expect(passwordInput).toHaveValue('', { timeout: 5000 });
  });
});
