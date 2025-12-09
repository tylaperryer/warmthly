/**
 * Internal Linking Suggestions
 * Analyzes content and suggests relevant internal links
 *
 * Usage: npm run suggest:internal-links
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface LinkSuggestion {
  file: string;
  line: number;
  context: string;
  suggestedLink: {
    text: string;
    url: string;
    reason: string;
    relevance: number; // 0-1
  };
}

interface PageContent {
  file: string;
  url: string;
  title: string;
  keywords: string[];
  content: string;
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
 * Extract keywords from content
 */
function extractKeywords(content: string, title: string): string[] {
  const keywords: string[] = [];

  // Extract from title
  const titleWords = title.toLowerCase().match(/\b\w{4,}\b/g) || [];
  keywords.push(...titleWords);

  // Extract from headings - improved to handle multi-byte characters
  const headings = content.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/giu) || [];
  headings.forEach(heading => {
    // Remove all HTML tags, not just first level - Unicode-aware
    let text = heading.replace(/<\/?[a-z][\s\S]*?>/giu, '').toLowerCase();
    // Handle multi-byte word boundaries better
    const words = text.match(/[\p{L}\p{N}]{4,}/gu) || [];
    keywords.push(...words);
  });

  // Extract from strong/em tags - improved to handle multi-byte characters
  const emphasis = content.match(/<(strong|em|b)[^>]*>([\s\S]*?)<\/(strong|em|b)>/giu) || [];
  emphasis.forEach(em => {
    // Remove all HTML tags, not just first level - Unicode-aware
    let text = em.replace(/<\/?[a-z][\s\S]*?>/giu, '').toLowerCase();
    // Handle multi-byte word boundaries better
    const words = text.match(/[\p{L}\p{N}]{4,}/gu) || [];
    keywords.push(...words);
  });

  // Remove duplicates and common words
  const commonWords = [
    'this',
    'that',
    'with',
    'from',
    'have',
    'will',
    'your',
    'their',
    'there',
    'these',
    'those',
  ];
  const unique = [...new Set(keywords)].filter(w => !commonWords.includes(w));

  return unique.slice(0, 20); // Top 20 keywords
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
    return `https://www.warmthly.org${path.replace('/index.html', '/')}`;
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
    // Only replace if the substring exists
    const cleanPath = path.includes('/index.html') ? path.replace('/index.html', '/') : path;
    return `https://post.warmthly.org${cleanPath}`;
  }

  return relative;
}

/**
 * Extract text content from HTML
 */
