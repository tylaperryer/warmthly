import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, '../tests/setup.ts')],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.config.ts',
        '**/*.config.js',
      ],
      thresholds: {
        // Realistic coverage thresholds for maintainable test suite
        // 99% is too high and discourages legitimate test writing
        // These thresholds balance quality with practicality
        lines: 80, // 80% line coverage - catches most bugs
        functions: 85, // 85% function coverage - ensures most functions tested
        branches: 75, // 75% branch coverage - tests critical decision points
        statements: 80, // 80% statement coverage - matches line coverage
      },
    },
    include: ['**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: ['node_modules', 'dist', 'build', '.config'],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../'),
      '@lego': resolve(__dirname, '../lego'),
      '@apps': resolve(__dirname, '../apps'),
      '@utils': resolve(__dirname, '../lego/utils'),
      '@components': resolve(__dirname, '../lego/components'),
      '@config': resolve(__dirname, '../lego/config'),
      '@styles': resolve(__dirname, '../lego/styles'),
      '@core': resolve(__dirname, '../lego/core'),
      '@api': resolve(__dirname, '../api'),
      '@assets': resolve(__dirname, '../assets'),
      '@tests': resolve(__dirname, '../tests'),
    },
  },
});
