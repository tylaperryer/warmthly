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
  const originalContent = content;
  let modified = false;

  // Replace all path aliases in import/export statements
  for (const [alias, replacement] of Object.entries(pathAliases)) {
    // Escape the alias for regex
    const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Use a simpler, more permissive approach: match the alias in any import/export context
    // Pattern 1: import ... from '@config/...' (handles all import variations)
    // This pattern matches: import { x } from '@config/...', import x from '@config/...', import type x from '@config/...'
    const importFromPattern = new RegExp(
      `(import\\s+(?:type\\s+)?.*?\\s+from\\s+['"])${escapedAlias}([^'"]+)(['"])`,
      'g'
    );
    
    // Pattern 2: export ... from '@config/...'
    const exportFromPattern = new RegExp(
      `(export\\s+(?:type\\s+)?.*?\\s+from\\s+['"])${escapedAlias}([^'"]+)(['"])`,
      'g'
    );
    
    // Pattern 3: import '@config/...' (side-effect import)
    const sideEffectPattern = new RegExp(
      `(import\\s+['"])${escapedAlias}([^'"]+)(['"])`,
      'g'
    );
    
    // Pattern 4: import('@config/...') (dynamic import)
    const dynamicPattern = new RegExp(
      `(import\\s*\\(\\s*['"])${escapedAlias}([^'"]+)(['"]\\s*\\))`,
      'g'
    );
    
    // Apply all replacements
    const beforeReplace = content;
    content = content
      .replace(importFromPattern, (_match, before, path, quote) => {
        modified = true;
        return `${before}${replacement}${path}${quote}`;
      })
      .replace(exportFromPattern, (_match, before, path, quote) => {
        modified = true;
        return `${before}${replacement}${path}${quote}`;
      })
      .replace(sideEffectPattern, (_match, before, path, quote) => {
        modified = true;
        return `${before}${replacement}${path}${quote}`;
      })
      .replace(dynamicPattern, (_match, before, path, quote) => {
        modified = true;
        return `${before}${replacement}${path}${quote}`;
      });
    
    if (content !== beforeReplace) {
      modified = true;
    }
  }

  if (modified && content !== originalContent) {
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

function verifyNoUnresolvedImports(dir: string): { hasErrors: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!existsSync(dir)) {
    return { hasErrors: false, errors: [] };
  }

  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      const subResult = verifyNoUnresolvedImports(fullPath);
      errors.push(...subResult.errors);
    } else if (entry.endsWith('.js')) {
      const content = readFileSync(fullPath, 'utf-8');
      // Check for any remaining path aliases in actual code (not comments)
      // Look for patterns like: from '@config/', import('@utils/', etc.
      for (const alias of Object.keys(pathAliases)) {
        // Check if alias appears in import/export statements (not just anywhere)
        const importPattern = new RegExp(
          `(?:import|export|from|import\\s*\\().*${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
          'g'
        );
        if (importPattern.test(content)) {
          // Double-check it's not just in a comment
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.includes(alias) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
              errors.push(`${fullPath.replace(rootDir, '')}:${index + 1} - Found unresolved alias: ${alias}`);
            }
          });
        }
      }
    }
  }

  return { hasErrors: errors.length > 0, errors };
}

console.log('🔄 Resolving path aliases in compiled JavaScript files...');
if (existsSync(distLegoDir)) {
  processDirectory(distLegoDir);
  
  // Verify no unresolved imports remain
  console.log('🔍 Verifying all imports are resolved...');
  const verification = verifyNoUnresolvedImports(distLegoDir);
  
  if (verification.hasErrors) {
    console.error('❌ ERROR: Found unresolved path aliases:');
    verification.errors.forEach(error => console.error(`  ${error}`));
    console.error('\n❌ Build failed: Some imports were not resolved!');
    process.exit(1);
  }
  
  console.log('✅ All imports resolved and verified');
} else {
  console.warn("⚠️  dist/lego directory not found - this is normal if build hasn't run yet");
}
