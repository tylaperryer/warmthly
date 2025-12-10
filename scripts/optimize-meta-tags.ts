/**
 * Meta Tag Optimizer
 * Analyzes and suggests optimizations for meta tags
 *
 * Usage: npm run optimize:meta-tags
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface MetaTagIssue {
  file: string;
  type: 'title' | 'description' | 'og:title' | 'og:description' | 'og:image' | 'canonical';
  current: string;
  issue: string;
  recommendation: string;
  severity: 'error' | 'warning' | 'info';
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
 * Extract meta tag value
 */
function extractMetaTag(
  html: string,
  type: 'title' | 'description' | 'og:title' | 'og:description' | 'og:image' | 'canonical'
): string | null {
  switch (type) {
    case 'title': {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      return titleMatch && titleMatch[1] ? titleMatch[1].trim() : null;
    }

    case 'description': {
      const descMatch = html.match(
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
      );
      return descMatch && descMatch[1] ? descMatch[1].trim() : null;
    }

    case 'og:title': {
      const ogTitleMatch = html.match(
        /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
      );
      return ogTitleMatch && ogTitleMatch[1] ? ogTitleMatch[1].trim() : null;
    }

    case 'og:description': {
      const ogDescMatch = html.match(
        /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i
      );
      return ogDescMatch && ogDescMatch[1] ? ogDescMatch[1].trim() : null;
    }

    case 'og:image': {
      const ogImageMatch = html.match(
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
      );
      return ogImageMatch && ogImageMatch[1] ? ogImageMatch[1].trim() : null;
    }

    case 'canonical': {
      const canonicalMatch = html.match(
        /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i
      );
      return canonicalMatch && canonicalMatch[1] ? canonicalMatch[1].trim() : null;
    }

    default:
      return null;
  }
}

/**
 * Analyze meta tags
 */
