/**
 * Critical CSS Extraction Script
 * Extracts above-the-fold CSS for inlining in <head>
 * Improves First Contentful Paint (FCP) and Largest Contentful Paint (LCP)
 *
 * Usage: npm run extract-critical-css
 */

import { readFile, writeFile } from 'fs/promises';
import { dirname } from 'path';
import { existsSync } from 'fs';

/**
 * Critical CSS selectors - above-the-fold content
 * These are the styles needed for initial render
 */
const CRITICAL_SELECTORS = [
  // Reset and base
  '*',
  'html',
  'body',
  ':root',

  // Variables (always critical)
  '[class*="variables"]',

  // Typography - headings and text visible above fold
  'h1',
  'h2',
  'h3',
  'p',
  '.logo',
  '.subtitle',

  // Layout - container and header
  '.container',
  '.header',
  '.header-left',
  '.header-right',
  '.brand-logo',
  '.top-left-heading',

  // Navigation - stoplight menu
  '.stoplight-container',
  '.stoplight',
  '.stoplight-dot',

  // Background
  'body::before',

  // Skip link
  '.skip-link',

  // Focus indicators (accessibility)
  ':focus-visible',

  // Font loading states
  'body.fonts-loading',
  'body.fonts-loaded',
];

/**
 * CSS files to process
 */
const CSS_FILES = [
  'warmthly/lego/styles/variables.css',
  'warmthly/lego/styles/base.css',
  'warmthly/lego/styles/components.css',
];

/**
 * Output file for critical CSS
 */
const OUTPUT_FILE = 'warmthly/lego/styles/critical.css';

/**
 * Extract critical CSS from a CSS file
 */
async function extractCriticalCSS(cssContent: string): Promise<string> {
  // Simple extraction: get CSS rules that match critical selectors
  // In a production setup, you'd use a tool like critical or penthouse
  const lines = cssContent.split('\n');
  const criticalLines: string[] = [];
  let inRule = false;
  let currentSelector = '';
  let ruleContent: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines in critical CSS (we'll minify later)
    if (trimmed.startsWith('/*') || trimmed.startsWith('//') || trimmed === '') {
      continue;
    }

    // Check if line contains a selector
    if (trimmed.includes('{') && !trimmed.includes('}')) {
      // Start of a rule
      inRule = true;
      currentSelector = trimmed.split('{')[0].trim();
      ruleContent = [trimmed];

      // Check if selector is critical
      const isCritical = CRITICAL_SELECTORS.some(sel => {
        if (sel.includes('*')) return true; // Universal selector
        return (
          currentSelector.includes(sel) ||
          currentSelector.startsWith(sel) ||
          currentSelector.includes(`.${sel}`) ||
          currentSelector.includes(`#${sel}`)
        );
      });

      if (!isCritical) {
        inRule = false;
        currentSelector = '';
        ruleContent = [];
      }
    } else if (inRule) {
      ruleContent.push(line);

      if (trimmed.includes('}')) {
        // End of rule
        criticalLines.push(...ruleContent);
        criticalLines.push(''); // Add spacing
        inRule = false;
        currentSelector = '';
        ruleContent = [];
      }
    } else if (trimmed.includes('@')) {
      // Media queries, imports, etc. - include variables and keyframes
      if (trimmed.includes('@media') && trimmed.includes('prefers-color-scheme')) {
        // Include dark mode variables
        criticalLines.push(line);
      } else if (trimmed.includes('@keyframes') || trimmed.includes('@font-face')) {
        // Include animations and fonts
        criticalLines.push(line);
        let atRuleContent = [line];
        let braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;

        // Continue reading until rule closes
        const remainingLines = lines.slice(lines.indexOf(line) + 1);
        for (const remainingLine of remainingLines) {
          atRuleContent.push(remainingLine);
          braceCount +=
            (remainingLine.match(/{/g) || []).length - (remainingLine.match(/}/g) || []).length;
          if (braceCount === 0) {
            criticalLines.push(...atRuleContent.slice(1));
            break;
          }
        }
      }
    }
  }

  return criticalLines.join('\n');
}

/**
 * Generate critical CSS file
 */
async function generateCriticalCSS(): Promise<void> {
  console.log('🎨 Extracting critical CSS...\n');

  let allCriticalCSS = '';

  // Process each CSS file
  for (const cssFile of CSS_FILES) {
    if (!existsSync(cssFile)) {
      console.warn(`⚠ File not found: ${cssFile}`);
      continue;
    }

    try {
      const content = await readFile(cssFile, 'utf-8');
      const critical = await extractCriticalCSS(content);
      allCriticalCSS += `/* Critical CSS from ${cssFile} */\n${critical}\n\n`;
      console.log(`✓ Processed: ${cssFile}`);
    } catch (error) {
      console.error(`✗ Error processing ${cssFile}:`, error);
    }
  }

  // Add header comment
  const header = `/* Critical CSS - Above-the-fold styles
 * Auto-generated - do not edit manually
 * Regenerate with: npm run extract-critical-css
 * 
 * This CSS is inlined in <head> for faster initial render.
 * Non-critical CSS is loaded asynchronously.
 */
`;

  const output = header + allCriticalCSS;

  // Ensure output directory exists
  const outputDir = dirname(OUTPUT_FILE);
  if (!existsSync(outputDir)) {
    console.error(`✗ Output directory does not exist: ${outputDir}`);
    return;
  }

  // Write critical CSS file
  try {
    await writeFile(OUTPUT_FILE, output, 'utf-8');
    console.log(`\n✅ Critical CSS written to: ${OUTPUT_FILE}`);
    console.log(`   Size: ${(output.length / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error(`✗ Failed to write critical CSS:`, error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateCriticalCSS().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { generateCriticalCSS, extractCriticalCSS };
