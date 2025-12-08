/**
 * Link Equity Analyzer
 * Analyzes internal linking structure to identify orphan pages and link distribution
 *
 * Usage: npm run analyze:link-equity
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface PageLinkInfo {
  file: string;
  url: string;
  incomingLinks: number;
  outgoingLinks: number;
  linksTo: string[];
  linkedFrom: string[];
  isOrphan: boolean;
  priority: 'high' | 'medium' | 'low';
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
 * Extract URL from file path
 */
function getUrlFromPath(filePath: string): string {
  const relative = filePath.replace(projectRoot, '').replace(/\\/g, '/');

  // Map app directories to URLs
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

  if (relative.includes('/apps/admin/')) {
    const path = relative.replace('/apps/admin', '');
    if (path === '/index.html' || path === '/') {
      return 'https://admin.warmthly.org/';
    }
    return `https://admin.warmthly.org${path
      .replace('/index.html', '/')
      .replace('.html', '.html')}`;
  }

  return relative;
}

/**
 * Determine page priority
 */
function getPagePriority(filePath: string, url: string): 'high' | 'medium' | 'low' {
  const filename = basename(filePath);

  // High priority pages
  if (filename === 'index.html' || url.includes('warmthly.org/')) {
    return 'high';
  }

  // Medium priority pages
  if (filename.includes('help') || filename.includes('privacy') || filename.includes('about')) {
    return 'medium';
  }

  // Low priority (404, etc.)
  if (filename.includes('404') || filename.includes('error')) {
    return 'low';
  }

  return 'medium';
}

/**
 * Extract internal links from HTML content
 */
function extractInternalLinks(content: string, baseUrl: string): string[] {
  const links: string[] = [];

  // Match href attributes
  const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
  let match;

  while ((match = hrefRegex.exec(content)) !== null) {
    let href = match[1];

    // Skip external links, anchors, and special protocols
    if (href.startsWith('http://') || href.startsWith('https://')) {
      // Check if it's internal
      if (href.includes('warmthly.org')) {
        links.push(href);
      }
      continue;
    }

    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      continue;
    }

    // Convert relative URLs to absolute
    if (href.startsWith('/')) {
      // Extract domain from baseUrl
      const urlObj = new URL(baseUrl);
      href = `${urlObj.protocol}//${urlObj.host}${href}`;
      links.push(href);
    } else if (!href.startsWith('#')) {
      // Relative path
      const urlObj = new URL(baseUrl);
      const basePath = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/'));
      href = `${urlObj.protocol}//${urlObj.host}${basePath}/${href}`;
      links.push(href);
    }
  }

  return links;
}

/**
 * Analyze link equity
 */