function analyzeMetaTags(): void {
  console.log('🔍 Analyzing meta tags for optimization opportunities...\n');

  const appsDir = join(projectRoot, 'apps');
  const htmlFiles = findHTMLFiles(appsDir);

  console.log(`Found ${htmlFiles.length} HTML files to analyze\n`);

  const issues: MetaTagIssue[] = [];

  htmlFiles.forEach(file => {
    const content = readFileSync(file, 'utf-8');
    const relativePath = file.replace(projectRoot, '').replace(/\\/g, '/');

    // Check title
    const title = extractMetaTag(content, 'title');
    if (!title) {
      issues.push({
        file: relativePath,
        type: 'title',
        current: '',
        issue: 'Missing title tag',
        recommendation: 'Add a descriptive title tag (30-60 characters)',
        severity: 'error',
      });
    } else {
      if (title.length < 30) {
        issues.push({
          file: relativePath,
          type: 'title',
          current: title,
          issue: `Title too short (${title.length} chars)`,
          recommendation: 'Expand title to 30-60 characters for better SEO',
          severity: 'warning',
        });
      } else if (title.length > 60) {
        issues.push({
          file: relativePath,
          type: 'title',
          current: title.substring(0, 60) + '...',
          issue: `Title too long (${title.length} chars)`,
          recommendation: 'Shorten title to 30-60 characters (will be truncated in search results)',
          severity: 'warning',
        });
      }

      // Check for brand name
      if (!title.toLowerCase().includes('warmthly')) {
        issues.push({
          file: relativePath,
          type: 'title',
          current: title,
          issue: 'Title missing brand name',
          recommendation: 'Consider including "Warmthly" in title for brand recognition',
          severity: 'info',
        });
      }
    }

    // Check description
    const description = extractMetaTag(content, 'description');
    if (!description) {
      issues.push({
        file: relativePath,
        type: 'description',
        current: '',
        issue: 'Missing meta description',
        recommendation: 'Add a compelling meta description (120-160 characters)',
        severity: 'error',
      });
    } else {
      if (description.length < 120) {
        issues.push({
          file: relativePath,
          type: 'description',
          current: description,
          issue: `Description too short (${description.length} chars)`,
          recommendation: 'Expand description to 120-160 characters for better click-through rates',
          severity: 'warning',
        });
      } else if (description.length > 160) {
        issues.push({
          file: relativePath,
          type: 'description',
          current: description.substring(0, 160) + '...',
          issue: `Description too long (${description.length} chars)`,
          recommendation:
            'Shorten description to 120-160 characters (will be truncated in search results)',
          severity: 'warning',
        });
      }

      // Check for call-to-action
      const hasCTA = /(learn|discover|explore|get|find|read|view|see|try|start)/i.test(description);
      if (!hasCTA) {
        issues.push({
          file: relativePath,
          type: 'description',
          current: description,
          issue: 'Description lacks action words',
          recommendation:
            'Include action words (learn, discover, explore) to improve click-through',
          severity: 'info',
        });
      }
    }

    // Check OG tags
    const ogTitle = extractMetaTag(content, 'og:title');
    const ogDescription = extractMetaTag(content, 'og:description');
    const ogImage = extractMetaTag(content, 'og:image');

    if (!ogTitle) {
      issues.push({
        file: relativePath,
        type: 'og:title',
        current: '',
        issue: 'Missing og:title',
        recommendation: 'Add og:title for better social media sharing',
        severity: 'warning',
      });
    } else if (title && ogTitle !== title) {
      issues.push({
        file: relativePath,
        type: 'og:title',
        current: ogTitle,
        issue: 'og:title differs from title tag',
        recommendation: 'Consider matching og:title with title tag for consistency',
        severity: 'info',
      });
    }

    if (!ogDescription) {
      issues.push({
        file: relativePath,
        type: 'og:description',
        current: '',
        issue: 'Missing og:description',
        recommendation: 'Add og:description for better social media sharing',
        severity: 'warning',
      });
    }

    if (!ogImage) {
      issues.push({
        file: relativePath,
        type: 'og:image',
        current: '',
        issue: 'Missing og:image',
        recommendation: 'Add og:image (1200x630px) for better social media previews',
        severity: 'warning',
      });
    } else if (!ogImage.startsWith('http')) {
      issues.push({
        file: relativePath,
        type: 'og:image',
        current: ogImage,
        issue: 'og:image should use absolute URL',
        recommendation: 'Use absolute URL (https://...) for og:image',
        severity: 'warning',
      });
    }

    // Check canonical
    const canonical = extractMetaTag(content, 'canonical');
    if (!canonical) {
      issues.push({
        file: relativePath,
        type: 'canonical',
        current: '',
        issue: 'Missing canonical URL',
        recommendation: 'Add canonical URL to prevent duplicate content issues',
        severity: 'warning',
      });
    }
  });

  // Report results
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');

  if (issues.length === 0) {
    console.log('✅ All meta tags are optimized!\n');
    return;
  }

  console.log(`⚠️  Found ${issues.length} meta tag optimization opportunity(ies):\n`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}`);
  console.log(`   Info: ${infos.length}\n`);

  // Group by type
  const issuesByType = new Map<string, MetaTagIssue[]>();
  issues.forEach(issue => {
    const typeIssues = issuesByType.get(issue.type) || [];
    typeIssues.push(issue);
    issuesByType.set(issue.type, typeIssues);
  });

  issuesByType.forEach((typeIssues, type) => {
    console.log(`\n📋 ${type.toUpperCase()} Issues (${typeIssues.length}):\n`);
    typeIssues.forEach(issue => {
      const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`   ${icon} ${issue.file}`);
      console.log(`      Issue: ${issue.issue}`);
      if (issue.current) {
        console.log(`      Current: "${issue.current}"`);
      }
      console.log(`      ${issue.recommendation}\n`);
    });
  });

  // Generate optimization report
  let report = `# Meta Tag Optimization Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- Total issues: ${issues.length}\n`;
  report += `- Errors: ${errors.length}\n`;
  report += `- Warnings: ${warnings.length}\n`;
  report += `- Info: ${infos.length}\n\n`;

  report += `## Recommendations by Type\n\n`;
  issuesByType.forEach((typeIssues, type) => {
    report += `### ${type}\n\n`;
    typeIssues.forEach(issue => {
      report += `- **${issue.file}**: ${issue.issue}\n`;
      report += `  - Recommendation: ${issue.recommendation}\n\n`;
    });
  });

  const reportPath = join(projectRoot, 'docs', 'META-TAG-OPTIMIZATION-REPORT.md');
  writeFileSync(reportPath, report, 'utf-8');

  console.log(`\n📄 Full report: ${reportPath}\n`);
  console.log('💡 Meta Tag Best Practices:');
  console.log('   - Title: 30-60 characters, include brand name');
  console.log('   - Description: 120-160 characters, include CTA');
  console.log('   - OG tags: Match title/description, use absolute image URLs');
  console.log('   - Canonical: Always include to prevent duplicate content\n');

  process.exit(errors.length > 0 ? 1 : 0);
}

// Run analysis
analyzeMetaTags();

export { analyzeMetaTags };
