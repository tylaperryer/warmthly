/**
 * Sitemap Validator
 * Validates sitemap.xml files for correctness and completeness
 *
 * Usage: npm run validate:sitemap
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface SitemapIssue {
  file: string;
  type: 'error' | 'warning' | 'info';
  issue: string;
  recommendation: string;
}

interface SitemapStats {
  file: string;
  urlCount: number;
  hasImages: boolean;
  hasVideos: boolean;
  imageCount: number;
  videoCount: number;
  lastModCount: number;
  priorityCount: number;
  changeFreqCount: number;
}

/**
 * Find all sitemap files
 */
function findSitemapFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  files.forEach((file: string) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== 'build') {
        findSitemapFiles(filePath, fileList);
      }
    } else if (file === 'sitemap.xml') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Validate sitemap XML
 */
function validateSitemap(filePath: string): { issues: SitemapIssue[]; stats: SitemapStats } {
  const issues: SitemapIssue[] = [];
  const relativePath = filePath.replace(projectRoot, '').replace(/\\/g, '/');

  if (!existsSync(filePath)) {
    issues.push({
      file: relativePath,
      type: 'error',
      issue: 'Sitemap file does not exist',
      recommendation: 'Generate sitemap using: npm run generate:sitemap',
    });
    return {
      issues,
      stats: {
        file: relativePath,
        urlCount: 0,
        hasImages: false,
        hasVideos: false,
        imageCount: 0,
        videoCount: 0,
        lastModCount: 0,
        priorityCount: 0,
        changeFreqCount: 0,
      },
    };
  }

  const content = readFileSync(filePath, 'utf-8');

  // Check XML structure
  if (!content.includes('<?xml')) {
    issues.push({
      file: relativePath,
      type: 'error',
      issue: 'Missing XML declaration',
      recommendation: 'Add <?xml version="1.0" encoding="UTF-8"?> at the start',
    });
  }

  if (!content.includes('<urlset')) {
    issues.push({
      file: relativePath,
      type: 'error',
      issue: 'Missing urlset element',
      recommendation: 'Sitemap must contain <urlset> element',
    });
  }

  // Check namespaces
  const hasImageNamespace = content.includes('xmlns:image=');
  const hasVideoNamespace = content.includes('xmlns:video=');

  // Count URLs
  const urlMatches = content.match(/<url>/gi) || [];
  const urlCount = urlMatches.length;

  if (urlCount === 0) {
    issues.push({
      file: relativePath,
      type: 'error',
      issue: 'No URLs found in sitemap',
      recommendation: 'Add at least one URL to the sitemap',
    });
  }

  if (urlCount > 50000) {
    issues.push({
      file: relativePath,
      type: 'error',
      issue: `Too many URLs (${urlCount}) - exceeds 50,000 limit`,
      recommendation: 'Split into multiple sitemaps or use sitemap index',
    });
  }

  // Count images and videos
  const imageMatches = content.match(/<image:image>/gi) || [];
  const videoMatches = content.match(/<video:video>/gi) || [];
  const imageCount = imageMatches.length;
  const videoCount = videoMatches.length;

  if (imageCount > 0 && !hasImageNamespace) {
    issues.push({
      file: relativePath,
      type: 'error',
      issue: 'Images found but missing image namespace',
      recommendation: 'Add xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
    });
  }

  if (videoCount > 0 && !hasVideoNamespace) {
    issues.push({
      file: relativePath,
      type: 'error',
      issue: 'Videos found but missing video namespace',
      recommendation: 'Add xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"',
    });
  }

  // Check for required elements
  const lastModMatches = content.match(/<lastmod>/gi) || [];
  const priorityMatches = content.match(/<priority>/gi) || [];
  const changeFreqMatches = content.match(/<changefreq>/gi) || [];

  const lastModCount = lastModMatches.length;
  const priorityCount = priorityMatches.length;
  const changeFreqCount = changeFreqMatches.length;

  // Check coverage
  if (lastModCount < urlCount * 0.8) {
    issues.push({
      file: relativePath,
      type: 'warning',
      issue: `Only ${lastModCount}/${urlCount} URLs have lastmod`,
      recommendation: 'Add lastmod to all URLs for better indexing',
    });
  }

  // Check for valid URLs
  const locMatches = content.match(/<loc>([^<]+)<\/loc>/gi) || [];
  locMatches.forEach((match) => {
    const url = match.replace(/<\/?loc>/g, '');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      issues.push({
        file: relativePath,
        type: 'error',
        issue: `Invalid URL format: ${url}`,
        recommendation: 'URLs must be absolute (start with http:// or https://)',
      });
    }
  });

  // Check file size
  const fileSize = content.length;
  if (fileSize > 50 * 1024 * 1024) {
    // 50MB
    issues.push({
      file: relativePath,
      type: 'error',
      issue: `Sitemap too large (${(fileSize / 1024 / 1024).toFixed(2)}MB)`,
      recommendation: 'Split into multiple sitemaps (max 50MB uncompressed)',
    });
  }

  return {
    issues,
    stats: {
      file: relativePath,
      urlCount,
      hasImages: imageCount > 0,
      hasVideos: videoCount > 0,
      imageCount,
      videoCount,
      lastModCount,
      priorityCount,
      changeFreqCount,
    },
  };
}

