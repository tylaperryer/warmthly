/**
 * Duplicate Content Detector
 * Detects duplicate or very similar content across pages
 *
 * Usage: npm run detect:duplicate-content
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

import { load } from 'cheerio';

import { extractTextContent } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface ContentFingerprint {
  file: string;
  url: string;
  title: string;
  description: string;
  contentHash: string;
  wordCount: number;
  uniqueWords: Set<string>;
}

interface DuplicateContent {
  file1: string;
  file2: string;
  similarity: number;
  type: 'exact' | 'near' | 'title' | 'description';
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
 * Extract title from HTML
 * SECURITY: Uses Cheerio HTML parser instead of regex to safely extract title
 */
function extractTitle(html: string): string {
  try {
    const $ = load(html);
    const titleElement = $('title').first();
    if (titleElement.length > 0) {
      return titleElement.text().trim();
    }
    return '';
  } catch (error) {
    // Fallback: if parsing fails, return empty string
    console.warn(
      '[extractTitle] Failed to parse HTML:',
      error instanceof Error ? error.message : String(error)
    );
    return '';
  }
}

/**
 * Extract meta description from HTML
 */
function extractDescription(html: string): string {
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  return descMatch && descMatch[1] ? descMatch[1].trim() : '';
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
    // Only replace if the substring exists
    const cleanPath = path.includes('/index.html') ? path.replace('/index.html', '/') : path;
    return `https://www.warmthly.org${cleanPath}`;
  }

  if (relative.includes('/apps/mint/')) {
    const path = relative.replace('/apps/mint', '');
    if (path === '/index.html' || path === '/') {
      return 'https://mint.warmthly.org/';
    }
    // Only replace if the substring exists
    const cleanPath = path.includes('/index.html') ? path.replace('/index.html', '/') : path;
    return `https://mint.warmthly.org${cleanPath}`;
  }

  if (relative.includes('/apps/post/')) {
    const path = relative.replace('/apps/post', '');
    if (path === '/index.html' || path === '/') {
      return 'https://post.warmthly.org/';
    }
    return `https://post.warmthly.org${path.replace('/index.html', '/')}`;
  }

  return relative;
}

/**
 * Calculate content hash
 */
function calculateHash(content: string): string {
  // Simple hash function (for production, consider crypto.createHash)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Calculate similarity between two texts
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().match(/\b\w+\b/g) || []);
  const words2 = new Set(text2.toLowerCase().match(/\b\w+\b/g) || []);

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Detect duplicate content
 */
function detectDuplicateContent(): void {
  console.log('🔍 Detecting duplicate content...\n');

  const appsDir = join(projectRoot, 'apps');
  const htmlFiles = findHTMLFiles(appsDir);

  console.log(`Found ${htmlFiles.length} HTML files to analyze\n`);

  const fingerprints: ContentFingerprint[] = [];

  // Build fingerprints
  htmlFiles.forEach(file => {
    const content = readFileSync(file, 'utf-8');
    const textContent = extractTextContent(content);
    const title = extractTitle(content);
    const description = extractDescription(content);
    const words = textContent.toLowerCase().match(/\b\w+\b/g) || [];

    fingerprints.push({
      file: file.replace(projectRoot, '').replace(/\\/g, '/'),
      url: getUrlFromPath(file),
      title,
      description,
      contentHash: calculateHash(textContent),
      wordCount: words.length,
      uniqueWords: new Set(words),
    });
  });

  // Find duplicates
  const duplicates: DuplicateContent[] = [];

  for (let i = 0; i < fingerprints.length; i++) {
    for (let j = i + 1; j < fingerprints.length; j++) {
      const fp1 = fingerprints[i];
      const fp2 = fingerprints[j];

      if (!fp1 || !fp2) continue;

      // Check for exact content hash match
      if (fp1.contentHash === fp2.contentHash && fp1.wordCount > 100) {
        duplicates.push({
          file1: fp1.file,
          file2: fp2.file,
          similarity: 1.0,
          type: 'exact',
        });
        continue;
      }

      // Check for similar content (high similarity)
      const contentSimilarity = calculateSimilarity(
        Array.from(fp1.uniqueWords).join(' '),
        Array.from(fp2.uniqueWords).join(' ')
      );

      if (contentSimilarity > 0.8 && fp1.wordCount > 100) {
        duplicates.push({
          file1: fp1.file,
          file2: fp2.file,
          similarity: contentSimilarity,
          type: 'near',
        });
      }

      // Check for duplicate titles
      if (fp1.title && fp2.title && fp1.title === fp2.title) {
        duplicates.push({
          file1: fp1.file,
          file2: fp2.file,
          similarity: 1.0,
          type: 'title',
        });
      }

      // Check for duplicate descriptions
      if (fp1.description && fp2.description && fp1.description === fp2.description) {
        duplicates.push({
          file1: fp1.file,
          file2: fp2.file,
          similarity: 1.0,
          type: 'description',
        });
      }
    }
  }

  // Report results
  if (duplicates.length === 0) {
    console.log('✅ No duplicate content detected!\n');
    return;
  }

  console.log(`⚠️  Found ${duplicates.length} duplicate content issue(s):\n`);

  // Group by type
  const exact = duplicates.filter(d => d.type === 'exact');
  const near = duplicates.filter(d => d.type === 'near');
  const title = duplicates.filter(d => d.type === 'title');
  const description = duplicates.filter(d => d.type === 'description');

  if (exact.length > 0) {
    console.log(`❌ Exact Duplicates (${exact.length}):\n`);
    exact.forEach(dup => {
      console.log(`   ${dup.file1}`);
      console.log(`   ${dup.file2}`);
      console.log(`   Recommendation: Consolidate or differentiate content\n`);
    });
  }

  if (near.length > 0) {
    console.log(`⚠️  Near Duplicates (${near.length}):\n`);
    near.forEach(dup => {
      console.log(`   ${dup.file1}`);
      console.log(`   ${dup.file2}`);
      console.log(`   Similarity: ${(dup.similarity * 100).toFixed(1)}%`);
      console.log(`   Recommendation: Differentiate content or use canonical tags\n`);
    });
  }

  if (title.length > 0) {
    console.log(`⚠️  Duplicate Titles (${title.length}):\n`);
    title.forEach(dup => {
      console.log(`   ${dup.file1}`);
      console.log(`   ${dup.file2}`);
      console.log(`   Recommendation: Make titles unique for better SEO\n`);
    });
  }

  if (description.length > 0) {
    console.log(`⚠️  Duplicate Meta Descriptions (${description.length}):\n`);
    description.forEach(dup => {
      console.log(`   ${dup.file1}`);
      console.log(`   ${dup.file2}`);
      console.log(`   Recommendation: Write unique descriptions for each page\n`);
    });
  }

  console.log('\n💡 Recommendations:');
  console.log('   - Use canonical tags for duplicate content');
  console.log('   - Make each page unique and valuable');
  console.log('   - Ensure unique titles and descriptions');
  console.log('   - Consolidate truly duplicate pages\n');

  process.exit(
    duplicates.filter(d => d.type === 'exact' || d.type === 'title' || d.type === 'description')
      .length > 0
      ? 1
      : 0
  );
}

// Run detection
detectDuplicateContent();

export { detectDuplicateContent };
