#!/usr/bin/env tsx
/**
 * Copy compiled lego directory to each app's dist folder
 * This ensures lego components are available at /lego/ path for each app
 */

import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const distLegoDir = join(rootDir, 'dist', 'lego');
const apps = ['main', 'mint', 'post', 'admin'];

function copyRecursive(src: string, dest: string) {
  if (!existsSync(src)) return;

  const stat = statSync(src);
  if (stat.isDirectory()) {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }
    const entries = readdirSync(src);
    for (const entry of entries) {
      // Skip .map and .d.ts files - we only need .js, .css, .json, etc.
      if (entry.endsWith('.map') || entry.endsWith('.d.ts')) {
        continue;
      }
      copyRecursive(join(src, entry), join(dest, entry));
    }
  } else {
    // Copy all files except .map and .d.ts
    if (!src.endsWith('.map') && !src.endsWith('.d.ts')) {
      const destDir = dirname(dest);
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }
      copyFileSync(src, dest);
    }
  }
}

async function copyLegoToApps() {
  console.log('📋 Copying lego directory...');

  // dist/lego/ should exist at root after preserve-lego.ts restore
  // This is where Cloudflare Pages will serve /lego/ from
  if (!existsSync(distLegoDir)) {
    console.error('❌ dist/lego directory not found at root!');
    console.error('   This should have been restored by preserve-lego.ts');
    console.error('   Check that the build process completed successfully.');
    process.exit(1);
  }

  // Verify that dist/lego has actual files
  const legoComponentsDir = join(distLegoDir, 'components');
  if (!existsSync(legoComponentsDir)) {
    console.error('❌ dist/lego/components directory not found!');
    console.error('   The lego directory may not have been compiled correctly.');
    process.exit(1);
  }

  console.log('  ✓ dist/lego/ exists at root (for Cloudflare Pages /lego/ paths)');

  // Copy to each app's directory for relative path support
  for (const app of apps) {
    const appDir = join(rootDir, 'dist', 'apps', app);
    const appLegoDir = join(appDir, 'lego');

    if (!existsSync(appDir)) {
      console.warn(`⚠️  App directory not found: ${appDir}`);
      continue;
    }

    console.log(`  Copying to ${app}/lego/...`);
    copyRecursive(distLegoDir, appLegoDir);
  }

  console.log('✅ Lego directory available at root and all apps');
  console.log(`   Root: ${distLegoDir}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('copy-lego-to-apps.ts')) {
  copyLegoToApps().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { copyLegoToApps };

