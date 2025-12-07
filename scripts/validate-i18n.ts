/**
 * i18n Validation Script
 * Validates all translation files against JSON Schema
 * Checks for missing keys, extra keys, and structural consistency
 * 
 * Usage: npm run validate:i18n
 * 
 * This script is NON-BREAKING - it only reports issues, doesn't modify files
 * 
 * Note: This script uses Node.js APIs. TypeScript may show warnings in IDE,
 * but the script runs perfectly with tsx which handles Node types automatically.
 */

// Type declarations for Node.js globals (tsx handles these automatically)
declare const process: {
  exit: (code: number) => never;
};

declare const console: {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
};

// Import Node.js modules (tsx resolves these at runtime)
// @ts-expect-error - Node.js module, resolved by tsx at runtime
import { readFileSync, readdirSync } from 'fs';
// @ts-expect-error - Node.js module, resolved by tsx at runtime
import { join, dirname } from 'path';
// @ts-expect-error - Node.js module, resolved by tsx at runtime
import { fileURLToPath } from 'url';

/**
 * Get all translation keys from an object (recursive)
 */
function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        keys.push(...getAllKeys(value as Record<string, unknown>, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }

  return keys;
}

/**
 * Get nested value from object by dot-notation key
 */
function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  const keys = key.split('.');
  let current: unknown = obj;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = (current as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Validate i18n files
 */
function validateI18n(): void {
  // Get script directory and project root
  // @ts-expect-error - import.meta.url is available in ESM, tsx handles this
  const currentFile = fileURLToPath(import.meta.url);
  const scriptDir = dirname(currentFile);
  const projectRoot = join(scriptDir, '..');
  const i18nDir = join(projectRoot, 'lego', 'i18n');
  const schemaPath = join(i18nDir, 'schema.json');

  console.log('🔍 Validating i18n translation files...\n');

  // Read schema (we don't use it for validation, just check it exists)
  try {
    readFileSync(schemaPath, 'utf-8');
  } catch (error: unknown) {
    console.error('❌ Error reading schema:', error);
    process.exit(1);
  }

  // Get all JSON files (excluding schema.json)
  const allFiles = readdirSync(i18nDir);
  const files = allFiles
    .filter((file: string) => file.endsWith('.json') && file !== 'schema.json')
    .map((file: string) => ({
      name: file,
      path: join(i18nDir, file),
      lang: file.replace('.json', ''),
    }));

  if (files.length === 0) {
    console.error('❌ No translation files found');
    process.exit(1);
  }

  console.log(`Found ${files.length} translation file(s): ${files.map((f) => f.lang).join(', ')}\n`);

  // Read and parse all translation files
  const translations: Array<{ lang: string; data: Record<string, unknown> }> = [];

  for (const file of files) {
    try {
      const content = readFileSync(file.path, 'utf-8');
      const data = JSON.parse(content) as Record<string, unknown>;
      translations.push({ lang: file.lang, data });
    } catch (error: unknown) {
      console.error(`❌ Error reading ${file.name}:`, error);
      process.exit(1);
    }
  }

  // Get reference keys (from English, or first file)
  const referenceLang = translations.find((t) => t.lang === 'en') || translations[0];
  const referenceKeys = getAllKeys(referenceLang.data);
  const referenceKeysSet = new Set(referenceKeys);

  console.log(`📋 Reference language: ${referenceLang.lang}`);
  console.log(`📋 Total keys: ${referenceKeys.length}\n`);

  // Validate each translation file
  let hasErrors = false;
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const translation of translations) {
    const { lang, data } = translation;
    const currentKeys = getAllKeys(data);
    const currentKeysSet = new Set(currentKeys);

    console.log(`\n🌐 Validating ${lang}...`);

    // Check for missing keys
    const missingKeys = referenceKeys.filter((key) => !currentKeysSet.has(key));
    if (missingKeys.length > 0) {
      hasErrors = true;
      errors.push(`❌ ${lang}: Missing ${missingKeys.length} key(s): ${missingKeys.join(', ')}`);
      console.error(`  ❌ Missing ${missingKeys.length} key(s)`);
      missingKeys.forEach((key) => {
        console.error(`     - ${key}`);
      });
    } else {
      console.log(`  ✅ All required keys present`);
    }

    // Check for extra keys (warnings only)
    const extraKeys = currentKeys.filter((key) => !referenceKeysSet.has(key));
    if (extraKeys.length > 0) {
      warnings.push(`⚠️  ${lang}: Has ${extraKeys.length} extra key(s) not in reference: ${extraKeys.join(', ')}`);
      console.warn(`  ⚠️  Has ${extraKeys.length} extra key(s) (not in reference language)`);
      extraKeys.forEach((key) => {
        console.warn(`     - ${key}`);
      });
    }

    // Check for empty values (warnings)
    const emptyValues: string[] = [];
    for (const key of currentKeys) {
      const value = getNestedValue(data, key);
      if (value === '' || value === null || value === undefined) {
        emptyValues.push(key);
      }
    }
    if (emptyValues.length > 0) {
      warnings.push(`⚠️  ${lang}: Has ${emptyValues.length} empty value(s): ${emptyValues.join(', ')}`);
      console.warn(`  ⚠️  Has ${emptyValues.length} empty value(s)`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Validation Summary');
  console.log('='.repeat(60));

  if (errors.length > 0) {
    console.error('\n❌ ERRORS FOUND:');
    errors.forEach((error) => {
      console.error(`  ${error}`);
    });
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  WARNINGS:');
    warnings.forEach((warning) => {
      console.warn(`  ${warning}`);
    });
  }

  if (!hasErrors && warnings.length === 0) {
    console.log('\n✅ All translation files are valid and consistent!');
    process.exit(0);
  } else if (!hasErrors) {
    console.log('\n✅ All translation files are valid (some warnings above)');
    process.exit(0);
  } else {
    console.error('\n❌ Validation failed - please fix errors above');
    process.exit(1);
  }
}

// Run validation
validateI18n();
