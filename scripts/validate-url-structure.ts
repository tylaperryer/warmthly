/**
 * URL Structure Validator
 * Validates URL structure for SEO best practices
 * 
 * Usage: npm run validate:url-structure
 */

// @ts-expect-error - Node.js module
import { readdirSync, statSync } from 'fs';
// @ts-expect-error - Node.js module
import { join, extname, basename } from 'path';
// @ts-expect-error - Node.js module
import { fileURLToPath } from 'url';
// @ts-expect-error - Node.js module
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface URLIssue {
  file: string;
  url: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
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
 * Get URL from file path
 */
function getUrlFromPath(filePath: string): string {
  const relative = filePath.replace(projectRoot, '').replace(/\\/g, '/');
  
  if (relative.includes('/apps/main/')) {
    const path = relative.replace('/apps/main', '');
    if (path === '/index.html' || path === '/') {
      return 'https://www.warmthly.org/';
    }
    return `https://www.warmthly.org${path.replace('/index.html', '/').replace('.html', '.html')}`;
  }
  
  if (relative.includes('/apps/mint/')) {
    const path = relative.replace('/apps/mint', '');
    if (path === '/index.html' || path === '/') {
      return 'https://mint.warmthly.org/';
    }
    return `https://mint.warmthly.org${path.replace('/index.html', '/').replace('.html', '.html')}`;
  }
  
  if (relative.includes('/apps/post/')) {
    const path = relative.replace('/apps/post', '');
    if (path === '/index.html' || path === '/') {
      return 'https://post.warmthly.org/';
    }
    return `https://post.warmthly.org${path.replace('/index.html', '/').replace('.html', '.html')}`;
  }
  
  return relative;
}

/**
 * Validate URL structure
 */
function validateURLStructure(): void {
  console.log('🔍 Validating URL structure...\n');

  const appsDir = join(projectRoot, 'apps');
  const htmlFiles = findHTMLFiles(appsDir);

  console.log(`Found ${htmlFiles.length} HTML files to validate\n`);

  const issues: URLIssue[] = [];

  htmlFiles.forEach((file) => {
    const relativePath = file.replace(projectRoot, '').replace(/\\/g, '/');
    const url = getUrlFromPath(file);
    const filename = basename(file, '.html');
    const pathParts = relativePath.split('/').filter(p => p && p !== 'apps');

    // Check URL length
    if (url.length > 100) {
      issues.push({
        file: relativePath,
        url,
        issue: `URL too long (${url.length} characters)`,
        severity: 'warning',
        recommendation: 'Keep URLs under 100 characters for better SEO',
      });
    }

    // Check for uppercase letters
    if (url !== url.toLowerCase()) {
      issues.push({
        file: relativePath,
        url,
        issue: 'URL contains uppercase letters',
        severity: 'warning',
        recommendation: 'Use lowercase URLs for consistency',
      });
    }

    // Check for special characters
    if (/[^a-z0-9\-_\/\.]/.test(url.toLowerCase())) {
      issues.push({
        file: relativePath,
        url,
        issue: 'URL contains special characters',
        severity: 'info',
        recommendation: 'Use hyphens instead of underscores or special characters',
      });
    }

    // Check for underscores (prefer hyphens)
    if (url.includes('_')) {
      issues.push({
        file: relativePath,
        url,
        issue: 'URL contains underscores',
        severity: 'info',
        recommendation: 'Use hyphens (-) instead of underscores (_) for better SEO',
      });
    }

    // Check for multiple slashes
    if (url.includes('//') && !url.includes('https://') && !url.includes('http://')) {
      issues.push({
        file: relativePath,
        url,
        issue: 'URL contains multiple consecutive slashes',
        severity: 'error',
        recommendation: 'Remove duplicate slashes',
      });
    }

    // Check for trailing slashes (inconsistency)
    const hasTrailingSlash = url.endsWith('/');
    const isHomepage = filename === 'index' || pathParts.length <= 2;
    
    if (isHomepage && !hasTrailingSlash && url !== 'https://www.warmthly.org/') {
      // Homepages should have trailing slash
      issues.push({
        file: relativePath,
        url,
        issue: 'Homepage URL missing trailing slash',
        severity: 'info',
        recommendation: 'Consider using trailing slash for consistency',
      });
    }

    // Check for file extensions in URL (prefer clean URLs)
    if (url.includes('.html') && !isHomepage) {
      issues.push({
        file: relativePath,
        url,
        issue: 'URL contains .html extension',
        severity: 'info',
        recommendation: 'Consider removing .html extension for cleaner URLs (if server supports)',
      });
    }

    // Check for deep nesting
    const depth = pathParts.length - 1; // Subtract app name
    if (depth > 3) {
      issues.push({
        file: relativePath,
        url,
        issue: `URL is deeply nested (${depth} levels)`,
        severity: 'warning',
        recommendation: 'Keep URL depth under 3 levels for better SEO',
      });
    }

    // Check for query parameters in filename
    if (filename.includes('?') || filename.includes('&')) {
      issues.push({
        file: relativePath,
        url,
        issue: 'Filename contains query parameters',
        severity: 'error',
        recommendation: 'Remove query parameters from filenames',
      });
    }

    // Check for spaces
    if (filename.includes(' ') || url.includes('%20')) {
      issues.push({
        file: relativePath,
        url,
        issue: 'URL contains spaces',
        severity: 'error',
        recommendation: 'Replace spaces with hyphens',
      });
    }
  });

  // Report results
  if (issues.length === 0) {
    console.log('✅ All URLs follow SEO best practices!\n');
    return;
  }

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');

  console.log(`⚠️  Found ${issues.length} URL structure issue(s):\n`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}`);
  console.log(`   Info: ${infos.length}\n`);

  if (errors.length > 0) {
    console.log('❌ Errors:\n');
    errors.forEach((issue) => {
      console.log(`   ${issue.file}`);
      console.log(`   URL: ${issue.url}`);
      console.log(`   Issue: ${issue.issue}`);
      console.log(`   ${issue.recommendation}\n`);
    });
  }

  if (warnings.length > 0) {
    console.log('⚠️  Warnings:\n');
    warnings.forEach((issue) => {
      console.log(`   ${issue.file}`);
      console.log(`   URL: ${issue.url}`);
      console.log(`   Issue: ${issue.issue}`);
      console.log(`   ${issue.recommendation}\n`);
    });
  }

  if (infos.length > 0 && infos.length <= 10) {
    console.log('ℹ️  Info:\n');
    infos.slice(0, 10).forEach((issue) => {
      console.log(`   ${issue.file}: ${issue.issue}`);
    });
    if (infos.length > 10) {
      console.log(`   ... and ${infos.length - 10} more info items\n`);
    }
  }

  console.log('\n💡 SEO URL Best Practices:');
  console.log('   - Use lowercase letters');
  console.log('   - Use hyphens to separate words');
  console.log('   - Keep URLs short and descriptive');
  console.log('   - Avoid special characters');
  console.log('   - Limit nesting depth');
  console.log('   - Be consistent with trailing slashes\n');

  process.exit(errors.length > 0 ? 1 : 0);
}

// Run validation
validateURLStructure();

export { validateURLStructure };

