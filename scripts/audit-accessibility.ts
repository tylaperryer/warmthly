/**
 * Accessibility Auditor
 * Comprehensive accessibility audit including ARIA labels, landmarks, form labels, and semantic HTML
 * 
 * Usage: npm run audit:accessibility
 */

// @ts-expect-error - Node.js module
import { readFileSync, readdirSync, statSync } from 'fs';
// @ts-expect-error - Node.js module
import { join, extname } from 'path';
// @ts-expect-error - Node.js module
import { fileURLToPath } from 'url';
// @ts-expect-error - Node.js module
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface AccessibilityIssue {
  file: string;
  line: number;
  type: 'error' | 'warning' | 'info';
  issue: string;
  element: string;
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
 * Audit HTML file for accessibility issues
 */
function auditFile(filePath: string): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = filePath.replace(projectRoot, '').replace(/\\/g, '/');

  lines.forEach((line, index) => {
    // 1. Check for buttons without aria-label or text content
    const buttonRegex = /<button[^>]*>/gi;
    let match;
    while ((match = buttonRegex.exec(line)) !== null) {
      const buttonTag = match[0];
      const hasAriaLabel = /aria-label\s*=/i.test(buttonTag);
      const hasAriaLabelledBy = /aria-labelledby\s*=/i.test(buttonTag);
      const hasText = /<button[^>]*>[\s\S]*?[^<]+[\s\S]*?<\/button>/i.test(content);
      const hasTitle = /title\s*=/i.test(buttonTag);
      
      // Icon-only buttons need aria-label
      if (!hasAriaLabel && !hasAriaLabelledBy && !hasTitle) {
        // Check if it's likely an icon-only button
        const isIconOnly = /<button[^>]*>[\s\S]*?<[^>]+>[\s\S]*?<\/button>/i.test(line) && 
                          !/<button[^>]*>[^<]+[^>]+<\/button>/i.test(line);
        
        if (isIconOnly) {
          issues.push({
            file: relativePath,
            line: index + 1,
            type: 'error',
            issue: 'Icon-only button missing aria-label',
            element: buttonTag.substring(0, 100),
            recommendation: 'Add aria-label="descriptive text" to icon-only buttons',
          });
        }
      }
    }

    // 2. Check for links without accessible text
    const linkRegex = /<a[^>]*>/gi;
    while ((match = linkRegex.exec(line)) !== null) {
      const linkTag = match[0];
      const hasAriaLabel = /aria-label\s*=/i.test(linkTag);
      const hasText = /<a[^>]*>[\s\S]*?[^<]+[\s\S]*?<\/a>/i.test(content);
      const hasTitle = /title\s*=/i.test(linkTag);
      const hasImg = /<img[^>]*alt\s*=/i.test(line);
      
      // Links with only images need aria-label or image alt text
      if (!hasAriaLabel && !hasTitle && hasImg) {
        const imgAltMatch = line.match(/<img[^>]*alt\s*=\s*["']([^"']*)["']/i);
        if (!imgAltMatch || !imgAltMatch[1]) {
          issues.push({
            file: relativePath,
            line: index + 1,
            type: 'error',
            issue: 'Link with image missing accessible text',
            element: linkTag.substring(0, 100),
            recommendation: 'Add aria-label or ensure image has descriptive alt text',
          });
        }
      }
    }

    // 3. Check for form inputs without labels
    const inputRegex = /<input[^>]*>/gi;
    while ((match = inputRegex.exec(line)) !== null) {
      const inputTag = match[0];
      const inputType = inputTag.match(/type\s*=\s*["']([^"']*)["']/i)?.[1] || 'text';
      const hasId = /id\s*=\s*["']([^"']+)["']/i.test(inputTag);
      const hasAriaLabel = /aria-label\s*=/i.test(inputTag);
      const hasAriaLabelledBy = /aria-labelledby\s*=/i.test(inputTag);
      const hasPlaceholder = /placeholder\s*=/i.test(inputTag);
      
      // Skip hidden inputs
      if (inputType === 'hidden') continue;
      
      // Check if label exists (look in surrounding context)
      const context = lines.slice(Math.max(0, index - 5), index + 5).join('\n');
      const hasLabel = /<label[^>]*for\s*=\s*["']([^"']+)["']/i.test(context) && hasId;
      const hasWrappedLabel = /<label[^>]*>[\s\S]*?<input/i.test(context);
      
      if (!hasLabel && !hasWrappedLabel && !hasAriaLabel && !hasAriaLabelledBy && inputType !== 'submit' && inputType !== 'button') {
        // Placeholder is not sufficient for accessibility
        if (!hasPlaceholder || hasPlaceholder) {
          issues.push({
            file: relativePath,
            line: index + 1,
            type: 'error',
            issue: `Input field missing label (type: ${inputType})`,
            element: inputTag.substring(0, 100),
            recommendation: 'Add <label> element with for attribute matching input id, or use aria-label',
          });
        }
      }
    }

    // 4. Check for missing ARIA landmarks
    // This is more of an info check - we'll note if main landmarks are missing
    if (index === 0) {
      const hasMain = /<main[^>]*>/i.test(content);
      const hasNav = /<nav[^>]*>/i.test(content);
      const hasHeader = /<header[^>]*>/i.test(content);
      const hasFooter = /<footer[^>]*>/i.test(content);
      
      if (!hasMain) {
        issues.push({
          file: relativePath,
          line: 1,
          type: 'warning',
          issue: 'Missing <main> landmark',
          element: 'Page structure',
          recommendation: 'Add <main> element to identify main content area',
        });
      }
    }

    // 5. Check for images in buttons/links without alt text (covered by alt-text audit, but good to note)
    const imgInButton = /<button[^>]*>[\s\S]*?<img[^>]*>/i.test(line);
    if (imgInButton) {
      const imgMatch = line.match(/<img[^>]*>/i);
      if (imgMatch) {
        const imgTag = imgMatch[0];
        const hasAlt = /alt\s*=/i.test(imgTag);
        if (!hasAlt) {
          issues.push({
            file: relativePath,
            line: index + 1,
            type: 'error',
            issue: 'Image in button missing alt text',
            element: imgTag.substring(0, 100),
            recommendation: 'Add alt="" for decorative images or descriptive alt for meaningful images',
          });
        }
      }
    }

    // 6. Check for missing heading hierarchy
    const headingRegex = /<h([1-6])[^>]*>/gi;
    const headings: number[] = [];
    while ((match = headingRegex.exec(content)) !== null) {
      const level = parseInt(match[1], 10);
      headings.push(level);
    }
    
    if (index === 0 && headings.length > 0) {
      // Check for skipped heading levels
      for (let i = 0; i < headings.length - 1; i++) {
        if (headings[i + 1] - headings[i] > 1) {
          issues.push({
            file: relativePath,
            line: 1,
            type: 'warning',
            issue: `Skipped heading level: h${headings[i]} to h${headings[i + 1]}`,
            element: 'Heading structure',
            recommendation: 'Maintain proper heading hierarchy (h1 -> h2 -> h3, etc.)',
          });
          break;
        }
      }
      
      // Check if h1 exists
      if (!headings.includes(1)) {
        issues.push({
          file: relativePath,
          line: 1,
          type: 'warning',
          issue: 'Missing h1 heading',
          element: 'Heading structure',
          recommendation: 'Add a single h1 heading to identify the main page topic',
        });
      }
    }

    // 7. Check for interactive elements without keyboard access
    const interactiveElements = /<(button|a|input|select|textarea)[^>]*tabindex\s*=\s*["']-1["']/gi;
    while ((match = interactiveElements.exec(line)) !== null) {
      const element = match[0];
      const hasAriaHidden = /aria-hidden\s*=\s*["']true["']/i.test(element);
      
      if (!hasAriaHidden) {
        issues.push({
          file: relativePath,
          line: index + 1,
          type: 'warning',
          issue: 'Interactive element with tabindex="-1" but not aria-hidden',
          element: element.substring(0, 100),
          recommendation: 'If element should be hidden from screen readers, add aria-hidden="true"',
        });
      }
    }

    // 8. Check for missing lang attribute on html tag
    if (line.includes('<html')) {
      const hasLang = /lang\s*=\s*["']([^"']+)["']/i.test(line);
      if (!hasLang) {
        issues.push({
          file: relativePath,
          line: index + 1,
          type: 'error',
          issue: 'Missing lang attribute on <html> tag',
          element: line.substring(0, 100),
          recommendation: 'Add lang="en" (or appropriate language) to <html> tag',
        });
      }
    }
  });

  return issues;
}

/**
 * Main audit function
 */
function auditAccessibility(): void {
  console.log('🔍 Auditing accessibility across all HTML files...\n');

  const appsDir = join(projectRoot, 'apps');
  const htmlFiles = findHTMLFiles(appsDir);

  console.log(`Found ${htmlFiles.length} HTML files to audit\n`);

  const allIssues: AccessibilityIssue[] = [];

  htmlFiles.forEach((file) => {
    const issues = auditFile(file);
    allIssues.push(...issues);
  });

  // Separate by type
  const errors = allIssues.filter(i => i.type === 'error');
  const warnings = allIssues.filter(i => i.type === 'warning');
  const infos = allIssues.filter(i => i.type === 'info');

  // Report results
  if (allIssues.length === 0) {
    console.log('✅ No accessibility issues found!\n');
    return;
  }

  console.log(`📊 Accessibility Audit Results:\n`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}`);
  console.log(`   Info: ${infos.length}\n`);

  if (errors.length > 0) {
    console.log(`❌ Errors (${errors.length}):\n`);
    const errorsByFile = new Map<string, AccessibilityIssue[]>();
    errors.forEach((issue) => {
      const fileIssues = errorsByFile.get(issue.file) || [];
      fileIssues.push(issue);
      errorsByFile.set(issue.file, fileIssues);
    });

    errorsByFile.forEach((fileErrors, file) => {
      console.log(`📄 ${file}:`);
      fileErrors.forEach((issue) => {
        console.log(`   Line ${issue.line}: ${issue.issue}`);
        console.log(`   ${issue.recommendation}`);
        console.log(`   Element: ${issue.element}`);
        console.log('');
      });
    });
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${warnings.length}):\n`);
    const warningsByFile = new Map<string, AccessibilityIssue[]>();
    warnings.forEach((issue) => {
      const fileIssues = warningsByFile.get(issue.file) || [];
      fileIssues.push(issue);
      warningsByFile.set(issue.file, fileIssues);
    });

    warningsByFile.forEach((fileWarnings, file) => {
      console.log(`📄 ${file}:`);
      fileWarnings.forEach((issue) => {
        console.log(`   Line ${issue.line}: ${issue.issue}`);
        console.log(`   ${issue.recommendation}`);
        console.log('');
      });
    });
  }

  console.log('\n💡 Recommendations:');
  console.log('   - Ensure all interactive elements have accessible names');
  console.log('   - Use semantic HTML elements (main, nav, header, footer)');
  console.log('   - Maintain proper heading hierarchy');
  console.log('   - Add labels to all form inputs');
  console.log('   - Use ARIA attributes when semantic HTML is insufficient\n');

  process.exit(errors.length > 0 ? 1 : 0);
}

// Run audit
auditAccessibility();

export { auditAccessibility };

