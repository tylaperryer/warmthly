/**
 * Broken Link Detector
 * Detects broken internal and external links across all HTML files
 *
 * Usage: npm run detect:broken-links
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * Validate file path to prevent path traversal attacks
 * Phase 4 Issue 4.2: Add input validation for file paths
 */
function validatePath(filePath: string): boolean {
  const resolvedPath = resolve(filePath);
  const resolvedRoot = resolve(projectRoot);
  return resolvedPath.startsWith(resolvedRoot);
}

/**
 * Validate URL scheme to prevent protocol-based attacks
 * Only allows http: and https: protocols
 */
function isValidUrlScheme(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Whitelist allowed schemes only
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    // Invalid URL format
    return false;
  }
}

interface BrokenLink {
  file: string;
  line: number;
  url: string;
  type: 'internal' | 'external';
  issue: string;
  context: string;
}

/**
 * Find all HTML files recursively
 * Phase 4 Issue 4.2: Add path validation
 */
function findHTMLFiles(dir: string, fileList: string[] = []): string[] {
  // Validate directory path
  if (!validatePath(dir)) {
    throw new Error(`Invalid directory path: ${dir}`);
  }

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
 * Extract all links from HTML content
 */
function extractLinks(content: string): Array<{ url: string; line: number; context: string }> {
  const links: Array<{ url: string; line: number; context: string }> = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Match href attributes
    const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
    let match;

    while ((match = hrefRegex.exec(line)) !== null) {
      const url = match[1];
      if (!url) continue;

      // Skip anchors, mailto, tel, javascript, data URIs
      // Use case-insensitive check to prevent bypasses
      const normalizedUrl = url.trim().toLowerCase();
      if (
        normalizedUrl.startsWith('#') ||
        normalizedUrl.startsWith('mailto:') ||
        normalizedUrl.startsWith('tel:') ||
        normalizedUrl.startsWith('javascript:') ||
        normalizedUrl.startsWith('data:') ||
        normalizedUrl.startsWith('vbscript:') ||
        normalizedUrl.startsWith('file:')
      ) {
        continue;
      }

      links.push({
        url: url,
        line: index + 1,
        context: line.trim().substring(0, 100),
      });
    }
  });

  return links;
}

/**
 * Check if internal file exists
 */