/**
 * Validate sitemaps
 */
function validateSitemaps(): void {
  console.log('🔍 Validating sitemaps...\n');

  const appsDir = join(projectRoot, 'apps');
  const sitemapFiles = findSitemapFiles(appsDir);

  if (sitemapFiles.length === 0) {
    console.log('⚠️  No sitemap files found.\n');
    console.log('   Generate sitemaps using: npm run generate:sitemap\n');
    return;
  }

  console.log(`Found ${sitemapFiles.length} sitemap file(s) to validate\n`);

  const allIssues: SitemapIssue[] = [];
  const allStats: SitemapStats[] = [];

  sitemapFiles.forEach(file => {
    const { issues, stats } = validateSitemap(file);
    allIssues.push(...issues);
    allStats.push(stats);
  });

  // Report statistics
  console.log('📊 Sitemap Statistics:\n');
  allStats.forEach(stats => {
    console.log(`   ${stats.file}:`);
    console.log(`      URLs: ${stats.urlCount}`);
    console.log(`      Images: ${stats.imageCount}`);
    console.log(`      Videos: ${stats.videoCount}`);
    console.log(`      With lastmod: ${stats.lastModCount}/${stats.urlCount}`);
    console.log(`      With priority: ${stats.priorityCount}/${stats.urlCount}`);
    console.log(`      With changefreq: ${stats.changeFreqCount}/${stats.urlCount}`);
    console.log('');
  });

  // Report issues
  if (allIssues.length === 0) {
    console.log('✅ All sitemaps are valid!\n');
    return;
  }

  const errors = allIssues.filter(i => i.type === 'error');
  const warnings = allIssues.filter(i => i.type === 'warning');
  const infos = allIssues.filter(i => i.type === 'info');

  console.log(`⚠️  Found ${allIssues.length} issue(s):\n`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}`);
  console.log(`   Info: ${infos.length}\n`);

  if (errors.length > 0) {
    console.log('❌ Errors:\n');
    errors.forEach(issue => {
      console.log(`   ${issue.file}: ${issue.issue}`);
      console.log(`   ${issue.recommendation}\n`);
    });
  }

  if (warnings.length > 0) {
    console.log('⚠️  Warnings:\n');
    warnings.forEach(issue => {
      console.log(`   ${issue.file}: ${issue.issue}`);
      console.log(`   ${issue.recommendation}\n`);
    });
  }

  console.log('💡 Sitemap Best Practices:');
  console.log('   - Keep sitemaps under 50MB and 50,000 URLs');
  console.log('   - Include lastmod dates for all URLs');
  console.log('   - Use proper namespaces for images/videos');
  console.log('   - Ensure all URLs are absolute');
  console.log('   - Submit sitemaps to Google Search Console\n');

  process.exit(errors.length > 0 ? 1 : 0);
}

// Run validation
validateSitemaps();

export { validateSitemaps };
