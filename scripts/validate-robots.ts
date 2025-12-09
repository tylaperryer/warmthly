/**
 * Robots.txt Validator
 * Validates robots.txt file for SEO best practices
 *
 * Usage: npm run validate:robots
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface RobotsIssue {
  line: number;
  type: 'error' | 'warning' | 'info';
  issue: string;
  recommendation: string;
}

/**
 * Validate robots.txt
 */
function validateRobots(): void {
  console.log('🔍 Validating robots.txt...\n');

  const robotsPath = join(projectRoot, 'robots.txt');

  if (!existsSync(robotsPath)) {
    console.log('⚠️  robots.txt file not found.\n');
    console.log('   Create a robots.txt file in the project root.\n');
    process.exit(1);
  }

  const content = readFileSync(robotsPath, 'utf-8');
  const lines = content.split('\n');
  const issues: RobotsIssue[] = [];

  let hasUserAgent = false;
  let hasSitemap = false;
  const userAgents = new Set<string>();
  const disallowedPaths: string[] = [];
  const allowedPaths: string[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const lineNum = index + 1;

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    // Check for User-agent directive
    if (trimmed.toLowerCase().startsWith('user-agent:')) {
      hasUserAgent = true;
      const agent = trimmed.substring(11).trim();
      if (agent) {
        userAgents.add(agent);
      } else {
        issues.push({
          line: lineNum,
          type: 'error',
          issue: 'User-agent directive missing value',
          recommendation: 'Specify user-agent (e.g., User-agent: *)',
        });
      }
    }

    // Check for Disallow directive
    if (trimmed.toLowerCase().startsWith('disallow:')) {
      const path = trimmed.substring(9).trim();
      if (path) {
        disallowedPaths.push(path);
      } else {
        // Empty disallow means allow all (should be explicit)
        issues.push({
          line: lineNum,
          type: 'info',
          issue: 'Empty Disallow directive (allows all)',
          recommendation: 'Consider being explicit about what is allowed',
        });
      }
    }

    // Check for Allow directive
    if (trimmed.toLowerCase().startsWith('allow:')) {
      const path = trimmed.substring(6).trim();
      if (path) {
        allowedPaths.push(path);
      }
    }

    // Check for Sitemap directive
    if (trimmed.toLowerCase().startsWith('sitemap:')) {
      hasSitemap = true;
      const sitemapUrl = trimmed.substring(8).trim();
      if (!sitemapUrl) {
        issues.push({
          line: lineNum,
          type: 'error',
          issue: 'Sitemap directive missing URL',
          recommendation:
            'Specify sitemap URL (e.g., Sitemap: https://www.warmthly.org/sitemap.xml)',
        });
      } else if (!sitemapUrl.startsWith('http://') && !sitemapUrl.startsWith('https://')) {
        issues.push({
          line: lineNum,
          type: 'error',
          issue: 'Sitemap URL must be absolute',
          recommendation: 'Use absolute URL (https://...) for sitemap',
        });
      }
    }

    // Check for Crawl-delay
    if (trimmed.toLowerCase().startsWith('crawl-delay:')) {
      const delay = trimmed.substring(12).trim();
      const delayNum = parseFloat(delay);
      if (isNaN(delayNum) || delayNum < 0) {
        issues.push({
          line: lineNum,
          type: 'error',
          issue: 'Invalid crawl-delay value',
          recommendation: 'Crawl-delay must be a positive number',
        });
      }
    }

    // Check for invalid directives
    const validDirectives = ['user-agent', 'disallow', 'allow', 'sitemap', 'crawl-delay', 'host'];
    const directive = trimmed.split(':')[0].toLowerCase().trim();
    if (directive && !validDirectives.includes(directive) && !trimmed.startsWith('#')) {
      issues.push({
        line: lineNum,
        type: 'warning',
        issue: `Unknown directive: ${directive}`,
        recommendation: 'Use only standard robots.txt directives',
      });
    }
  });

  // Global checks
  if (!hasUserAgent) {
    issues.push({
      line: 1,
      type: 'error',
      issue: 'Missing User-agent directive',
      recommendation: 'Add User-agent: * at the beginning',
    });
  }

  if (!hasSitemap) {
    issues.push({
      line: 1,
      type: 'warning',
      issue: 'Missing Sitemap directive',
      recommendation: 'Add Sitemap: https://www.warmthly.org/sitemap.xml',
    });
  }

  // Check for common issues
  if (disallowedPaths.includes('/')) {
    issues.push({
      line: 1,
      type: 'warning',
      issue: 'Disallowing root path (/) blocks entire site',
      recommendation: 'Ensure this is intentional - it blocks all crawlers',
    });
  }

  // Report results
  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  const infos = issues.filter(i => i.type === 'info');

  if (issues.length === 0) {
    console.log('✅ robots.txt is valid!\n');
    console.log(`   User-agents: ${userAgents.size}`);
    console.log(`   Disallowed paths: ${disallowedPaths.length}`);
    console.log(`   Allowed paths: ${allowedPaths.length}`);
    console.log(`   Sitemap: ${hasSitemap ? 'Yes' : 'No'}\n`);
    return;
  }

  console.log(`⚠️  Found ${issues.length} issue(s):\n`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}`);
  console.log(`   Info: ${infos.length}\n`);

  if (errors.length > 0) {
    console.log('❌ Errors:\n');
    errors.forEach(issue => {
      console.log(`   Line ${issue.line}: ${issue.issue}`);
      console.log(`   ${issue.recommendation}\n`);
    });
  }

  if (warnings.length > 0) {
    console.log('⚠️  Warnings:\n');
    warnings.forEach(issue => {
      console.log(`   Line ${issue.line}: ${issue.issue}`);
      console.log(`   ${issue.recommendation}\n`);
    });
  }

  if (infos.length > 0) {
    console.log('ℹ️  Info:\n');
    infos.forEach(issue => {
      console.log(`   Line ${issue.line}: ${issue.issue}`);
      console.log(`   ${issue.recommendation}\n`);
    });
  }

  console.log('💡 Robots.txt Best Practices:');
  console.log('   - Always include User-agent directive');
  console.log('   - Include Sitemap directive');
  console.log('   - Use absolute URLs for sitemaps');
  console.log('   - Be careful with Disallow: / (blocks entire site)');
  console.log('   - Test with Google Search Console robots.txt tester\n');

  process.exit(errors.length > 0 ? 1 : 0);
}

// Run validation
validateRobots();

export { validateRobots };
