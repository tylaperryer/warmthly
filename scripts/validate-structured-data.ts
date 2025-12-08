/**
 * Structured Data Validator
 * Validates all JSON-LD structured data on pages
 *
 * Usage: npm run validate:structured-data
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

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
 * Find all HTML files recursively
 */
function findHTMLFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  files.forEach((file: string) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
        findHTMLFiles(filePath, fileList);
      }
    } else if (extname(file) === '.html') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Extract JSON-LD scripts from HTML
 */
function extractStructuredData(html: string): Array<{ json: object; line: number }> {
  const scripts: Array<{ json: object; line: number }> = [];
  const lines = html.split('\n');

  lines.forEach((line, index) => {
    // Match script tags with type="application/ld+json"
    const scriptMatch = line.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/s
    );
    if (scriptMatch) {
      try {
        const json = JSON.parse(scriptMatch[1]);
        scripts.push({ json, line: index + 1 });
      } catch (error) {
        // Invalid JSON - will be caught in validation
      }
    }
  });

  return scripts;
}

/**
 * Validate a single structured data object
 */
function validateSchema(schema: object, line: number, file: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

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
  const content = readFileSync(filePath, 'utf-8');
  const structuredData = extractStructuredData(content);

  structuredData.forEach(({ json, line }) => {
    const fileIssues = validateSchema(json, line, filePath.replace(projectRoot, ''));
    issues.push(...fileIssues);
  });

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
    const issues = auditFile(file);
    allIssues.push(...issues);

    const content = readFileSync(file, 'utf-8');
    const schemas = extractStructuredData(content);
    totalSchemas += schemas.length;
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
