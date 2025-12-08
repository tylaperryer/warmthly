/**
 * Structured Data Validator
 * Validates all JSON-LD structured data on pages
 *
 * Usage: npm run validate:structured-data
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { findHTMLFiles } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface ValidationIssue {
  file: string;
  line: number;
  issue: string;
  schema: string;
}

/**
 * Extract JSON-LD scripts from HTML
 * Handles multiline scripts properly
 */
function extractStructuredData(html: string): Array<{ json: object; line: number }> {
  const scripts: Array<{ json: object; line: number }> = [];

  // Match script tags with type="application/ld+json" (handles multiline)
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  // Find line numbers for matches
  while ((match = scriptRegex.exec(html)) !== null) {
    const jsonContent = match[1];
    if (!jsonContent) continue;

    // Calculate line number by counting newlines before the match
    const beforeMatch = html.substring(0, match.index);
    const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;

    try {
      const json = JSON.parse(jsonContent.trim());
      scripts.push({ json, line: lineNumber });
    } catch (error) {
      // Invalid JSON - will be caught in validation
      // Add an issue for invalid JSON
      scripts.push({
        json: {},
        line: lineNumber,
      });
    }
  }

  return scripts;
}

/**
 * Validate a single structured data object
 */
function validateSchema(schema: object, line: number, file: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check if schema is empty (invalid JSON)
  if (Object.keys(schema).length === 0) {
    issues.push({
      file,
      line,
      issue: 'Invalid JSON in structured data script',
      schema: '{}',
    });
    return issues;
  }

  // Check required fields
  if (!('@context' in schema)) {
    issues.push({
      file,
      line,
      issue: 'Missing @context field',
      schema: JSON.stringify(schema).substring(0, 100),
    });
  }

  if (!('@type' in schema)) {
    issues.push({
      file,
      line,
      issue: 'Missing @type field',
      schema: JSON.stringify(schema).substring(0, 100),
    });
  }

  // Validate @context - use case-insensitive check and proper URL validation
  if ('@context' in schema) {
    const context = (schema as { '@context': unknown })['@context'];
    if (typeof context !== 'string') {
      issues.push({
        file,
        line,
        issue: 'Invalid @context - must be a string',
        schema: JSON.stringify(schema).substring(0, 100),
      });
    } else {
      const normalizedContext = context.trim().toLowerCase();
      if (!normalizedContext.startsWith('https://schema.org')) {
        issues.push({
          file,
          line,
          issue: 'Invalid @context - must be a schema.org URL',
          schema: JSON.stringify(schema).substring(0, 100),
        });
      }
    }
  }

  // Validate @type
  if ('@type' in schema) {
    const type = (schema as { '@type': unknown })['@type'];
    if (typeof type !== 'string') {
      issues.push({
        file,
        line,
        issue: 'Invalid @type - must be a string',
        schema: JSON.stringify(schema).substring(0, 100),
      });
    }
  }

  // Type-specific validations
  const schemaType = (schema as { '@type'?: string })['@type'];

  if (schemaType === 'Organization') {
    if (!('name' in schema)) {
      issues.push({
        file,
        line,
        issue: 'Organization schema missing required "name" field',
        schema: JSON.stringify(schema).substring(0, 100),
      });
    }
    if (!('url' in schema)) {
      issues.push({
        file,
        line,
        issue: 'Organization schema missing required "url" field',
        schema: JSON.stringify(schema).substring(0, 100),
      });
    }
  }

  if (schemaType === 'WebSite') {
    if (!('name' in schema)) {
      issues.push({
        file,
        line,
        issue: 'WebSite schema missing required "name" field',
        schema: JSON.stringify(schema).substring(0, 100),
      });
    }
    if (!('url' in schema)) {
      issues.push({
        file,
        line,
        issue: 'WebSite schema missing required "url" field',
        schema: JSON.stringify(schema).substring(0, 100),
      });
    }
  }

  if (schemaType === 'HowTo') {
    if (!('name' in schema)) {
      issues.push({
        file,
        line,
        issue: 'HowTo schema missing required "name" field',
        schema: JSON.stringify(schema).substring(0, 100),
      });
    }
    if (!('step' in schema)) {
      issues.push({
        file,
        line,
        issue: 'HowTo schema missing required "step" field',
        schema: JSON.stringify(schema).substring(0, 100),
      });
    }
  }

  if (schemaType === 'VideoObject') {
    if (!('name' in schema)) {
      issues.push({
        file,
        line,
        issue: 'VideoObject schema missing required "name" field',
        schema: JSON.stringify(schema).substring(0, 100),
      });
    }
    if (!('description' in schema)) {
      issues.push({
        file,
        line,
        issue: 'VideoObject schema missing required "description" field',
        schema: JSON.stringify(schema).substring(0, 100),
      });
    }
  }

  if (schemaType === 'DonateAction') {
    if (!('target' in schema)) {
      issues.push({
        file,
        line,
        issue: 'DonateAction schema missing required "target" field',
        schema: JSON.stringify(schema).substring(0, 100),
      });
    }
  }

  if (schemaType === 'FAQPage') {
    if (!('mainEntity' in schema)) {
      issues.push({
        file,
        line,
        issue: 'FAQPage schema missing required "mainEntity" field',
        schema: JSON.stringify(schema).substring(0, 100),
      });
    }
  }

  if (schemaType === 'BreadcrumbList') {
    if (!('itemListElement' in schema)) {
      issues.push({
        file,
        line,
        issue: 'BreadcrumbList schema missing required "itemListElement" field',
        schema: JSON.stringify(schema).substring(0, 100),
      });
    }
  }

  return issues;
}

