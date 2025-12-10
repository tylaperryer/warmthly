/**
 * Tests Index - Main Barrel Export
 *
 * This file serves as the main reference/index for all test files across the test suite.
 * It provides a centralized view of all test directories and their purposes.
 *
 * Test files are automatically discovered by Vitest/Playwright, but this index helps with:
 * - Organization and navigation
 * - Understanding test coverage across the entire suite
 * - Maintaining test structure
 * - Quick reference for test locations
 *
 * Note: Test files don't export anything - they contain test cases that test runners discover.
 * This file is for documentation and organization purposes only.
 */

// Import all sub-index files to ensure they're part of the module graph
// This helps with IDE navigation and ensures consistency

// Unit Tests - Individual component and function tests
// See: ./unit/index.ts

// Integration Tests - Tests for component interactions
// See: ./integration/index.ts

// E2E Tests - End-to-end user workflow tests
// See: ./e2e/index.ts

// Security Tests - Security-focused test suites
// See: ./security/index.ts

// Performance Tests - Performance and load tests
// See: ./performance/index.ts

// Accessibility Tests - Accessibility compliance tests
// See: ./accessibility/index.ts

/**
 * Test Directory Structure:
 *
 * /tests/
 *   ├── unit/              - Unit tests for individual components/functions
 *   │   ├── security/      - Security-related unit tests
 *   │   └── index.ts        - Unit tests index
 *   ├── integration/       - Integration tests
 *   │   └── index.ts        - Integration tests index
 *   ├── e2e/               - End-to-end tests
 *   │   └── index.ts        - E2E tests index
 *   ├── security/          - Security test suites
 *   │   └── index.ts        - Security tests index
 *   ├── performance/       - Performance tests
 *   │   └── index.ts        - Performance tests index
 *   ├── accessibility/     - Accessibility tests
 *   │   └── index.ts        - Accessibility tests index
 *   ├── utils/             - Test utilities and helpers
 *   ├── setup.ts           - Test setup configuration
 *   ├── tsconfig.json       - TypeScript configuration for tests
 *   ├── types.d.ts          - Type declarations for tests
 *   └── index.ts           - This file (main index)
 */
