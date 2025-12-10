#!/usr/bin/env tsx
/**
 * Preserve lego directory between TypeScript compilation and Vite build
 * Since vite's emptyOutDir clears dist, we need to backup and restore lego
 */

import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync, rmSync } from 'fs';
import { resolve, join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const distDir = join(rootDir, 'dist');
const legoDir = join(distDir, 'lego');
const tempLegoDir = join(rootDir, '.temp-lego');

function copyRecursive(src: string, dest: string) {
  if (!existsSync(src)) return;

  const stat = statSync(src);
  if (stat.isDirectory()) {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }
    const entries = readdirSync(src);
    for (const entry of entries) {
      copyRecursive(join(src, entry), join(dest, entry));
    }
  } else {
    // Copy .js files (compiled output), CSS files, JSON files, and other assets
    // Exclude TypeScript source files and declaration files
    if (
      src.endsWith('.js') ||
      src.endsWith('.css') ||
      src.endsWith('.json') ||
      (!src.endsWith('.ts') && !src.endsWith('.tsx') && !src.endsWith('.d.ts'))
    ) {
      const destDir = dirname(dest);
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }
      copyFileSync(src, dest);
    }
  }
}

const command = process.argv[2];

if (command === 'backup') {
  // Backup lego directory before vite build
  console.log('📦 Backing up lego directory...');
  if (existsSync(legoDir)) {
    if (existsSync(tempLegoDir)) {
      rmSync(tempLegoDir, { recursive: true, force: true });
    }
    copyRecursive(legoDir, tempLegoDir);
    console.log('✅ Lego directory backed up');
  } else {
    console.warn('⚠️  Lego directory not found, nothing to backup');
  }
} else if (command === 'restore') {
  // Restore lego directory after vite build
  console.log('📦 Restoring lego directory...');
  if (existsSync(tempLegoDir)) {
    copyRecursive(tempLegoDir, legoDir);
    rmSync(tempLegoDir, { recursive: true, force: true });
    console.log('✅ Lego directory restored');
  } else {
    console.warn('⚠️  No backup found, lego directory not restored');
  }
} else {
  console.error('Usage: preserve-lego.ts [backup|restore]');
  process.exit(1);
}
