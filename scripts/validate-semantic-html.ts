/**
 * Semantic HTML Validator
 * Validates semantic HTML structure and accessibility
 *
 * Usage: npm run validate:semantic-html
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface SemanticIssue {
  file: string;
  line: number;
  type: 'error' | 'warning';
  issue: string;
  recommendation: string;
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
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== 'build') {
        findHTMLFiles(filePath, fileList);
      }
    } else if (extname(file) === '.html') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Validate semantic HTML structure
 */
function validateSemanticHTML(filePath: string): SemanticIssue[] {
  const issues: SemanticIssue[] = [];
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = filePath.replace(projectRoot, '').replace(/\\/g, '/');

  // Required semantic elements
  const hasMain = /<main[^>]*>/i.test(content);

  // Check for semantic structure
  if (!hasMain) {
    issues.push({
      file: relativePath,
      line: 1,
      type: 'error',
      issue: 'Missing <main> element',
      recommendation: 'Add <main> element to identify the main content area',
    });
  }

  // Check for proper heading hierarchy
  const headings: Array<{ level: number; line: number }> = [];

  lines.forEach((line, index) => {
    const hMatch = line.match(/<h([1-6])[^>]*>/i);
    if (hMatch) {
      headings.push({ level: parseInt(hMatch[1], 10), line: index + 1 });
    }
  });

  // Check heading hierarchy
  if (headings.length > 0) {
    // Must have h1
    const hasH1 = headings.some(h => h.level === 1);
    if (!hasH1) {
      issues.push({
        file: relativePath,
        line: 1,
        type: 'error',
        issue: 'Missing h1 heading',
        recommendation: 'Add a single h1 heading to identify the main page topic',
      });
    }

    // Check for skipped levels
    for (let i = 0; i < headings.length - 1; i++) {
      if (headings[i + 1].level - headings[i].level > 1) {
        issues.push({
          file: relativePath,
          line: headings[i + 1].line,
          type: 'warning',
          issue: `Skipped heading level: h${headings[i].level} to h${headings[i + 1].level}`,
          recommendation: 'Maintain proper heading hierarchy (h1 -> h2 -> h3, etc.)',
        });
      }
    }
  }

  // Check for proper list usage
  const listItemsWithoutList = content.match(/<li[^>]*>(?![\s\S]*?<\/ul>|[\s\S]*?<\/ol>)/gi);
  if (listItemsWithoutList) {
    issues.push({
      file: relativePath,
      line: 1,
      type: 'error',
      issue: 'List items found outside of <ul> or <ol>',
      recommendation: 'Wrap <li> elements in <ul> or <ol>',
    });
  }

  // Check for proper form structure
  const hasInputs = /<input[^>]*>/i.test(content);
  const hasForm = /<form[^>]*>/i.test(content);
  if (hasInputs && !hasForm) {
    // This might be intentional for some cases, so it's a warning
    issues.push({
      file: relativePath,
      line: 1,
      type: 'warning',
      issue: 'Input elements found without <form> wrapper',
      recommendation: 'Consider wrapping inputs in <form> for better semantic structure',
    });
  }

  // Check for proper table structure
  const hasTable = /<table[^>]*>/i.test(content);
  if (hasTable) {
    const hasThead = /<thead[^>]*>/i.test(content);
    const hasCaption = /<caption[^>]*>/i.test(content);

    if (!hasThead) {
      issues.push({
        file: relativePath,
        line: 1,
        type: 'warning',
        issue: 'Table missing <thead> element',
        recommendation: 'Add <thead> for table header rows',
      });
    }

    if (!hasCaption) {
      issues.push({
        file: relativePath,
        line: 1,
        type: 'warning',
        issue: 'Table missing <caption> element',
        recommendation: 'Consider adding <caption> to describe the table',
      });
    }
  }

  // Check for lang attribute on html tag
  const htmlTagMatch = content.match(/<html[^>]*>/i);
  if (htmlTagMatch) {
    const htmlTag = htmlTagMatch[0];
    if (!/lang\s*=\s*["']([^"']+)["']/i.test(htmlTag)) {
      issues.push({
        file: relativePath,
        line: 1,
        type: 'error',
        issue: 'Missing lang attribute on <html> tag',
        recommendation: 'Add lang="en" (or appropriate language) to <html> tag',
      });
    }
  }

  // Check for proper landmark usage
  const landmarks = {
    main: (content.match(/<main[^>]*>/gi) || []).length,
    nav: (content.match(/<nav[^>]*>/gi) || []).length,
    header: (content.match(/<header[^>]*>/gi) || []).length,
    footer: (content.match(/<footer[^>]*>/gi) || []).length,
    article: (content.match(/<article[^>]*>/gi) || []).length,
    section: (content.match(/<section[^>]*>/gi) || []).length,
    aside: (content.match(/<aside[^>]*>/gi) || []).length,
  };

  // Multiple main elements is an error
  if (landmarks.main > 1) {
    issues.push({
      file: relativePath,
      line: 1,
      type: 'error',
      issue: `Multiple <main> elements found (${landmarks.main})`,
      recommendation: 'Use only one <main> element per page',
    });
  }

  // Check for deprecated elements
  const deprecatedElements = [
    { tag: 'center', replacement: 'CSS text-align' },
    { tag: 'font', replacement: 'CSS font properties' },
    { tag: 'marquee', replacement: 'CSS animations' },
    { tag: 'blink', replacement: 'CSS animations' },
  ];

  deprecatedElements.forEach(({ tag, replacement }) => {
    if (new RegExp(`<${tag}[^>]*>`, 'i').test(content)) {
      issues.push({
        file: relativePath,
        line: 1,
        type: 'error',
        issue: `Deprecated <${tag}> element found`,
        recommendation: `Replace with ${replacement}`,
      });
    }
  });

  return issues;
}