function extractTextContent(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  // Unicode-aware regex to handle multi-byte characters and nested tags
  // Use Unicode flag (u) for proper multi-character support
  return html
    .replace(/<script[\s\S]*?<\/script>/giu, '')
    .replace(/<style[\s\S]*?<\/style>/giu, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/giu, '')
    .replace(/<object[\s\S]*?<\/object>/giu, '')
    .replace(/<embed[\s\S]*?<\/embed>/giu, '')
    .replace(/<\/?[a-z][\s\S]*?>/giu, ' ')
    .replace(/[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+/gu, ' ')
    .trim();
}

/**
 * Calculate relevance score between content and potential link
 */
function calculateRelevance(
  sourceKeywords: string[],
  sourceContent: string,
  targetKeywords: string[],
  targetTitle: string
): number {
  let score = 0;

  // Keyword overlap
  const keywordOverlap = sourceKeywords.filter(k => targetKeywords.includes(k)).length;
  score += (keywordOverlap / Math.max(sourceKeywords.length, targetKeywords.length)) * 0.4;

  // Title relevance
  const titleWords = targetTitle.toLowerCase().split(/\s+/);
  const titleMatches = sourceKeywords.filter(k =>
    titleWords.some(tw => tw.includes(k) || k.includes(tw))
  ).length;
  score += (titleMatches / Math.max(sourceKeywords.length, titleWords.length)) * 0.3;

  // Content similarity (simple word overlap)
  const sourceWords = new Set(sourceContent.toLowerCase().match(/\b\w{4,}\b/g) || []);
  const targetWords = new Set(targetTitle.toLowerCase().match(/\b\w{4,}\b/g) || []);
  const wordOverlap = [...sourceWords].filter(w => targetWords.has(w)).length;
  score += (wordOverlap / Math.max(sourceWords.size, targetWords.size)) * 0.3;

  return Math.min(score, 1);
}

/**
 * Generate link suggestions
 */
function generateSuggestions(): void {
  console.log('🔗 Generating internal linking suggestions...\n');

  const appsDir = join(projectRoot, 'apps');
  const htmlFiles = findHTMLFiles(appsDir);

  console.log(`Found ${htmlFiles.length} HTML files to analyze\n`);

  // Build page index
  const pages: PageContent[] = [];
  htmlFiles.forEach(file => {
    const content = readFileSync(file, 'utf-8');
    const textContent = extractTextContent(content);
    const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : basename(file, '.html');

    pages.push({
      file: file.replace(projectRoot, '').replace(/\\/g, '/'),
      url: getUrlFromPath(file),
      title: title || basename(file, '.html'),
      keywords: extractKeywords(content, title || basename(file, '.html')),
      content: textContent,
    });
  });

  // Generate suggestions
  const suggestions: LinkSuggestion[] = [];

  pages.forEach(sourcePage => {
    const sourceContent = readFileSync(join(projectRoot, sourcePage.file), 'utf-8');
    const lines = sourceContent.split('\n');

    // Find potential link insertion points (paragraphs, list items)
    lines.forEach((line, index) => {
      // Skip if line already has links
      if (/<a[^>]*href/i.test(line)) return;

      // Look for paragraphs or list items with substantial content
      if (/<p[^>]*>[\s\S]{50,}/i.test(line) || /<li[^>]*>[\s\S]{30,}/i.test(line)) {
        const lineText = extractTextContent(line);

        // Find best matching pages
        const candidates = pages
          .filter(p => p.url !== sourcePage.url)
          .map(targetPage => ({
            page: targetPage,
            relevance: calculateRelevance(
              sourcePage.keywords,
              sourcePage.content,
              targetPage.keywords,
              targetPage.title
            ),
          }))
          .filter(c => c.relevance > 0.3) // Minimum relevance threshold
          .sort((a, b) => b.relevance - a.relevance)
          .slice(0, 3); // Top 3 candidates

        candidates.forEach(candidate => {
          const { page, relevance } = candidate;

          // Generate suggestion reason
          const commonKeywords = sourcePage.keywords.filter(k => page.keywords.includes(k));
          const reason =
            commonKeywords.length > 0
              ? `Shared keywords: ${commonKeywords.slice(0, 3).join(', ')}`
              : `Related topic: ${page.title}`;

          suggestions.push({
            file: sourcePage.file,
            line: index + 1,
            context: lineText.substring(0, 100) + '...',
            suggestedLink: {
              text: page.title,
              url: page.url,
              reason,
              relevance,
            },
          });
        });
      }
    });
  });

  // Filter and sort suggestions
  const filteredSuggestions = suggestions
    .filter(s => s.suggestedLink.relevance > 0.4) // Only high-relevance suggestions
    .sort((a, b) => b.suggestedLink.relevance - a.suggestedLink.relevance)
    .slice(0, 50); // Top 50 suggestions

  // Generate report
  if (filteredSuggestions.length === 0) {
    console.log('✅ No internal linking suggestions at this time.\n');
    return;
  }

  console.log(`💡 Generated ${filteredSuggestions.length} internal linking suggestions\n`);

  // Group by file
  const suggestionsByFile = new Map<string, LinkSuggestion[]>();
  filteredSuggestions.forEach(suggestion => {
    const fileSuggestions = suggestionsByFile.get(suggestion.file) || [];
    fileSuggestions.push(suggestion);
    suggestionsByFile.set(suggestion.file, fileSuggestions);
  });

  let report = `# Internal Linking Suggestions\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `Total suggestions: ${filteredSuggestions.length}\n\n`;

  suggestionsByFile.forEach((fileSuggestions, file) => {
    report += `## ${file}\n\n`;
    fileSuggestions.forEach((suggestion, idx) => {
      report += `### Suggestion ${idx + 1}\n\n`;
      report += `**Line ${suggestion.line}**\n\n`;
      report += `Context: "${suggestion.context}"\n\n`;
      report += `**Suggested Link:**\n`;
      report += `- Text: "${suggestion.suggestedLink.text}"\n`;
      report += `- URL: ${suggestion.suggestedLink.url}\n`;
      report += `- Reason: ${suggestion.suggestedLink.reason}\n`;
      report += `- Relevance: ${(suggestion.suggestedLink.relevance * 100).toFixed(1)}%\n\n`;
      report += `**HTML Suggestion:**\n`;
      report += `\`\`\`html\n`;
      report += `<!-- Around line ${suggestion.line} -->\n`;
      report += `<a href="${suggestion.suggestedLink.url}">${suggestion.suggestedLink.text}</a>\n`;
      report += `\`\`\`\n\n`;
    });
  });

  const reportPath = join(projectRoot, 'docs', 'INTERNAL-LINKING-SUGGESTIONS.md');
  writeFileSync(reportPath, report, 'utf-8');

  console.log(`📄 Suggestions report: ${reportPath}\n`);
  console.log(`Top suggestions:\n`);
  filteredSuggestions.slice(0, 10).forEach((suggestion, idx) => {
    console.log(`   ${idx + 1}. ${suggestion.file}:${suggestion.line}`);
    console.log(
      `      → ${suggestion.suggestedLink.text} (${(
        suggestion.suggestedLink.relevance * 100
      ).toFixed(1)}% relevance)`
    );
  });
  console.log('');
}

// Run suggestions
generateSuggestions();

export { generateSuggestions };
