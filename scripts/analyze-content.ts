/**
 * Content Analysis Script
 * Analyzes content length, keyword density, and readability
 * 
 * Usage: npm run analyze:content
 */

// @ts-expect-error - Node.js module
import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
// @ts-expect-error - Node.js module
import { join, extname } from 'path';
// @ts-expect-error - Node.js module
import { fileURLToPath } from 'url';
// @ts-expect-error - Node.js module
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface ContentAnalysis {
  file: string;
  url: string;
  title: string;
  wordCount: number;
  characterCount: number;
  paragraphCount: number;
  headingCount: number;
  imageCount: number;
  linkCount: number;
  keywordDensity: Map<string, number>;
  readabilityScore: number;
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
 * Extract text content from HTML
 */
function extractTextContent(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract title from HTML
 */
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : '';
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
 * Calculate keyword density
 */
function calculateKeywordDensity(text: string, topN: number = 10): Map<string, number> {
  const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const commonWords = new Set([
    'this', 'that', 'with', 'from', 'have', 'will', 'your', 'their', 'there',
    'these', 'those', 'what', 'when', 'where', 'which', 'would', 'could', 'should',
    'about', 'after', 'before', 'during', 'under', 'over', 'through', 'between',
  ]);
  
  const wordCount = new Map<string, number>();
  words.forEach((word) => {
    if (!commonWords.has(word)) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
  });
  
  // Sort by frequency and return top N
  const sorted = Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);
  
  const totalWords = words.length;
  const density = new Map<string, number>();
  sorted.forEach(([word, count]) => {
    density.set(word, (count / totalWords) * 100);
  });
  
  return density;
}

/**
 * Calculate readability score (simplified Flesch Reading Ease)
 */
function calculateReadability(text: string): number {
  const sentences = text.match(/[.!?]+/g) || [];
  const words = text.match(/\b\w+\b/g) || [];
  const syllables = words.reduce((sum, word) => {
    // Simplified syllable count
    const vowels = word.match(/[aeiouy]+/gi) || [];
    return sum + Math.max(1, vowels.length);
  }, 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  // Simplified Flesch Reading Ease
  const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  return Math.max(0, Math.min(100, score));
}

/**
 * Analyze content
 */
function analyzeContent(): void {
  console.log('📊 Analyzing content across all pages...\n');

  const appsDir = join(projectRoot, 'apps');
  const htmlFiles = findHTMLFiles(appsDir);

  console.log(`Found ${htmlFiles.length} HTML files to analyze\n`);

  const analyses: ContentAnalysis[] = [];

  htmlFiles.forEach((file) => {
    const content = readFileSync(file, 'utf-8');
    const textContent = extractTextContent(content);
    const title = extractTitle(content);
    const relativePath = file.replace(projectRoot, '').replace(/\\/g, '/');
    
    const words = textContent.match(/\b\w+\b/g) || [];
    const paragraphs = content.match(/<p[^>]*>/gi) || [];
    const headings = content.match(/<h[1-6][^>]*>/gi) || [];
    const images = content.match(/<img[^>]*>/gi) || [];
    const links = content.match(/<a[^>]*href/gi) || [];
    
    const issues: string[] = [];
    
    // Check content length
    if (words.length < 300) {
      issues.push(`Content too short (${words.length} words) - aim for 300+ words for better SEO`);
    }
    
    if (words.length > 3000) {
      issues.push(`Content very long (${words.length} words) - consider breaking into multiple pages`);
    }
    
    // Check heading structure
    if (headings.length === 0) {
      issues.push('No headings found - add headings for better structure');
    }
    
    // Check images
    if (images.length === 0 && words.length > 500) {
      issues.push('No images found - consider adding images for better engagement');
    }
    
    // Check links
    if (links.length < 3 && words.length > 500) {
      issues.push('Few internal links - add more internal links for better SEO');
    }
    
    analyses.push({
      file: relativePath,
      url: getUrlFromPath(file),
      title,
      wordCount: words.length,
      characterCount: textContent.length,
      paragraphCount: paragraphs.length,
      headingCount: headings.length,
      imageCount: images.length,
      linkCount: links.length,
      keywordDensity: calculateKeywordDensity(textContent),
      readabilityScore: calculateReadability(textContent),
      issues,
    });
  });

  // Generate report
  console.log('📊 Content Analysis Results:\n');

  // Sort by word count
  const sortedByLength = [...analyses].sort((a, b) => b.wordCount - a.wordCount);
  
  console.log('📄 Pages by Content Length:\n');
  sortedByLength.slice(0, 10).forEach((analysis, idx) => {
    console.log(`   ${idx + 1}. ${analysis.file}`);
    console.log(`      Words: ${analysis.wordCount} | Paragraphs: ${analysis.paragraphCount} | Headings: ${analysis.headingCount}`);
    console.log(`      Images: ${analysis.imageCount} | Links: ${analysis.linkCount}`);
    console.log(`      Readability: ${analysis.readabilityScore.toFixed(1)}/100`);
    if (analysis.issues.length > 0) {
      console.log(`      Issues: ${analysis.issues.length}`);
    }
    console.log('');
  });

  // Pages with issues
  const pagesWithIssues = analyses.filter(a => a.issues.length > 0);
  if (pagesWithIssues.length > 0) {
    console.log(`⚠️  Pages with Issues (${pagesWithIssues.length}):\n`);
    pagesWithIssues.forEach((analysis) => {
      console.log(`   ${analysis.file}:`);
      analysis.issues.forEach((issue) => {
        console.log(`      - ${issue}`);
      });
      console.log('');
    });
  }

  // Keyword analysis
  console.log('🔑 Top Keywords Across All Pages:\n');
  const allKeywords = new Map<string, number>();
  analyses.forEach((analysis) => {
    analysis.keywordDensity.forEach((density, keyword) => {
      allKeywords.set(keyword, (allKeywords.get(keyword) || 0) + density);
    });
  });
  
  const topKeywords = Array.from(allKeywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  
  topKeywords.forEach(([keyword, density], idx) => {
    console.log(`   ${idx + 1}. ${keyword}: ${density.toFixed(2)}%`);
  });

  // Generate detailed report
  let report = `# Content Analysis Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- Total pages: ${analyses.length}\n`;
  report += `- Average word count: ${Math.round(analyses.reduce((sum, a) => sum + a.wordCount, 0) / analyses.length)}\n`;
  report += `- Pages with issues: ${pagesWithIssues.length}\n\n`;
  
  report += `## Detailed Analysis\n\n`;
  analyses.forEach((analysis) => {
    report += `### ${analysis.file}\n\n`;
    report += `- **URL**: ${analysis.url}\n`;
    report += `- **Title**: ${analysis.title}\n`;
    report += `- **Word Count**: ${analysis.wordCount}\n`;
    report += `- **Character Count**: ${analysis.characterCount}\n`;
    report += `- **Paragraphs**: ${analysis.paragraphCount}\n`;
    report += `- **Headings**: ${analysis.headingCount}\n`;
    report += `- **Images**: ${analysis.imageCount}\n`;
    report += `- **Links**: ${analysis.linkCount}\n`;
    report += `- **Readability Score**: ${analysis.readabilityScore.toFixed(1)}/100\n\n`;
    
    if (analysis.keywordDensity.size > 0) {
      report += `**Top Keywords:**\n`;
      Array.from(analysis.keywordDensity.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([keyword, density]) => {
          report += `- ${keyword}: ${density.toFixed(2)}%\n`;
        });
      report += `\n`;
    }
    
    if (analysis.issues.length > 0) {
      report += `**Issues:**\n`;
      analysis.issues.forEach((issue) => {
        report += `- ${issue}\n`;
      });
      report += `\n`;
    }
  });

  const reportPath = join(projectRoot, 'docs', 'CONTENT-ANALYSIS-REPORT.md');
  writeFileSync(reportPath, report, 'utf-8');

  console.log(`\n📄 Full report: ${reportPath}\n`);
  console.log('💡 Content Best Practices:');
  console.log('   - Aim for 300+ words per page');
  console.log('   - Use headings to structure content');
  console.log('   - Include images for engagement');
  console.log('   - Add internal links (3+ per page)');
  console.log('   - Maintain readability score above 60\n');
}

// Run analysis
analyzeContent();

export { analyzeContent };

