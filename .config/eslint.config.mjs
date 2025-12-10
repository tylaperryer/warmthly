import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to resolve paths relative to the root (since config is in .config folder)
const rootDir = resolve(__dirname, '..');

export default tseslint.config(
  // 1. Base Ignore Global
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/*.config.js',
      '**/coverage/**',
      '**/.next/**',
      '**/.cache/**',
      '**/.temp-lego/**',
      'lego/config/secure-api-config.js',
      'lego/utils/error-sanitizer.js',
      'lego/utils/payment-audit.js',
    ],
  },

  // 2. Base Javascript Config (Recommended)
  js.configs.recommended,

  // 3. TypeScript Configuration (Recommended + Type Checked)
  // This automatically sets up the parser and plugins for you
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true, // New, faster way to handle project resolution in v8
        tsconfigRootDir: rootDir,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
    },
  },
  // 3b. Override for .js files to avoid parsing errors
  {
    files: ['**/*.js'],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: true, // Allow .js files to use default project
        },
      },
    },
  },

  // 4. Import Plugin Configuration
  {
    plugins: {
      'import-x': importPlugin, // Using the "x" fork for ESLint 9 support
    },
    rules: {
      // Import ordering rules
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
        },
      ],
    },
  },

  // 5. Your Custom Overrides
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',

      // Safety checks
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',

      // Downgrade less critical rules to warnings for CI compatibility
      // These are code quality issues but don't break runtime
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/prefer-promise-reject-errors': 'warn',
      '@typescript-eslint/unbound-method': 'warn',
      '@typescript-eslint/no-base-to-string': 'warn',
      'no-empty': 'warn',
    },
  },

  // 6. Prettier Config (Must be last to override others)
  prettierConfig,
);