/**
 * Audit HTML file for structured data
 */
function auditFile(filePath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const structuredData = extractStructuredData(content);

    structuredData.forEach(({ json, line }) => {
      const relativePath = filePath.replace(projectRoot, '').replace(/\\/g, '/');
      const fileIssues = validateSchema(json, line, relativePath);
      issues.push(...fileIssues);
    });
  } catch (error) {
    const relativePath = filePath.replace(projectRoot, '').replace(/\\/g, '/');
    issues.push({
      file: relativePath,
      line: 1,
      issue: `Error reading file: ${error instanceof Error ? error.message : String(error)}`,
      schema: '',
    });
  }

  return issues;
}

/**
 * Main validation function
 */
function validateStructuredData(): void {
  console.log('🔍 Validating structured data across all HTML files...\n');

  const appsDir = join(projectRoot, 'apps');
  const htmlFiles = findHTMLFiles(appsDir);

  console.log(`Found ${htmlFiles.length} HTML files to validate\n`);

  const allIssues: ValidationIssue[] = [];
  let totalSchemas = 0;

  htmlFiles.forEach(file => {
    try {
      const issues = auditFile(file);
      allIssues.push(...issues);

      const content = readFileSync(file, 'utf-8');
      const schemas = extractStructuredData(content);
      totalSchemas += schemas.length;
    } catch (error) {
      console.warn(`Warning: Could not process ${file}: ${error}`);
    }
  });

  // Report results
  console.log(
    `Found ${totalSchemas} structured data schema(s) across ${htmlFiles.length} file(s)\n`
  );

  if (allIssues.length === 0) {
    console.log('✅ All structured data is valid!\n');
    return;
  }

  console.log(`⚠️  Found ${allIssues.length} issue(s):\n`);

  // Group by file
  const issuesByFile = new Map<string, ValidationIssue[]>();
  allIssues.forEach(issue => {
    const fileIssues = issuesByFile.get(issue.file) || [];
    fileIssues.push(issue);
    issuesByFile.set(issue.file, fileIssues);
  });

  issuesByFile.forEach((issues, file) => {
    console.log(`📄 ${file}:`);
    issues.forEach(issue => {
      console.log(`   Line ${issue.line}: ${issue.issue}`);
      console.log(`   Schema: ${issue.schema}...`);
    });
    console.log('');
  });

  console.log('\n💡 Recommendations:');
  console.log('   - Ensure all required fields are present');
  console.log('   - Validate schemas with Google Rich Results Test');
  console.log('   - Check schema.org documentation for each type\n');

  process.exit(allIssues.length > 0 ? 1 : 0);
}

// Run validation
validateStructuredData();

export { validateStructuredData };
