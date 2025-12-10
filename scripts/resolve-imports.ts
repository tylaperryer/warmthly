#!/usr/bin/env tsx
/**
 * Resolve TypeScript path aliases in compiled JavaScript files
 * Converts @config/, @components/, etc. to actual /lego/ paths
 * This is needed because browsers can't resolve TypeScript path aliases
 */

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const distLegoDir = join(rootDir, 'dist', 'lego');

// Path alias mappings - these must match tsconfig.json paths
const pathAliases: Record<string, string> = {
  '@config/': '/lego/config/',
  '@components/': '/lego/components/',
  '@utils/': '/lego/utils/',
  '@core/': '/lego/core/',
  '@styles/': '/lego/styles/',
  '@lego/': '/lego/',
  '@api/': '/api/',
};

function resolveImportsInFile(filePath: string): void {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Replace all path aliases in import/export statements
  for (const [alias, replacement] of Object.entries(pathAliases)) {
    // Match import statements: import ... from '@config/...'
    const importRegex = new RegExp(
      `(import\\s+[^'"]*from\\s+['"])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^'"]+)(['"])`,
      'g'
    );

    // Match export statements: export ... from '@config/...'
    const exportRegex = new RegExp(
      `(export\\s+[^'"]*from\\s+['"])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^'"]+)(['"])`,
      'g'
    );

    const newContent = content
      .replace(importRegex, (_match, before, path, quote) => {
        modified = true;
        return `${before}${replacement}${path}${quote}`;
      })
      .replace(exportRegex, (_match, before, path, quote) => {
        modified = true;
        return `${before}${replacement}${path}${quote}`;
      });

    if (newContent !== content) {
      content = newContent;
    }
  }

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Resolved imports in: ${filePath.replace(rootDir, '')}`);
  }
}

function processDirectory(dir: string): void {
  if (!existsSync(dir)) {
    return;
  }

  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.endsWith('.js')) {
      resolveImportsInFile(fullPath);
    }
  }
}

console.log('🔄 Resolving path aliases in compiled JavaScript files...');
if (existsSync(distLegoDir)) {
  processDirectory(distLegoDir);
  console.log('✅ All imports resolved');
} else {
  console.warn("⚠️  dist/lego directory not found - this is normal if build hasn't run yet");
}
