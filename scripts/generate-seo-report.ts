/**
 * SEO Report Generator
 * Generates a comprehensive SEO audit report
 *
 * Usage: npm run generate:seo-report
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  page: string;
  issue: string;
  recommendation: string;
}

interface SEOMetrics {
  totalPages: number;
  pagesWithTitle: number;
  pagesWithDescription: number;
  pagesWithOGTags: number;
  pagesWithStructuredData: number;
  pagesWithHreflang: number;
  pagesWithCanonical: number;
  totalImages: number;
  imagesWithAlt: number;
  totalInternalLinks: number;
  totalExternalLinks: number;
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
 * Analyze a single HTML file
 */
function analyzeHTMLFile(filePath: string, issues: SEOIssue[], metrics: SEOMetrics): void {
  const content = readFileSync(filePath, 'utf-8');
  const relativePath = filePath.replace(projectRoot, '').replace(/\\/g, '/');

  metrics.totalPages++;

  // Check for title tag
  const hasTitle = /<title[^>]*>.*?<\/title>/i.test(content);
  if (hasTitle) {
    metrics.pagesWithTitle++;
    const titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch) {
      const title = titleMatch[1].trim();
      if (title.length < 30) {
        issues.push({
          type: 'warning',
          page: relativePath,
          issue: `Title too short (${title.length} chars): "${title}"`,
          recommendation: 'Titles should be 30-60 characters for optimal SEO',
        });
      } else if (title.length > 60) {
        issues.push({
          type: 'warning',
          page: relativePath,
          issue: `Title too long (${title.length} chars): "${title.substring(0, 60)}..."`,
          recommendation: 'Titles should be 30-60 characters for optimal SEO',
        });
      }
    }
  } else {
    issues.push({
      type: 'error',
      page: relativePath,
      issue: 'Missing <title> tag',
      recommendation: 'Add a descriptive title tag to improve SEO',
    });
  }

  // Check for meta description
  const hasDescription = /<meta[^>]*name=["']description["'][^>]*>/i.test(content);
  if (hasDescription) {
    metrics.pagesWithDescription++;
    const descMatch = content.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i
    );
    if (descMatch) {
      const desc = descMatch[1].trim();
      if (desc.length < 120) {
        issues.push({
          type: 'warning',
          page: relativePath,
          issue: `Meta description too short (${desc.length} chars)`,
          recommendation: 'Meta descriptions should be 120-160 characters for optimal SEO',
        });
      } else if (desc.length > 160) {
        issues.push({
          type: 'warning',
          page: relativePath,
          issue: `Meta description too long (${desc.length} chars)`,
          recommendation: 'Meta descriptions should be 120-160 characters for optimal SEO',
        });
      }
    }
  } else {
    issues.push({
      type: 'error',
      page: relativePath,
      issue: 'Missing meta description',
      recommendation: 'Add a meta description tag to improve SEO and click-through rates',
    });
  }

  // Check for Open Graph tags
  const hasOGTitle = /<meta[^>]*property=["']og:title["'][^>]*>/i.test(content);
  const hasOGDescription = /<meta[^>]*property=["']og:description["'][^>]*>/i.test(content);
  const hasOGImage = /<meta[^>]*property=["']og:image["'][^>]*>/i.test(content);
  if (hasOGTitle && hasOGDescription && hasOGImage) {
    metrics.pagesWithOGTags++;
  } else {
    issues.push({
      type: 'warning',
      page: relativePath,
      issue: 'Missing Open Graph tags',
      recommendation: 'Add og:title, og:description, and og:image for better social media sharing',
    });
  }

  // Check for structured data
  const hasStructuredData = /<script[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(content);
  if (hasStructuredData) {
    metrics.pagesWithStructuredData++;
  } else {
    issues.push({
      type: 'info',
      page: relativePath,
      issue: 'No structured data found',
      recommendation: 'Consider adding JSON-LD structured data for rich snippets',
    });
  }

  // Check for hreflang tags
  const hasHreflang = /<link[^>]*rel=["']alternate["'][^>]*hreflang=/i.test(content);
  if (hasHreflang) {
    metrics.pagesWithHreflang++;
  }

  // Check for canonical URL
  const hasCanonical = /<link[^>]*rel=["']canonical["'][^>]*>/i.test(content);
  if (hasCanonical) {
    metrics.pagesWithCanonical++;
  } else {
    issues.push({
      type: 'warning',
      page: relativePath,
      issue: 'Missing canonical URL',
      recommendation: 'Add a canonical URL to prevent duplicate content issues',
    });
  }

  // Check images
  const images = content.match(/<img[^>]*>/gi) || [];
  metrics.totalImages += images.length;
  images.forEach(img => {
    if (/alt=["'][^"']*["']/i.test(img)) {
      metrics.imagesWithAlt++;
    } else {
      issues.push({
        type: 'error',
        page: relativePath,
        issue: `Image missing alt attribute: ${img.substring(0, 50)}...`,
        recommendation: 'Add descriptive alt text to all images for accessibility and SEO',
      });
    }
  });

  // Check internal links
  const internalLinks = (content.match(/href=["'](\/[^"']*)["']/g) || []).length;
  metrics.totalInternalLinks += internalLinks;

  // Check external links
  const externalLinks = (content.match(/href=["'](https?:\/\/[^"']*)["']/g) || []).length;
  metrics.totalExternalLinks += externalLinks;
}

/**
 * Generate markdown report
 */
function generateReport(issues: SEOIssue[], metrics: SEOMetrics): string {
  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  const infos = issues.filter(i => i.type === 'info');

  const report = `# SEO Audit Report

Generated: ${new Date().toISOString()}

## Summary

- **Total Pages**: ${metrics.totalPages}
- **Errors**: ${errors.length}
- **Warnings**: ${warnings.length}
- **Info**: ${infos.length}

## Metrics

### Page Coverage
- Pages with title tags: ${metrics.pagesWithTitle}/${metrics.totalPages} (${Math.round(
    (metrics.pagesWithTitle / metrics.totalPages) * 100
  )}%)
- Pages with meta descriptions: ${metrics.pagesWithDescription}/${metrics.totalPages} (${Math.round(
    (metrics.pagesWithDescription / metrics.totalPages) * 100
  )}%)
- Pages with Open Graph tags: ${metrics.pagesWithOGTags}/${metrics.totalPages} (${Math.round(
    (metrics.pagesWithOGTags / metrics.totalPages) * 100
  )}%)
- Pages with structured data: ${metrics.pagesWithStructuredData}/${
    metrics.totalPages
  } (${Math.round((metrics.pagesWithStructuredData / metrics.totalPages) * 100)}%)
- Pages with hreflang tags: ${metrics.pagesWithHreflang}/${metrics.totalPages} (${Math.round(
    (metrics.pagesWithHreflang / metrics.totalPages) * 100
  )}%)
- Pages with canonical URLs: ${metrics.pagesWithCanonical}/${metrics.totalPages} (${Math.round(
    (metrics.pagesWithCanonical / metrics.totalPages) * 100
  )}%)

### Images
- Total images: ${metrics.totalImages}
- Images with alt text: ${metrics.imagesWithAlt}/${metrics.totalImages} (${Math.round(
    (metrics.imagesWithAlt / metrics.totalImages) * 100
  )}%)

### Links
- Total internal links: ${metrics.totalInternalLinks}
- Total external links: ${metrics.totalExternalLinks}
- Average internal links per page: ${(metrics.totalInternalLinks / metrics.totalPages).toFixed(1)}

## Issues

${
  errors.length > 0
    ? `### ❌ Errors (${errors.length})

${errors
  .map(
    (issue, idx) => `
${idx + 1}. **${issue.page}**
   - Issue: ${issue.issue}
   - Recommendation: ${issue.recommendation}
`
  )
  .join('\n')}`
    : '### ✅ No Errors Found'
}

${
  warnings.length > 0
    ? `### ⚠️ Warnings (${warnings.length})

${warnings
  .map(
    (issue, idx) => `
${idx + 1}. **${issue.page}**
   - Issue: ${issue.issue}
   - Recommendation: ${issue.recommendation}
`
  )
  .join('\n')}`
    : '### ✅ No Warnings'
}

${
  infos.length > 0
    ? `### ℹ️ Info (${infos.length})

${infos
  .map(
    (issue, idx) => `
${idx + 1}. **${issue.page}**
   - Issue: ${issue.issue}
   - Recommendation: ${issue.recommendation}
`
  )
  .join('\n')}`
    : ''
}

## Recommendations

1. **Fix all errors** - These are critical SEO issues that should be addressed immediately
2. **Address warnings** - These can impact SEO performance and user experience
3. **Consider info items** - These are opportunities for improvement
4. **Monitor regularly** - Run this report monthly to track improvements
5. **Validate structured data** - Use \`npm run validate:structured-data\` to check schema compliance

## Next Steps

- Run \`npm run validate:structured-data\` to check structured data
- Run \`npm run audit:alt-text\` for detailed image alt text audit
- Run \`npm run generate:sitemap\` to update sitemaps
- Test with Google Rich Results Test: https://search.google.com/test/rich-results
- Check PageSpeed Insights: https://pagespeed.web.dev/

---

*Report generated by Warmthly SEO Audit Tool*
`;

  return report;
}

/**
 * Main function
 */
function generateSEOReport(): void {
  console.log('🔍 Generating SEO audit report...\n');

  const appsDir = join(projectRoot, 'apps');
  const htmlFiles = findHTMLFiles(appsDir);

  console.log(`Found ${htmlFiles.length} HTML files to analyze\n`);

  const issues: SEOIssue[] = [];
  const metrics: SEOMetrics = {
    totalPages: 0,
    pagesWithTitle: 0,
    pagesWithDescription: 0,
    pagesWithOGTags: 0,
    pagesWithStructuredData: 0,
    pagesWithHreflang: 0,
    pagesWithCanonical: 0,
    totalImages: 0,
    imagesWithAlt: 0,
    totalInternalLinks: 0,
    totalExternalLinks: 0,
  };

  htmlFiles.forEach(file => {
    analyzeHTMLFile(file, issues, metrics);
  });

  const report = generateReport(issues, metrics);
  const reportPath = join(projectRoot, 'docs', 'SEO-AUDIT-REPORT.md');

  // Ensure docs directory exists
  try {
    writeFileSync(reportPath, report, 'utf-8');
    console.log(`✅ SEO report generated: ${reportPath}\n`);

    const errors = issues.filter(i => i.type === 'error').length;
    const warnings = issues.filter(i => i.type === 'warning').length;

    console.log(`Summary:`);
    console.log(`  - Total pages: ${metrics.totalPages}`);
    console.log(`  - Errors: ${errors}`);
    console.log(`  - Warnings: ${warnings}`);
    console.log(`  - Images with alt: ${metrics.imagesWithAlt}/${metrics.totalImages}`);
    console.log(`\n📄 Full report: ${reportPath}\n`);

    if (errors > 0) {
      console.log('⚠️  Please fix errors before deploying');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error writing report:', error);
    process.exit(1);
  }
}

// Run report generation
generateSEOReport();

export { generateSEOReport };
