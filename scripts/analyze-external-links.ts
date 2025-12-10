/**
 * External Link Analyzer
 * Analyzes external links for SEO best practices (nofollow, quality, etc.)
 *
 * Usage: npm run analyze:external-links
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

import { load } from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface ExternalLink {
  file: string;
  line: number;
  url: string;
  anchorText: string;
  hasNofollow: boolean;
  hasNoopener: boolean;
  hasNoreferrer: boolean;
  isSponsored: boolean;
  isUgc: boolean;
  domain: string;
  issues: string[];
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
 * Extract external links from HTML
 */
function extractExternalLinks(content: string): Array<{
  url: string;
  line: number;
  anchorText: string;
  attributes: string;
}> {
  const links: Array<{
    url: string;
    line: number;
    anchorText: string;
    attributes: string;
  }> = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Match anchor tags with href
    const linkRegex = /<a[^>]*href\s*=\s*["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(line)) !== null) {
      const url = match[1];
      if (!url) continue;
      const attributes = match[2] || '';
      const anchorTextMatch = match[3];
      // SECURITY: Use Cheerio to safely extract text instead of regex
      let anchorText = '';
      if (anchorTextMatch) {
        try {
          const $ = load(anchorTextMatch);
          anchorText = $.text().trim();
        } catch {
          // Fallback: basic text extraction if Cheerio fails
          anchorText = anchorTextMatch.replace(/<\/?[a-z][\s\S]*?>/giu, '').trim();
        }
      }

      // Only external links - use case-insensitive check
      const normalizedUrl = url.trim().toLowerCase();
      if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) {
        // SECURITY: Validate URL properly instead of substring matching
        let isWarmthlyDomain = false;
        try {
          const urlObj = new URL(url);
          const hostname = urlObj.hostname.toLowerCase();
          isWarmthlyDomain =
            hostname === 'warmthly.org' ||
            hostname === 'www.warmthly.org' ||
            (hostname.endsWith('.warmthly.org') && hostname.split('.').length === 3);
        } catch {
          // Invalid URL, skip
        }
        // Skip internal warmthly.org links
        if (!isWarmthlyDomain) {
          links.push({
            url,
            line: index + 1,
            anchorText: anchorText || url,
            attributes,
          });
        }
      }
    }
  });

  return links;
}

/**
 * Analyze external link
 */
