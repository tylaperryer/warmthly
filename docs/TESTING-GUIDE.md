# Testing Guide

Complete guide for writing, running, and maintaining tests in the Warmthly project.

## Overview

The Warmthly project uses a comprehensive testing strategy:
- **Unit Tests** - Test individual functions and components
- **Integration Tests** - Test API endpoints and component interactions
- **E2E Tests** - Test complete user workflows
- **Accessibility Tests** - Ensure WCAG 2.1 AA compliance

## Test Structure

```
warmthly/tests/
├── unit/              # Unit tests
│   ├── security/      # Security feature tests
│   └── ...            # Other unit tests
├── integration/       # Integration tests
├── e2e/              # End-to-end tests
├── utils/            # Test utilities and helpers
├── setup.ts          # Test setup and configuration
└── README.md         # Test documentation
```

## Running Tests

### All Tests

```bash
npm run test
```

### Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# Accessibility tests
npm run test:a11y
```

### Interactive Mode

```bash
# Vitest UI (unit tests)
npm run test:ui

# Playwright UI (E2E tests)
npm run test:e2e:ui
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
npm run test:coverage:html
```

## Writing Tests

### Unit Tests

Unit tests use **Vitest** and test individual functions/components:

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '@utils/my-function.js';

describe('myFunction', () => {
  it('should return correct value', () => {
    expect(myFunction('input')).toBe('expected output');
  });

  it('should handle errors gracefully', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

### Integration Tests

Integration tests verify API endpoints and component interactions:

```typescript
import { describe, it, expect } from 'vitest';
import { createMockRequest, createMockResponse } from '@tests/utils/test-helpers.js';

describe('POST /api/reports', () => {
  it('should accept valid report data', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        type: 'concern',
        message: 'Test message',
      },
    });
    const res = createMockResponse();

    // Test endpoint
    await handler(req, res);

    expect(res.statusCode).toBe(200);
  });
});
```

### E2E Tests

E2E tests use **Playwright** and test complete user workflows:

```typescript
import { test, expect } from '@playwright/test';

test('payment flow', async ({ page }) => {
  await page.goto('/apps/main/');
  
  // Navigate to donation page
  await page.click('text=Donate');
  
  // Enter amount
  await page.fill('input[name="amount"]', '100');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Verify success
  await expect(page.locator('.success-message')).toBeVisible();
});
```

## Test Utilities

The project provides test utilities in `warmthly/tests/utils/test-helpers.ts`:

### Mock Request/Response

```typescript
import { createMockRequest, createMockResponse } from '@tests/utils/test-helpers.js';

const req = createMockRequest({
  method: 'POST',
  body: { key: 'value' },
  headers: { 'Content-Type': 'application/json' },
});

const res = createMockResponse();
```

### Test Data Factories

```typescript
import { createTestUser, createTestReport } from '@tests/utils/test-helpers.js';

const user = createTestUser({ name: 'John Doe' });
const report = createTestReport({ type: 'concern' });
```

### Common Assertions

```typescript
import { expectValidErrorResponse, expectRateLimitHeaders } from '@tests/utils/test-helpers.js';

