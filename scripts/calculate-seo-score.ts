/**
 * SEO Score Calculator
 * Calculates comprehensive SEO score based on all factors
 *
 * Usage: npm run calculate:seo-score
 */

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface SEOFactor {
  name: string;
  weight: number;
  score: number;
  maxScore: number;
  details: string[];
}

interface SEOScore {
  overall: number;
  factors: SEOFactor[];
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  recommendations: string[];
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
 * Calculate SEO score
 */
function calculateSEOScore(): SEOScore {
  const appsDir = join(projectRoot, 'apps');
  const htmlFiles = findHTMLFiles(appsDir);
  const factors: SEOFactor[] = [];

  // 1. Meta Tags (20%)
  let metaScore = 0;
  let metaMax = 0;
  const metaDetails: string[] = [];
  let pagesWithTitle = 0;
  let pagesWithDescription = 0;
  let pagesWithOG = 0;
  let pagesWithCanonical = 0;

  htmlFiles.forEach(file => {
    const content = readFileSync(file, 'utf-8');
    metaMax += 4; // 4 points per page

    if (/<title[^>]*>/.test(content)) {
      pagesWithTitle++;
      metaScore += 1;
    }
    if (/<meta[^>]*name=["']description["']/.test(content)) {
      pagesWithDescription++;
      metaScore += 1;
    }
    if (
      /<meta[^>]*property=["']og:title["']/.test(content) &&
      /<meta[^>]*property=["']og:description["']/.test(content) &&
      /<meta[^>]*property=["']og:image["']/.test(content)
    ) {
      pagesWithOG++;
      metaScore += 1;
    }
    if (/<link[^>]*rel=["']canonical["']/.test(content)) {
      pagesWithCanonical++;
      metaScore += 1;
    }
  });

  metaDetails.push(`${pagesWithTitle}/${htmlFiles.length} pages have title tags`);
  metaDetails.push(`${pagesWithDescription}/${htmlFiles.length} pages have meta descriptions`);
  metaDetails.push(`${pagesWithOG}/${htmlFiles.length} pages have complete OG tags`);
  metaDetails.push(`${pagesWithCanonical}/${htmlFiles.length} pages have canonical URLs`);

  factors.push({
    name: 'Meta Tags',
    weight: 20,
    score: metaMax > 0 ? (metaScore / metaMax) * 100 : 0,
    maxScore: 100,
    details: metaDetails,
  });

  // 2. Structured Data (15%)
  let structuredDataScore = 0;
  let pagesWithStructuredData = 0;
  const structuredDataDetails: string[] = [];
  const schemaTypes = new Set<string>();

  htmlFiles.forEach(file => {
    const content = readFileSync(file, 'utf-8');
    const hasStructuredData = /<script[^>]*type=["']application\/ld\+json["']/.test(content);
    if (hasStructuredData) {
      pagesWithStructuredData++;
      const matches = content.matchAll(
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
      );
      for (const match of matches) {
        try {
          const json = JSON.parse(match[1]);
          if (json['@type']) {
            schemaTypes.add(json['@type']);
          }
        } catch {
          // Invalid JSON
        }
      }
    }
  });

  structuredDataScore = (pagesWithStructuredData / htmlFiles.length) * 100;
  structuredDataDetails.push(
    `${pagesWithStructuredData}/${htmlFiles.length} pages have structured data`
  );
  structuredDataDetails.push(`${schemaTypes.size} different schema types used`);

  factors.push({
    name: 'Structured Data',
    weight: 15,
    score: structuredDataScore,
    maxScore: 100,
    details: structuredDataDetails,
  });

  // 3. Images (10%)
  let imageScore = 0;
  let totalImages = 0;
  let imagesWithAlt = 0;
  const imageDetails: string[] = [];

  htmlFiles.forEach(file => {
    const content = readFileSync(file, 'utf-8');
    const images = content.match(/<img[^>]*>/gi) || [];
    totalImages += images.length;
    images.forEach(img => {
      if (/alt\s*=\s*["']([^"']+)["']/i.test(img)) {
        imagesWithAlt++;
      }
    });
  });

  imageScore = totalImages > 0 ? (imagesWithAlt / totalImages) * 100 : 100;
  imageDetails.push(`${imagesWithAlt}/${totalImages} images have alt text`);

  factors.push({
    name: 'Image Optimization',
    weight: 10,
    score: imageScore,
    maxScore: 100,
    details: imageDetails,
  });

  // 4. Internal Linking (10%)
  let linkingScore = 0;
  let totalLinks = 0;
  let internalLinks = 0;
  const linkingDetails: string[] = [];

  htmlFiles.forEach(file => {
    const content = readFileSync(file, 'utf-8');
    const links = content.match(/<a[^>]*href\s*=\s*["']([^"']+)["']/gi) || [];
    totalLinks += links.length;
    links.forEach(link => {
      const hrefMatch = link.match(/href\s*=\s*["']([^"']+)["']/i);
      if (hrefMatch) {
        const href = hrefMatch[1];
        if (
          (!href.startsWith('http://') && !href.startsWith('https://')) ||
          href.includes('warmthly.org')
        ) {
          internalLinks++;
        }
      }
    });
  });

  linkingScore = totalLinks > 0 ? (internalLinks / totalLinks) * 50 + 50 : 50; // Bonus for having links
  linkingDetails.push(`${internalLinks} internal links found`);
  linkingDetails.push(`Average ${(totalLinks / htmlFiles.length).toFixed(1)} links per page`);

  factors.push({
    name: 'Internal Linking',
    weight: 10,
    score: linkingScore,
    maxScore: 100,
    details: linkingDetails,
  });

  // 5. URL Structure (10%)
  let urlScore = 100;
  const urlDetails: string[] = [];
  let issues = 0;

  htmlFiles.forEach(file => {
    const relative = file.replace(projectRoot, '').replace(/\\/g, '/');
    if (relative.includes('_')) issues++;
    if (relative.toLowerCase() !== relative) issues++;
  });

  urlScore = Math.max(0, 100 - issues * 5);
  urlDetails.push(`${issues} URL structure issues found`);

  factors.push({
    name: 'URL Structure',
    weight: 10,
    score: urlScore,
    maxScore: 100,
    details: urlDetails,
  });

  // 6. Sitemap (10%)
  let sitemapScore = 0;
  const sitemapDetails: string[] = [];
  const sitemapFiles = ['apps/main/sitemap.xml', 'apps/mint/sitemap.xml', 'apps/post/sitemap.xml'];
  let existingSitemaps = 0;

  sitemapFiles.forEach(sitemap => {
    if (existsSync(join(projectRoot, sitemap))) {
      existingSitemaps++;
    }
  });

  sitemapScore = (existingSitemaps / sitemapFiles.length) * 100;
  sitemapDetails.push(`${existingSitemaps}/${sitemapFiles.length} sitemaps found`);

  factors.push({
    name: 'Sitemaps',
    weight: 10,
    score: sitemapScore,
    maxScore: 100,
    details: sitemapDetails,
  });

  // 7. Robots.txt (5%)
  let robotsScore = 0;
  const robotsDetails: string[] = [];
  const robotsPath = join(projectRoot, 'robots.txt');

  if (existsSync(robotsPath)) {
    const robotsContent = readFileSync(robotsPath, 'utf-8');
    robotsScore = 50; // Base score for existing
    if (robotsContent.includes('Sitemap:')) robotsScore += 25;
    if (robotsContent.includes('User-agent:')) robotsScore += 25;
    robotsDetails.push('robots.txt exists');
    if (robotsContent.includes('Sitemap:')) robotsDetails.push('Sitemap directive present');
  } else {
    robotsDetails.push('robots.txt missing');
  }

  factors.push({
    name: 'Robots.txt',
    weight: 5,
    score: robotsScore,
    maxScore: 100,
    details: robotsDetails,
  });

  // 8. Mobile Optimization (10%)
  let mobileScore = 100;
  const mobileDetails: string[] = [];
  let pagesWithoutViewport = 0;

  htmlFiles.forEach(file => {
    const content = readFileSync(file, 'utf-8');
    if (!/<meta[^>]*name=["']viewport["']/i.test(content)) {
      pagesWithoutViewport++;
    }
  });

  mobileScore = Math.max(0, 100 - pagesWithoutViewport * 10);
  mobileDetails.push(
    `${htmlFiles.length - pagesWithoutViewport}/${htmlFiles.length} pages have viewport meta tag`
  );

  factors.push({
    name: 'Mobile Optimization',
    weight: 10,
    score: mobileScore,
    maxScore: 100,
    details: mobileDetails,
  });

  // 9. Semantic HTML (5%)
  let semanticScore = 0;
  const semanticDetails: string[] = [];
  let pagesWithMain = 0;
  let pagesWithH1 = 0;

  htmlFiles.forEach(file => {
    const content = readFileSync(file, 'utf-8');
    if (/<main[^>]*>/i.test(content)) pagesWithMain++;
    if (/<h1[^>]*>/i.test(content)) pagesWithH1++;
  });

  semanticScore = (pagesWithMain / htmlFiles.length) * 50 + (pagesWithH1 / htmlFiles.length) * 50;
  semanticDetails.push(`${pagesWithMain}/${htmlFiles.length} pages have <main> element`);
  semanticDetails.push(`${pagesWithH1}/${htmlFiles.length} pages have <h1> heading`);

  factors.push({
    name: 'Semantic HTML',
    weight: 5,
    score: semanticScore,
    maxScore: 100,
    details: semanticDetails,
  });

  // 10. Performance Signals (5%)
  let performanceScore = 100;
  const performanceDetails: string[] = [];

  // Check for lazy loading
  let imagesWithLazy = 0;
  htmlFiles.forEach(file => {
    const content = readFileSync(file, 'utf-8');
    const images = content.match(/<img[^>]*>/gi) || [];
    images.forEach(img => {
      if (/loading\s*=\s*["']lazy["']/i.test(img)) {
        imagesWithLazy++;
      }
    });
  });

  if (totalImages > 0) {
    performanceScore = (imagesWithLazy / totalImages) * 100;
  }
  performanceDetails.push(`${imagesWithLazy}/${totalImages} images use lazy loading`);

  factors.push({
    name: 'Performance Signals',
    weight: 5,
    score: performanceScore,
    maxScore: 100,
    details: performanceDetails,
  });

  // Calculate overall score
  const weightedScore = factors.reduce((sum, factor) => {
    return sum + (factor.score * factor.weight) / 100;
  }, 0);

  // Determine grade
  let grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  if (weightedScore >= 97) grade = 'A+';
  else if (weightedScore >= 93) grade = 'A';
  else if (weightedScore >= 87) grade = 'B+';
  else if (weightedScore >= 83) grade = 'B';
  else if (weightedScore >= 77) grade = 'C+';
  else if (weightedScore >= 73) grade = 'C';
  else if (weightedScore >= 60) grade = 'D';
  else grade = 'F';

  // Generate recommendations
  const recommendations: string[] = [];
  factors.forEach(factor => {
    if (factor.score < 80) {
      recommendations.push(`Improve ${factor.name} (current: ${factor.score.toFixed(1)}%)`);
    }
  });

  return {
    overall: Math.round(weightedScore * 10) / 10,
    factors,
    grade,
    recommendations,
  };
}

/**
 * Generate SEO score report
 */
function generateSEOScoreReport(): void {
  console.log('📊 Calculating comprehensive SEO score...\n');

  const score = calculateSEOScore();

  console.log(`\n🎯 Overall SEO Score: ${score.overall}/100 (Grade: ${score.grade})\n`);

  console.log('📋 Factor Breakdown:\n');
  score.factors.forEach(factor => {
    const barLength = Math.round((factor.score / 100) * 20);
    const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
    const icon = factor.score >= 90 ? '✅' : factor.score >= 70 ? '⚠️' : '❌';

    console.log(`${icon} ${factor.name} (${factor.weight}%): ${factor.score.toFixed(1)}%`);
    console.log(`   ${bar}`);
    factor.details.forEach(detail => {
      console.log(`   • ${detail}`);
    });
    console.log('');
  });

  if (score.recommendations.length > 0) {
    console.log('💡 Recommendations:\n');
    score.recommendations.forEach((rec, idx) => {
      console.log(`   ${idx + 1}. ${rec}`);
    });
    console.log('');
  }

  // Generate markdown report
  let report = `# SEO Score Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Overall Score\n\n`;
  report += `**Score: ${score.overall}/100**\n\n`;
  report += `**Grade: ${score.grade}**\n\n`;

  report += `## Factor Breakdown\n\n`;
  report += `| Factor | Weight | Score | Status |\n`;
  report += `|--------|--------|-------|--------|\n`;
  score.factors.forEach(factor => {
    const icon = factor.score >= 90 ? '✅' : factor.score >= 70 ? '⚠️' : '❌';
    report += `| ${factor.name} | ${factor.weight}% | ${factor.score.toFixed(1)}% | ${icon} |\n`;
  });

  report += `\n## Details\n\n`;
  score.factors.forEach(factor => {
    report += `### ${factor.name}\n\n`;
    factor.details.forEach(detail => {
      report += `- ${detail}\n`;
    });
    report += `\n`;
  });

  if (score.recommendations.length > 0) {
    report += `## Recommendations\n\n`;
    score.recommendations.forEach(rec => {
      report += `- ${rec}\n`;
    });
  }

  const reportPath = join(projectRoot, 'docs', 'SEO-SCORE-REPORT.md');
  writeFileSync(reportPath, report, 'utf-8');

  console.log(`📄 Full report: ${reportPath}\n`);
  console.log('🎉 Keep up the excellent SEO work!\n');
}

// Run calculation
generateSEOScoreReport();

export { calculateSEOScore, generateSEOScoreReport };
