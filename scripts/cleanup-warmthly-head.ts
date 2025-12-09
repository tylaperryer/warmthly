#!/usr/bin/env node
/**
 * Cleanup script to remove leftover language entries from warmthly-head.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const filePath = join(projectRoot, 'lego/components/warmthly-head.ts');

if (!existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

const content = readFileSync(filePath, 'utf-8');

// Remove all lines matching the pattern: { code: 'xx', locale: 'xx_XX' },
const lines = content.split('\n');
const cleaned = lines.filter(line => {
  // Remove lines that are just language entries
  const trimmed = line.trim();
  if (/^\s*\{ code: ['"][^'"]+['"],\s*locale:\s*['"][^'"]+['"]\s*\},?\s*$/.test(trimmed)) {
    return false;
  }
  // Remove comment lines that are just language category comments
  if (
    /^\s*\/\/\s*(RTL Languages|South Asian Languages|Southeast Asian Languages|African Languages|European Languages|Additional Major Languages|Additional languages)/.test(
      trimmed
    )
  ) {
    return false;
  }
  return true;
});

writeFileSync(filePath, cleaned.join('\n'), 'utf-8');
console.log(`Removed ${lines.length - cleaned.length} leftover language entries`);
