/**
 * Image Alt Text Auditor
 * Audits all HTML files for missing or empty alt text attributes
 *
 * Usage: npm run audit:alt-text
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface ImageIssue {
  file: string;
  line: number;
  issue: string;
  element: string;
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
      // Skip node_modules and dist
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
 * Check if image is decorative (should have empty alt)
 */
function isDecorative(imgTag: string): boolean {
  // Check for common decorative patterns
  const decorativePatterns = [
    /decoration/i,
    /decorative/i,
    /spacer/i,
    /divider/i,
    /bullet/i,
    /icon-only/i,
    /aria-hidden/i,
  ];

  return decorativePatterns.some(pattern => pattern.test(imgTag));
}

/**
 * Audit HTML file for image alt text issues
 */
function auditFile(filePath: string): ImageIssue[] {
  const issues: ImageIssue[] = [];
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Match img tags
  const imgRegex = /<img[^>]*>/gi;
  // Match SVG elements that might need aria-label
  const svgRegex = /<svg[^>]*>/gi;

  lines.forEach((line, index) => {
    // Check img tags
    let match;
    while ((match = imgRegex.exec(line)) !== null) {
      const imgTag = match[0];
      const hasAlt = /alt\s*=/i.test(imgTag);
      const altMatch = imgTag.match(/alt\s*=\s*["']([^"']*)["']/i);
      const altValue = altMatch ? altMatch[1] : '';

      if (!hasAlt) {
        issues.push({
          file: filePath.replace(projectRoot, ''),
          line: index + 1,
          issue: 'Missing alt attribute',
          element: imgTag.substring(0, 100),
        });
      } else if (altValue === '' && !isDecorative(imgTag)) {
        // Empty alt is OK for decorative images, but check if it's actually decorative
        const hasAriaHidden = /aria-hidden\s*=\s*["']true["']/i.test(imgTag);
        const hasRole = /role\s*=\s*["']presentation["']/i.test(imgTag);

        if (!hasAriaHidden && !hasRole) {
          issues.push({
            file: filePath.replace(projectRoot, ''),
            line: index + 1,
            issue:
              'Empty alt text - add alt="" for decorative images or descriptive alt for meaningful images',
            element: imgTag.substring(0, 100),
          });
        }
      } else if (altValue && altValue.length < 3) {
        issues.push({
          file: filePath.replace(projectRoot, ''),
          line: index + 1,
          issue: 'Alt text too short (less than 3 characters)',
          element: imgTag.substring(0, 100),
        });
      } else if (altValue && /^(image|img|photo|picture|graphic)$/i.test(altValue.trim())) {
        issues.push({
          file: filePath.replace(projectRoot, ''),
          line: index + 1,
          issue: 'Generic alt text - use descriptive text instead',
          element: imgTag.substring(0, 100),
        });
      }
    }

    // Check SVG elements
    while ((match = svgRegex.exec(line)) !== null) {
      const svgTag = match[0];
      const hasAriaLabel = /aria-label\s*=/i.test(svgTag);
      const hasTitle = /<title>/i.test(line) || /title\s*=/i.test(svgTag);
      const hasAriaHidden = /aria-hidden\s*=\s*["']true["']/i.test(svgTag);
      const hasRole = /role\s*=\s*["']img["']/i.test(svgTag);

      // SVG should have aria-label or title, or be marked as decorative
      if (!hasAriaLabel && !hasTitle && !hasAriaHidden && !hasRole) {
        // Check if it's in a context where it might be decorative
        const context = lines.slice(Math.max(0, index - 2), index + 3).join(' ');
        if (!/decorative|decoration|spacer/i.test(context)) {
          issues.push({
            file: filePath.replace(projectRoot, ''),
            line: index + 1,
            issue:
              'SVG missing aria-label or title - add aria-label or aria-hidden="true" for decorative SVGs',
            element: svgTag.substring(0, 100),
          });
        }
      }
    }
  });

  return issues;
}

/**
 * Main audit function
 */
function auditAltText(): void {
  console.log('🔍 Auditing image alt text across all HTML files...\n');

  const appsDir = join(projectRoot, 'apps');
  const htmlFiles = findHTMLFiles(appsDir);

  console.log(`Found ${htmlFiles.length} HTML files to audit\n`);

  const allIssues: ImageIssue[] = [];

  htmlFiles.forEach(file => {
    const issues = auditFile(file);
    allIssues.push(...issues);
  });

  // Report results
  if (allIssues.length === 0) {
    console.log('✅ All images have proper alt text!\n');
    return;
  }

  console.log(`⚠️  Found ${allIssues.length} issue(s):\n`);

  // Group by file
  const issuesByFile = new Map<string, ImageIssue[]>();
  allIssues.forEach(issue => {
    const fileIssues = issuesByFile.get(issue.file) || [];
    fileIssues.push(issue);
    issuesByFile.set(issue.file, fileIssues);
  });

  issuesByFile.forEach((issues, file) => {
    console.log(`📄 ${file}:`);
    issues.forEach(issue => {
      console.log(`   Line ${issue.line}: ${issue.issue}`);
      console.log(`   ${issue.element}`);
    });
    console.log('');
  });

  console.log('\n💡 Recommendations:');
  console.log('   - Add descriptive alt text for meaningful images');
  console.log('   - Use alt="" for decorative images');
  console.log('   - Add aria-label for SVG images');
  console.log('   - Use aria-hidden="true" for purely decorative SVGs\n');

  process.exit(allIssues.length > 0 ? 1 : 0);
}

// Run audit
auditAltText();

export { auditAltText };