/**
 * Main validation function
 */
function runValidation(): void {
  console.log('🔍 Validating semantic HTML structure...\n');

  const appsDir = join(projectRoot, 'apps');
  const htmlFiles = findHTMLFiles(appsDir);

  console.log(`Found ${htmlFiles.length} HTML files to validate\n`);

  const allIssues: SemanticIssue[] = [];

  htmlFiles.forEach(file => {
    const issues = validateSemanticHTML(file);
    allIssues.push(...issues);
  });

  const errors = allIssues.filter(i => i.type === 'error');
  const warnings = allIssues.filter(i => i.type === 'warning');

  if (allIssues.length === 0) {
    console.log('✅ All HTML files have proper semantic structure!\n');
    return;
  }

  console.log(`⚠️  Found ${allIssues.length} issue(s):\n`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}\n`);

  if (errors.length > 0) {
    console.log('❌ Errors:\n');
    const errorsByFile = new Map<string, SemanticIssue[]>();
    errors.forEach(issue => {
      const fileIssues = errorsByFile.get(issue.file) || [];
      fileIssues.push(issue);
      errorsByFile.set(issue.file, fileIssues);
    });

    errorsByFile.forEach((fileErrors, file) => {
      console.log(`📄 ${file}:`);
      fileErrors.forEach(issue => {
        console.log(`   Line ${issue.line}: ${issue.issue}`);
        console.log(`   ${issue.recommendation}\n`);
      });
    });
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:\n');
    const warningsByFile = new Map<string, SemanticIssue[]>();
    warnings.forEach(issue => {
      const fileIssues = warningsByFile.get(issue.file) || [];
      fileIssues.push(issue);
      warningsByFile.set(issue.file, fileIssues);
    });

    warningsByFile.forEach((fileWarnings, file) => {
      console.log(`📄 ${file}:`);
      fileWarnings.forEach(issue => {
        console.log(`   Line ${issue.line}: ${issue.issue}`);
        console.log(`   ${issue.recommendation}\n`);
      });
    });
  }

  console.log('\n💡 Recommendations:');
  console.log('   - Use semantic HTML5 elements (main, nav, header, footer, article, section)');
  console.log('   - Maintain proper heading hierarchy (h1 -> h2 -> h3)');
  console.log('   - Ensure all pages have lang attribute on <html> tag');
  console.log('   - Use one <main> element per page');
  console.log('   - Wrap list items in <ul> or <ol>\n');

  process.exit(errors.length > 0 ? 1 : 0);
}

// Run validation
runValidation();

export { validateSemanticHTML };
