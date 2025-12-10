#!/usr/bin/env tsx
/**
 * Build Verification Script
 * Verifies build output before deployment
 * Checks all apps built successfully, required files exist, and bundle sizes
 */

import { readdir, stat, access } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BUILD_DIR = resolve(__dirname, '../dist/apps');
const APPS = ['main', 'mint', 'post', 'admin'];

interface VerificationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Check if a file or directory exists
 */
async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a directory is not empty
 */
async function isNotEmpty(dir: string): Promise<boolean> {
  try {
    const entries = await readdir(dir);
    return entries.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get file size in bytes
 */
async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * Verify build output for a specific app
 */
async function verifyApp(app: string): Promise<VerificationResult> {
  const result: VerificationResult = {
    success: true,
    errors: [],
    warnings: [],
  };

  const appDir = join(BUILD_DIR, app);

  // Check if app directory exists
  if (!(await exists(appDir))) {
    result.success = false;
    result.errors.push(`App directory missing: ${appDir}`);
    return result;
  }

  // Check if app directory is not empty
  if (!(await isNotEmpty(appDir))) {
    result.success = false;
    result.errors.push(`App directory is empty: ${appDir}`);
    return result;
  }

  // Check for required files
  const requiredFiles = ['index.html'];
  for (const file of requiredFiles) {
    const filePath = join(appDir, file);
    if (!(await exists(filePath))) {
      result.success = false;
      result.errors.push(`Required file missing: ${app}/${file}`);
    }
  }

  // Note: Assets are in shared dist/assets/ directory, not per-app
  // This is the expected Vite build structure

  // Check for large files (potential issues)
  const maxFileSize = 5 * 1024 * 1024; // 5MB
  try {
    const files = await readdir(appDir, { recursive: true });
    for (const file of files) {
      const filePath = join(appDir, file);
      const size = await getFileSize(filePath);
      if (size > maxFileSize) {
        result.warnings.push(
          `Large file detected: ${app}/${file} (${(size / 1024 / 1024).toFixed(2)}MB)`
        );
      }
    }
  } catch (error) {
    result.warnings.push(
      `Could not check file sizes for ${app}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return result;
}

/**
 * Verify all apps
 */
async function verifyAllApps(): Promise<VerificationResult> {
  const result: VerificationResult = {
    success: true,
    errors: [],
    warnings: [],
  };

  // Check if build directory exists
  if (!(await exists(BUILD_DIR))) {
    result.success = false;
    result.errors.push(`Build directory missing: ${BUILD_DIR}`);
    return result;
  }

  // Check for shared assets directory (Vite build structure)
  const sharedAssetsDir = resolve(__dirname, '../dist/assets');
  if (!(await exists(sharedAssetsDir))) {
    result.warnings.push('Shared assets directory missing: dist/assets');
  } else if (!(await isNotEmpty(sharedAssetsDir))) {
    result.warnings.push('Shared assets directory is empty: dist/assets');
  }

  // Verify each app
  for (const app of APPS) {
    const appResult = await verifyApp(app);
    if (!appResult.success) {
      result.success = false;
    }
    result.errors.push(...appResult.errors);
    result.warnings.push(...appResult.warnings);
  }

  return result;
}

/**
 * Main verification function
 */
async function verifyBuild(): Promise<number> {
  console.log('🔍 Verifying build output...\n');

  const result = await verifyAllApps();

  // Print results
  if (result.errors.length > 0) {
    console.error('❌ Build verification failed:\n');
    result.errors.forEach(error => {
      console.error(`  - ${error}`);
    });
  }

  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Warnings:\n');
    result.warnings.forEach(warning => {
      console.warn(`  - ${warning}`);
    });
  }

  if (result.success && result.errors.length === 0) {
    console.log('\n✅ Build verification passed!');
    console.log(`   Verified ${APPS.length} apps`);
    return 0;
  }

  return 1;
}

// Run if called directly
const scriptPath = process.argv[1];
if (
  import.meta.url === `file://${scriptPath}` ||
  (scriptPath && import.meta.url.endsWith(scriptPath.replace(/\\/g, '/')))
) {
  const exitCode = await verifyBuild();
  process.exit(exitCode);
}

export { verifyBuild };
