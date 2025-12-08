import js from '@eslint/js';
import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

export default [
  // Base ESLint recommended rules
  js.configs.recommended,

  // Global ignores
  {
    ignores: ['dist/**', 'build/**', 'node_modules/**', '*.config.js'],
  },

  // TypeScript files configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: resolve(__dirname, '../tsconfig.json'),
        tsconfigRootDir: resolve(__dirname, '..'),
      },
    },
    plugins: {
      '@typescript-eslint': tseslintPlugin,
      import: importPlugin,
    },
    rules: {
      // TypeScript ESLint recommended rules
      ...tseslintPlugin.configs.recommended.rules,
      // TypeScript ESLint overrides
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',

      // Import ordering rules
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
        },
      ],

      // Prettier integration (disables conflicting rules)
      ...prettierConfig.rules,
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      import: importPlugin,
    },
    rules: {
      // Import ordering rules
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
        },
      ],

      // Prettier integration
      ...prettierConfig.rules,
    },
  },
];

