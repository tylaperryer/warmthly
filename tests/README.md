# Testing Guide

**Phase 5 Issue 5.6: Standardize Test Structure**  
**Phase 5 Issue 5.7: Missing Test Utilities and Helpers**

## Overview

This directory contains all tests for the Warmthly project, organized by test type and functionality.

## Test Structure

```
tests/
├── unit/              # Unit tests for individual components and utilities
│   ├── security/      # Security feature tests
│   └── ...
├── integration/       # Integration tests for API and component interactions
├── e2e/              # End-to-end tests using Playwright
├── security/         # Security-specific tests
├── performance/      # Performance tests
├── accessibility/    # Accessibility tests
├── utils/            # Test utilities and helpers
└── setup.ts          # Test setup and configuration
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage
```bash
npm run test:coverage
```

## Test Utilities

### Mock Request/Response

```typescript
import { createMockRequest, createMockResponse } from '../utils/test-helpers.js';

const req = createMockRequest({
  method: 'POST',
  body: { amount: 100 },
  headers: { 'Content-Type': 'application/json' },
});

const res = createMockResponse();
```

### Mock Fetch Response

```typescript
import { createMockFetchResponse } from '../utils/test-helpers.js';

const response = createMockFetchResponse(
  { data: 'success' },
  { status: 200, headers: { 'X-Custom-Header': 'value' } }
);
```

### Test Data Factories

```typescript
import { TestDataFactory } from '../utils/test-helpers.js';

const user = TestDataFactory.createUser({ email: 'test@example.com' });
const payment = TestDataFactory.createPayment({ amount: 10000 });
const report = TestDataFactory.createReport({ type: 'concern' });
```

### Assertions

```typescript
import { expectStatus, expectErrorCode } from '../utils/test-helpers.js';

expectStatus(response, 200);
expectErrorCode(responseBody, 'VALIDATION_ERROR');
```

## Test Structure Standards

### Unit Tests

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });

  describe('methodName', () => {
    it('should do something', () => {
      // Arrange
      // Act
      // Assert
    });

    it('should handle errors', () => {
      // Test error cases
    });
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockRequest, createMockResponse } from '../utils/test-helpers.js';

describe('API Integration', () => {
  beforeEach(() => {
    // Setup mocks
  });

  it('should handle request/response flow', async () => {
    const req = createMockRequest({ method: 'POST' });
    const res = createMockResponse();
    
    // Test integration
  });
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/path');
  });

  test('should complete user journey', async ({ page }) => {
    // Test user flow
  });
});
```

## Coverage Thresholds

Current coverage thresholds (realistic and maintainable):
- **Lines:** 80%
- **Functions:** 85%
- **Branches:** 75%
- **Statements:** 80%

## Best Practices

1. **Test Structure:**
   - Use `describe` blocks to group related tests
   - Use descriptive test names: "should [expected behavior] when [condition]"
   - Follow AAA pattern: Arrange, Act, Assert

2. **Mocking:**
   - Mock external dependencies (APIs, databases, file system)
   - Use test utilities for common mocks
   - Verify mock calls when appropriate

3. **Assertions:**
   - Use specific assertions (not just `expect(true).toBe(true)`)
   - Test both happy paths and error cases
   - Test edge cases and boundary conditions

4. **Test Data:**
   - Use test data factories for consistent test data
   - Avoid hardcoded test data when possible
   - Clean up test data after tests

5. **Error Testing:**
   - Test all error conditions
   - Verify error messages are appropriate
   - Test error recovery mechanisms

## Security Testing

Security tests are located in `tests/unit/security/` and `tests/security/`:

- **CSRF Protection** (`csrf.test.ts`)
- **Request Signing** (`request-signing.test.ts`)
- **Anomaly Detection** (`anomaly-detection.test.ts`)
- **Certificate Monitoring** (`certificate-monitoring.test.ts`)
- **Penetration Testing** (`penetration-testing.test.ts`)

## Performance Testing

Performance tests verify:
- Bundle sizes meet budgets
- Load times are acceptable
- Memory usage is reasonable
- Core Web Vitals thresholds

## Accessibility Testing

Accessibility tests verify:
- ARIA labels and roles
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Focus management

## Troubleshooting

### Tests Failing Intermittently
- Check for race conditions
- Add appropriate waits/timeouts
- Verify mocks are properly reset

### Coverage Not Meeting Thresholds
- Focus on critical path coverage
- Add tests for uncovered branches
- Consider if threshold is appropriate

### E2E Tests Flaky
- Increase timeouts for slow operations
- Use more specific selectors
- Wait for elements to be ready before interacting

## Next Steps

- [ ] Add more E2E tests for critical user journeys
- [ ] Improve integration test coverage
- [ ] Add visual regression tests
- [ ] Set up test data management
- [ ] Add performance benchmarking