function analyzeLinkEquity(): void {
  console.log('🔗 Analyzing link equity and internal linking structure...\n');

  const appsDir = join(projectRoot, 'apps');
  const htmlFiles = findHTMLFiles(appsDir);

  console.log(`Found ${htmlFiles.length} HTML files to analyze\n`);

  // Build page link info
  const pageInfo = new Map<string, PageLinkInfo>();

  // First pass: initialize all pages
  htmlFiles.forEach(file => {
    const url = getUrlFromPath(file);
    const priority = getPagePriority(file, url);

    pageInfo.set(url, {
      file: file.replace(projectRoot, '').replace(/\\/g, '/'),
      url,
      incomingLinks: 0,
      outgoingLinks: 0,
      linksTo: [],
      linkedFrom: [],
      isOrphan: true,
      priority,
    });
  });

  // Second pass: analyze links
  htmlFiles.forEach(file => {
    const content = readFileSync(file, 'utf-8');
    const sourceUrl = getUrlFromPath(file);
    const sourceInfo = pageInfo.get(sourceUrl);

    if (!sourceInfo) return;

    const internalLinks = extractInternalLinks(content, sourceUrl);

    internalLinks.forEach(targetUrl => {
      // Normalize URL
      const normalizedTarget = targetUrl.replace(/\/$/, '') || targetUrl;
      const normalizedSource = sourceUrl.replace(/\/$/, '') || sourceUrl;

      // Skip self-links
      if (normalizedTarget === normalizedSource) return;

      const targetInfo = pageInfo.get(normalizedTarget);

      if (targetInfo) {
        // Add outgoing link
        if (!sourceInfo.linksTo.includes(normalizedTarget)) {
          sourceInfo.linksTo.push(normalizedTarget);
          sourceInfo.outgoingLinks++;
        }

        // Add incoming link
        if (!targetInfo.linkedFrom.includes(normalizedSource)) {
          targetInfo.linkedFrom.push(normalizedSource);
          targetInfo.incomingLinks++;
          targetInfo.isOrphan = false;
        }
      }
    });
  });

  // Mark homepage as not orphan (it's the entry point)
  const homepage = Array.from(pageInfo.values()).find(
    p => p.url.includes('warmthly.org/') && !p.url.includes('/')
  );
  if (homepage) {
    homepage.isOrphan = false;
  }

  // Generate report
  const pages = Array.from(pageInfo.values());
  const orphanPages = pages.filter(p => p.isOrphan && p.priority !== 'low');
  const highPriorityOrphans = orphanPages.filter(p => p.priority === 'high');
  const pagesByIncomingLinks = [...pages].sort((a, b) => b.incomingLinks - a.incomingLinks);
  const pagesByOutgoingLinks = [...pages].sort((a, b) => b.outgoingLinks - a.outgoingLinks);

  console.log('📊 Link Equity Analysis Results:\n');

  // Orphan pages
  if (orphanPages.length > 0) {
    console.log(`⚠️  Orphan Pages (${orphanPages.length}):\n`);
    orphanPages.forEach(page => {
      console.log(`   ${page.url}`);
      console.log(`   File: ${page.file}`);
      console.log(`   Priority: ${page.priority}`);
      console.log(`   Recommendation: Add internal links from other pages\n`);
    });
  } else {
    console.log('✅ No orphan pages found!\n');
  }

  // High priority pages with low incoming links
  const highPriorityLowLinks = pages.filter(
    p => p.priority === 'high' && p.incomingLinks < 2 && !p.isOrphan
  );

  if (highPriorityLowLinks.length > 0) {
    console.log(`📈 High Priority Pages Needing More Links (${highPriorityLowLinks.length}):\n`);
    highPriorityLowLinks.forEach(page => {
      console.log(`   ${page.url}`);
      console.log(`   Incoming links: ${page.incomingLinks}`);
      console.log(`   Recommendation: Add more internal links to this important page\n`);
    });
  }

  // Top linked pages
  console.log(`\n🔝 Top 10 Most Linked Pages:\n`);
  pagesByIncomingLinks.slice(0, 10).forEach((page, index) => {
    console.log(`   ${index + 1}. ${page.url}`);
    console.log(`      Incoming: ${page.incomingLinks} | Outgoing: ${page.outgoingLinks}`);
  });

  // Pages with most outgoing links
  console.log(`\n🔗 Pages with Most Outgoing Links (Top 10):\n`);
  pagesByOutgoingLinks.slice(0, 10).forEach((page, index) => {
    console.log(`   ${index + 1}. ${page.url}`);
    console.log(`      Outgoing: ${page.outgoingLinks} | Incoming: ${page.incomingLinks}`);
  });

  // Link distribution stats
  const avgIncoming = pages.reduce((sum, p) => sum + p.incomingLinks, 0) / pages.length;
  const avgOutgoing = pages.reduce((sum, p) => sum + p.outgoingLinks, 0) / pages.length;

  console.log(`\n📊 Statistics:\n`);
  console.log(`   Total pages: ${pages.length}`);
  console.log(`   Orphan pages: ${orphanPages.length}`);
  console.log(`   High priority orphans: ${highPriorityOrphans.length}`);
  console.log(`   Average incoming links per page: ${avgIncoming.toFixed(1)}`);
  console.log(`   Average outgoing links per page: ${avgOutgoing.toFixed(1)}`);

  console.log(`\n💡 Recommendations:\n`);
  if (orphanPages.length > 0) {
    console.log(`   - Add internal links to ${orphanPages.length} orphan page(s)`);
  }
  if (highPriorityLowLinks.length > 0) {
    console.log(
      `   - Increase internal links to ${highPriorityLowLinks.length} high-priority page(s)`
    );
  }
  console.log(`   - Ensure important pages (homepage, help, etc.) have multiple incoming links`);
  console.log(`   - Create contextual internal links within content\n`);

  process.exit(orphanPages.length > 0 ? 1 : 0);
}

// Run analysis
analyzeLinkEquity();

export { analyzeLinkEquity };
