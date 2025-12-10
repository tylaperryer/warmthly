#!/usr/bin/env tsx
/**
 * Compile lego TypeScript files to JavaScript
 * This ensures all lego components and utils are available as .js files for the browser
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync, rmSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const legoDir = join(rootDir, 'lego');
const distLegoDir = join(rootDir, 'dist', 'lego');

/**
 * Copy non-TypeScript files (CSS, JSON, etc.) to dist
 */
function copyNonTypeScriptFiles(src: string, dest: string) {
  if (!existsSync(src)) return;

  const stat = statSync(src);
  if (stat.isDirectory()) {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }
    const entries = readdirSync(src);
    for (const entry of entries) {
      copyNonTypeScriptFiles(join(src, entry), join(dest, entry));
    }
  } else {
    // Copy non-TS files (CSS, JSON, etc.)
    if (!src.endsWith('.ts') && !src.endsWith('.tsx') && !src.endsWith('.d.ts')) {
      const destDir = dirname(dest);
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }
      copyFileSync(src, dest);
    }
  }
}

async function compileLego() {
  console.log('🔨 Compiling lego TypeScript files to JavaScript...');

  // Read the base tsconfig
  const fs = await import('fs/promises');
  const baseTsConfigPath = join(rootDir, 'tsconfig.json');
  const baseTsConfig = JSON.parse(await fs.readFile(baseTsConfigPath, 'utf-8'));

  // Create a temporary tsconfig for lego compilation
  // Note: We don't set rootDir because some lego files import from api/
  // TypeScript will preserve the directory structure naturally
  const legoTsConfig = {
    extends: './tsconfig.json',
    compilerOptions: {
      ...baseTsConfig.compilerOptions,
      outDir: './dist',
      declaration: false,
      declarationMap: false,
      sourceMap: false,
      // Preserve directory structure
      preserveConstEnums: true,
      // Keep paths for compilation, they'll be resolved by resolve-imports.ts
      baseUrl: './',
      // Include types for import.meta.env (Vite types)
      types: ['vite/client', 'node'],
    },
    include: [
      'lego/**/*.ts',
      'lego/**/*.d.ts', // Include type definition files
    ],
    exclude: [
      'lego/**/*.test.ts',
      'lego/**/*.spec.ts',
      'node_modules',
      'dist',
      'apps',
      'scripts',
      '.config',
    ],
  };

  const tempTsConfigPath = join(rootDir, 'tsconfig.lego.json');
  await fs.writeFile(tempTsConfigPath, JSON.stringify(legoTsConfig, null, 2));

  try {
    // Ensure dist/lego directory exists
    if (!existsSync(distLegoDir)) {
      mkdirSync(distLegoDir, { recursive: true });
    }

    // Compile lego directory
    console.log('📝 Running TypeScript compiler for lego directory...');
    execSync(`tsc --project ${tempTsConfigPath}`, {
      cwd: rootDir,
      stdio: 'inherit',
    });

    // Move compiled files from dist/lego to dist/lego (they should already be there)
    // But we need to ensure the structure is correct
    const compiledLegoDir = join(rootDir, 'dist', 'lego');
    if (!existsSync(compiledLegoDir)) {
      mkdirSync(compiledLegoDir, { recursive: true });
    }

    // Copy non-TypeScript files (CSS, JSON, etc.) from source to dist
    console.log('📋 Copying non-TypeScript files (CSS, JSON, etc.)...');
    copyNonTypeScriptFiles(legoDir, compiledLegoDir);

    console.log('✅ Lego directory compiled successfully');
    console.log(`   Output: ${distLegoDir}`);
  } catch (error) {
    console.error('❌ Failed to compile lego directory:', error);
    throw error;
  } finally {
    // Clean up temp config
    if (existsSync(tempTsConfigPath)) {
      rmSync(tempTsConfigPath);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('compile-lego.ts')) {
  compileLego().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { compileLego };