function checkInternalFile(url: string, basePath: string): boolean {
  try {
    // Remove query params and hash
    const cleanUrl = url.split('?')[0]?.split('#')[0];
    if (!cleanUrl) {
      return false;
    }

    // Convert URL to file path
    let filePath: string = cleanUrl;

    // Handle absolute URLs - validate scheme first
    try {
      const urlObj = new URL(cleanUrl);
      // Validate scheme (only http/https allowed)
      if (!isValidUrlScheme(cleanUrl)) {
        return false; // Invalid scheme
      }
      // SECURITY: Validate hostname properly instead of substring matching
      const hostname = urlObj.hostname.toLowerCase();
      const isWarmthlyDomain =
        hostname === 'warmthly.org' ||
        hostname === 'www.warmthly.org' ||
        (hostname.endsWith('.warmthly.org') && hostname.split('.').length === 3);
      if (isWarmthlyDomain) {
        // Internal URL - extract path
        filePath = urlObj.pathname;
      } else {
        // External URL, skip
        return true; // Assume external URLs are valid
      }
    } catch {
      // Not a valid URL, treat as relative path
      // Continue with filePath = cleanUrl
    }

    // Validate path to prevent traversal
    if (!validatePath(basePath)) {
      return false;
    }

    // Handle relative paths
    if (filePath && filePath.startsWith('/')) {
      // Remove leading slash and map to apps directory
      const pathWithoutSlash = filePath.substring(1);

      // Validate path doesn't contain traversal sequences
      if (pathWithoutSlash.includes('..') || pathWithoutSlash.includes('~')) {
        return false;
      }

      // Try different app directories
      const apps = ['main', 'mint', 'post', 'admin'];
      for (const app of apps) {
        const fullPath = join(projectRoot, 'apps', app, pathWithoutSlash);

        // Validate resolved path is still within project
        if (!validatePath(fullPath)) {
          continue;
        }

        try {
          const stat = statSync(fullPath);
          if (stat.isFile() || stat.isDirectory()) {
            return true;
          }
        } catch {
          // File doesn't exist, try alternatives
        }

        // Try with .html extension
        const htmlPath = join(projectRoot, 'apps', app, pathWithoutSlash + '.html');
        if (validatePath(htmlPath)) {
          try {
            if (statSync(htmlPath).isFile()) {
              return true;
            }
          } catch {
            // File doesn't exist
          }
        }

        // Try index.html
        const indexPath = join(projectRoot, 'apps', app, pathWithoutSlash, 'index.html');
        if (validatePath(indexPath)) {
          try {
            if (statSync(indexPath).isFile()) {
              return true;
            }
          } catch {
            // File doesn't exist
          }
        }
      }

      // Check if it's a root file
      const rootPath = join(projectRoot, pathWithoutSlash);
      if (validatePath(rootPath)) {
        try {
          const stat = statSync(rootPath);
          if (stat.isFile() || stat.isDirectory()) {
            return true;
          }
        } catch {
          // File doesn't exist
        }
      }

      return false;
    } else if (filePath) {
      // Relative path from current file
      const dir = dirname(basePath);
      const fullPath = join(dir, filePath);

      // Validate path
      if (!validatePath(fullPath)) {
        return false;
      }

      // Validate path doesn't contain traversal
      if (filePath.includes('..') || filePath.includes('~')) {
        return false;
      }

      try {
        const stat = statSync(fullPath);
        if (stat.isFile() || stat.isDirectory()) {
          return true;
        }
      } catch {
        // File doesn't exist
      }
      return false;
    } else {
      // No valid filePath
      return false;
    }
  } catch (error) {
    // Log error for debugging but don't fail the check
    console.warn(
      `Warning: Error checking file ${url}: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

/**
 * Check external URL (basic validation)
 */
async function checkExternalUrl(
  url: string
): Promise<{ valid: boolean; status?: number; error?: string }> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    return {
      valid: response.ok,
      status: response.status,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Detect broken links
 */
async function detectBrokenLinks(): Promise<void> {
  console.log('🔍 Detecting broken links...\n');

  const appsDir = join(projectRoot, 'apps');
  const htmlFiles = findHTMLFiles(appsDir);

  console.log(`Found ${htmlFiles.length} HTML files to check\n`);

  const brokenLinks: BrokenLink[] = [];
  const externalLinks: Array<{ url: string; file: string; line: number }> = [];

  // First pass: Check internal links
  htmlFiles.forEach(file => {
    const content = readFileSync(file, 'utf-8');
    const relativePath = file.replace(projectRoot, '').replace(/\\/g, '/');
    const links = extractLinks(content);

    links.forEach(link => {
      // Use case-insensitive check to prevent bypasses
      const normalizedUrl = link.url.trim().toLowerCase();
      const isExternal =
        normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://');

      if (isExternal) {
        // External links - check later
        // SECURITY: Validate URL properly instead of substring matching
        let isWarmthlyDomain = false;
        try {
          const urlObj = new URL(link.url);
          const hostname = urlObj.hostname.toLowerCase();
          isWarmthlyDomain =
            hostname === 'warmthly.org' ||
            hostname === 'www.warmthly.org' ||
            (hostname.endsWith('.warmthly.org') && hostname.split('.').length === 3);
        } catch {
          // Invalid URL, skip
        }
        if (isWarmthlyDomain) {
          // Internal URL but external format
          if (!checkInternalFile(link.url, file)) {
            brokenLinks.push({
              file: relativePath,
              line: link.line,
              url: link.url,
              type: 'internal',
              issue: 'Internal URL points to non-existent page',
              context: link.context,
            });
          }
        } else {
          // External URL - queue for checking
          externalLinks.push({
            url: link.url,
            file: relativePath,
            line: link.line,
          });
        }
      } else {
        // Internal relative link
        if (!checkInternalFile(link.url, file)) {
          brokenLinks.push({
            file: relativePath,
            line: link.line,
            url: link.url,
            type: 'internal',
            issue: 'Link points to non-existent file or page',
            context: link.context,
          });
        }
      }
    });
  });

  // Second pass: Check external links (limited to avoid rate limiting)
  console.log(
    `Checking ${Math.min(
      externalLinks.length,
      20
    )} external links (limited to 20 for performance)...\n`
  );

  for (let i = 0; i < Math.min(externalLinks.length, 20); i++) {
    const link = externalLinks[i];
    if (!link) continue;

    const result = await checkExternalUrl(link.url);

    if (!result.valid) {
      brokenLinks.push({
        file: link.file,
        line: link.line,
        url: link.url,
        type: 'external',
        issue: result.error || `HTTP ${result.status}`,
        context: '',
      });
    }

    // Rate limiting
    if (i < externalLinks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Report results
  if (brokenLinks.length === 0) {
    console.log('✅ No broken links found!\n');
    return;
  }

  console.log(`⚠️  Found ${brokenLinks.length} broken link(s):\n`);

  // Group by file
  const linksByFile = new Map<string, BrokenLink[]>();
  brokenLinks.forEach(link => {
    const fileLinks = linksByFile.get(link.file) || [];
    fileLinks.push(link);
    linksByFile.set(link.file, fileLinks);
  });

  linksByFile.forEach((fileLinks, file) => {
    console.log(`📄 ${file}:`);
    fileLinks.forEach(link => {
      console.log(`   Line ${link.line}: ${link.type === 'internal' ? '🔗' : '🌐'} ${link.url}`);
      console.log(`   Issue: ${link.issue}`);
      console.log(`   Context: ${link.context}`);
      console.log('');
    });
  });

  console.log('\n💡 Recommendations:');
  console.log('   - Fix or remove broken internal links');
  console.log('   - Update external links that are no longer valid');
  console.log('   - Use relative paths for internal links when possible');
  console.log('   - Test links regularly to catch issues early\n');

  process.exit(brokenLinks.length > 0 ? 1 : 0);
}

// Run detection
detectBrokenLinks().catch(error => {
  console.error('❌ Error detecting broken links:', error);
  process.exit(1);
});

export { detectBrokenLinks };