function analyzeExternalLink(
  link: { url: string; line: number; anchorText: string; attributes: string },
  file: string
): ExternalLink {
  const issues: string[] = [];

  // Extract domain
  let domain = '';
  try {
    const urlObj = new URL(link.url);
    domain = urlObj.hostname.replace('www.', '');
  } catch {
    domain = 'invalid-url';
  }

  // Check rel attributes
  const hasNofollow = /rel\s*=\s*["'][^"']*nofollow[^"']*["']/i.test(link.attributes);
  const hasNoopener = /rel\s*=\s*["'][^"']*noopener[^"']*["']/i.test(link.attributes);
  const hasNoreferrer = /rel\s*=\s*["'][^"']*noreferrer[^"']*["']/i.test(link.attributes);
  const isSponsored = /rel\s*=\s*["'][^"']*sponsored[^"']*["']/i.test(link.attributes);
  const isUgc = /rel\s*=\s*["'][^"']*ugc[^"']*["']/i.test(link.attributes);

  // SEO best practices
  if (!hasNoopener && !hasNoreferrer) {
    issues.push('Missing noopener or noreferrer (security best practice)');
  }

  // Check if should have nofollow
  const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co'];
  if (suspiciousDomains.some(d => domain.includes(d)) && !hasNofollow) {
    issues.push('Shortened URL should use nofollow');
  }

  // Check anchor text quality
  if (link.anchorText === link.url || link.anchorText === '') {
    issues.push('Generic or missing anchor text');
  }

  if (link.anchorText.toLowerCase() === 'click here' || link.anchorText.toLowerCase() === 'here') {
    issues.push('Non-descriptive anchor text ("click here")');
  }

  // Check for target="_blank" without noopener
  if (/target\s*=\s*["']_blank["']/i.test(link.attributes) && !hasNoopener) {
    issues.push('target="_blank" without noopener (security risk)');
  }

  return {
    file: file.replace(projectRoot, '').replace(/\\/g, '/'),
    line: link.line,
    url: link.url,
    anchorText: link.anchorText,
    hasNofollow,
    hasNoopener,
    hasNoreferrer,
    isSponsored,
    isUgc,
    domain,
    issues,
  };
}

/**
 * Analyze external links
 */
function analyzeExternalLinks(): void {
  console.log('🔍 Analyzing external links...\n');

  const appsDir = join(projectRoot, 'apps');
  const htmlFiles = findHTMLFiles(appsDir);

  console.log(`Found ${htmlFiles.length} HTML files to analyze\n`);

  const allLinks: ExternalLink[] = [];

  htmlFiles.forEach(file => {
    const content = readFileSync(file, 'utf-8');
    const links = extractExternalLinks(content);

    links.forEach(link => {
      const analyzed = analyzeExternalLink(link, file);
      allLinks.push(analyzed);
    });
  });

  if (allLinks.length === 0) {
    console.log('✅ No external links found.\n');
    return;
  }

  console.log(`📊 External Link Analysis Results:\n`);
  console.log(`   Total external links: ${allLinks.length}\n`);

  // Group by domain
  const linksByDomain = new Map<string, ExternalLink[]>();
  allLinks.forEach(link => {
    const domainLinks = linksByDomain.get(link.domain) || [];
    domainLinks.push(link);
    linksByDomain.set(link.domain, domainLinks);
  });

  console.log(`   Unique domains: ${linksByDomain.size}\n`);

  // Links with issues
  const linksWithIssues = allLinks.filter(l => l.issues.length > 0);

  if (linksWithIssues.length > 0) {
    console.log(`⚠️  Links with Issues (${linksWithIssues.length}):\n`);

    const issuesByType = new Map<string, ExternalLink[]>();
    linksWithIssues.forEach(link => {
      link.issues.forEach(issue => {
        const issueLinks = issuesByType.get(issue) || [];
        issueLinks.push(link);
        issuesByType.set(issue, issueLinks);
      });
    });

    issuesByType.forEach((links, issue) => {
      console.log(`   ${issue} (${links.length}):`);
      links.slice(0, 5).forEach(link => {
        console.log(`      ${link.file}:${link.line} - ${link.url}`);
      });
      if (links.length > 5) {
        console.log(`      ... and ${links.length - 5} more`);
      }
      console.log('');
    });
  }

  // Statistics
  const withNofollow = allLinks.filter(l => l.hasNofollow).length;
  const withNoopener = allLinks.filter(l => l.hasNoopener || l.hasNoreferrer).length;
  const sponsored = allLinks.filter(l => l.isSponsored).length;
  const ugc = allLinks.filter(l => l.isUgc).length;

  console.log(`📈 Statistics:\n`);
  console.log(
    `   Links with nofollow: ${withNofollow} (${((withNofollow / allLinks.length) * 100).toFixed(
      1
    )}%)`
  );
  console.log(
    `   Links with noopener/noreferrer: ${withNoopener} (${(
      (withNoopener / allLinks.length) *
      100
    ).toFixed(1)}%)`
  );
  console.log(`   Sponsored links: ${sponsored}`);
  console.log(`   UGC links: ${ugc}\n`);

  // Top domains
  console.log(`🔝 Top External Domains:\n`);
  const sortedDomains = Array.from(linksByDomain.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);

  sortedDomains.forEach(([domain, links], idx) => {
    console.log(`   ${idx + 1}. ${domain}: ${links.length} link(s)`);
  });

  // Generate report
  let report = `# External Link Analysis Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- Total external links: ${allLinks.length}\n`;
  report += `- Unique domains: ${linksByDomain.size}\n`;
  report += `- Links with issues: ${linksWithIssues.length}\n`;
  report += `- Links with nofollow: ${withNofollow}\n`;
  report += `- Links with noopener/noreferrer: ${withNoopener}\n\n`;

  if (linksWithIssues.length > 0) {
    report += `## Links Needing Attention\n\n`;
    linksWithIssues.forEach(link => {
      report += `### ${link.file}:${link.line}\n\n`;
      report += `- **URL**: ${link.url}\n`;
      report += `- **Anchor Text**: "${link.anchorText}"\n`;
      report += `- **Domain**: ${link.domain}\n`;
      report += `- **Issues**:\n`;
      link.issues.forEach(issue => {
        report += `  - ${issue}\n`;
      });
      report += `\n`;
    });
  }

  const reportPath = join(projectRoot, 'docs', 'EXTERNAL-LINK-ANALYSIS-REPORT.md');
  writeFileSync(reportPath, report, 'utf-8');

  console.log(`\n📄 Full report: ${reportPath}\n`);
  console.log('💡 External Link Best Practices:');
  console.log('   - Use nofollow for untrusted or paid links');
  console.log('   - Always use noopener or noreferrer with target="_blank"');
  console.log('   - Use descriptive anchor text');
  console.log('   - Mark sponsored content with rel="sponsored"');
  console.log('   - Mark user-generated content with rel="ugc"\n');
}

// Run analysis
analyzeExternalLinks();

export { analyzeExternalLinks };
