/**
 * Vite Plugin: Bundle Size Enforcement
 * Fails build if bundle sizes exceed performance budgets
 */

import type { Plugin } from 'vite';
import { checkBundleSizes, BUDGETS } from '../../scripts/check-bundle-size.js';

/**
 * Performance budgets (matching check-bundle-size.js)
 */
const PERFORMANCE_BUDGETS = {
  js: {
    maxInitial: 500, // 500KB max initial JS bundle
    maxTotal: 2000, // 2MB max total JS across all chunks
    maxChunk: 1000, // 1MB max individual chunk size
  },
  css: {
    maxTotal: 100, // 100KB max total CSS
    maxFile: 50, // 50KB max individual CSS file
  },
};

export function bundleSizeEnforce(): Plugin {
  return {
    name: 'bundle-size-enforce',
    apply: 'build',
    closeBundle() {
      // This runs after the build completes
      // The actual enforcement happens in the build script via verify:bundle-size
      // This plugin serves as a reminder and can be extended for inline checks
    },
  };
}

/**
 * Check if bundle sizes are within budgets
 * Called by build script after vite build
 */
export async function enforceBundleBudgets(buildDir: string = 'dist'): Promise<boolean> {
  try {
    const exitCode = await checkBundleSizes(buildDir);
    return exitCode === 0;
  } catch (error) {
    console.error('Bundle size check failed:', error);
    return false;
  }
}

