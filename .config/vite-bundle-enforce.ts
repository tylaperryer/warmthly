/**
 * Vite Plugin: Bundle Size Enforcement
 * Fails build if bundle sizes exceed performance budgets
 */

import type { Plugin } from 'vite';

import { checkBundleSizes } from '../scripts/check-bundle-size.js';

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
export function enforceBundleBudgets(buildDir: string = 'dist'): boolean {
  try {
    const exitCode = checkBundleSizes(buildDir);
    return exitCode === 0;
  } catch (error) {
    console.error('Bundle size check failed:', error);
    return false;
  }
}