expectValidErrorResponse(res, 'VALIDATION_ERROR');
expectRateLimitHeaders(res, 100, 99);
```

## Test Patterns

### Testing Security Features

```typescript
describe('CSRF Protection', () => {
  it('should generate valid CSRF tokens', () => {
    const token = generateCSRFToken();
    expect(token).toMatch(/^[a-zA-Z0-9+/=]+$/);
    expect(token.length).toBeGreaterThan(32);
  });

  it('should validate CSRF tokens', () => {
    const token = generateCSRFToken();
    expect(validateCSRFToken(token, token)).toBe(true);
    expect(validateCSRFToken(token, 'invalid')).toBe(false);
  });

  it('should use constant-time comparison', () => {
    // Test timing safety
    const token = generateCSRFToken();
    const start = performance.now();
    validateCSRFToken(token, token);
    const end = performance.now();
    expect(end - start).toBeLessThan(10); // Should be fast
  });
});
```

### Testing API Endpoints

```typescript
describe('POST /api/reports', () => {
  it('should validate input', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: { name: '', email: 'invalid' },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expectValidErrorResponse(res, 'VALIDATION_ERROR');
  });

  it('should rate limit requests', async () => {
    // Make 101 requests
    for (let i = 0; i < 101; i++) {
      const req = createMockRequest({ method: 'POST', body: validData });
      const res = createMockResponse();
      await handler(req, res);
    }

    // 101st request should be rate limited
    const req = createMockRequest({ method: 'POST', body: validData });
    const res = createMockResponse();
    await handler(req, res);

    expect(res.statusCode).toBe(429);
    expectRateLimitHeaders(res, 100, 0);
  });
});
```

### Testing Components

```typescript
describe('warmthly-button', () => {
  it('should render with correct attributes', () => {
    const button = document.createElement('warmthly-button');
    button.setAttribute('variant', 'primary');
    button.setAttribute('disabled', '');
    document.body.appendChild(button);

    expect(button.getAttribute('variant')).toBe('primary');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('should handle click events', async () => {
    const button = document.createElement('warmthly-button');
    let clicked = false;
    button.addEventListener('click', () => { clicked = true; });
    document.body.appendChild(button);

    button.click();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(clicked).toBe(true);
  });
});
```

## Mocking

### Mock External APIs

```typescript
import { vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'mock' }),
  })
);
```

### Mock Environment Variables

```typescript
import { vi } from 'vitest';

beforeEach(() => {
  process.env.ADMIN_PASSWORD = 'test-password';
  process.env.JWT_SECRET = 'test-secret';
});
```

### Mock Time

```typescript
import { vi } from 'vitest';

it('should handle time-based logic', () => {
  vi.useFakeTimers();
  const now = new Date('2024-01-01');
  vi.setSystemTime(now);

  // Test time-based logic
  expect(getCurrentDate()).toBe('2024-01-01');

  vi.useRealTimers();
});
```

## Test Data Management

### Test Data Factories

Use factories to create consistent test data:

```typescript
// tests/utils/test-helpers.ts
export function createTestUser(overrides = {}) {
  return {
    name: 'Test User',
    email: 'test@example.com',
    ...overrides,
  };
}
```

### Test Isolation

Each test should be independent:

```typescript
describe('User Service', () => {
  beforeEach(() => {
    // Reset state before each test
    clearDatabase();
  });

  it('should create user', () => {
    // Test isolated from other tests
  });
});
```

## Coverage Goals

The project aims for:
- **Lines**: 80% coverage
- **Functions**: 85% coverage
- **Branches**: 75% coverage
- **Statements**: 80% coverage

These are realistic, maintainable thresholds that balance quality with development speed.

## Best Practices

### 1. Write Tests First (TDD)

- Write tests before implementation
- Tests document expected behavior
- Tests catch regressions early

### 2. Test Behavior, Not Implementation

- Test what the code does, not how it does it
- Focus on user-facing behavior
- Avoid testing internal implementation details

### 3. Use Descriptive Test Names

```typescript
// ✅ Good
it('should return 400 when email is invalid', () => { });

// ❌ Bad
it('test email', () => { });
```

### 4. Keep Tests Simple

- One assertion per test when possible
- Test one thing at a time
- Avoid complex test setup

### 5. Test Error Cases

- Test invalid input
- Test edge cases
- Test error handling

### 6. Use Test Utilities

- Reuse test helpers
- Create factories for test data
- Standardize test patterns

## CI/CD Integration

Tests run automatically in GitHub Actions:

1. **On Push**: All tests run
2. **On PR**: Tests must pass before merge
3. **Coverage**: Coverage reports uploaded to CI
4. **E2E Tests**: Run in headless browsers

## Troubleshooting

### Tests Failing Locally

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear test cache: `npm run test -- --clearCache`
- Check environment variables are set

### E2E Tests Flaky

- Add explicit waits instead of fixed timeouts
- Use `page.waitForSelector()` instead of `sleep()`
- Ensure test isolation

### Coverage Not Increasing

- Check coverage thresholds in `vitest.config.ts`
- Verify tests are actually running
- Check for untested code paths

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Last Updated:** 2024-12-19  
**Maintained By:** Warmthly Development Team

