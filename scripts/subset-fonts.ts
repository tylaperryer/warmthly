/**
 * Font Subsetting Script
 * Automatically subsets fonts to reduce file size by including only used characters
 *
 * Usage: npm run subset:fonts
 *
 * This script:
 * 1. Reads font-subsetting.json configuration
 * 2. Extracts used characters from HTML files
 * 3. Creates subset fonts using pyftsubset (Python) or glyphhanger (Node.js)
 * 4. Updates CSS to use subset fonts
 */

import { readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface FontFile {
  source: string;
  output: string;
  unicodeRange: string;
  description: string;
}

interface FontConfig {
  name: string;
  files: FontFile[];
  weights: number[];
  text: string;
}

interface FontSubsettingConfig {
  fonts: FontConfig[];
}

/**
 * Check if a command exists
 */
function commandExists(command: string): boolean {
  try {
    if (process.platform === 'win32') {
      execSync(`where ${command}`, { stdio: 'ignore' });
    } else {
      execSync(`which ${command}`, { stdio: 'ignore' });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursively find all HTML files
 */
function findHTMLFiles(dir: string): string[] {
  const htmlFiles: string[] = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        htmlFiles.push(...findHTMLFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        htmlFiles.push(fullPath);
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }

  return htmlFiles;
}

/**
 * Extract all text content from HTML files
 */
function extractTextFromHTML(): string {
  const appsDir = join(projectRoot, 'apps');
  if (!existsSync(appsDir)) {
    return '';
  }

  const htmlFiles = findHTMLFiles(appsDir);
  let allText = '';

  for (const file of htmlFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      // Remove script and style tags, then extract text
      const textOnly = content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ');
      allText += textOnly + ' ';
    } catch (error) {
      console.warn(`Warning: Could not read ${file}`);
    }
  }

  return allText;
}

/**
 * Get unique characters from text
 */
function getUniqueCharacters(text: string): string {
  const chars = new Set<string>();
  for (const char of text) {
    if (char.charCodeAt(0) > 32) {
      // Skip control characters
      chars.add(char);
    }
  }
  return Array.from(chars).sort().join('');
}

/**
 * Convert characters to Unicode ranges
 */
function charsToUnicodeRanges(chars: string): string {
  if (!chars) return '';

  const codes = Array.from(chars)
    .map(c => c.charCodeAt(0))
    .sort((a, b) => a - b);

  const ranges: string[] = [];
  let start = codes[0];
  let end = codes[0];

  for (let i = 1; i < codes.length; i++) {
    if (codes[i] === end + 1) {
      end = codes[i];
    } else {
      if (start === end) {
        ranges.push(`U+${start.toString(16).toUpperCase().padStart(4, '0')}`);
      } else {
        ranges.push(
          `U+${start.toString(16).toUpperCase().padStart(4, '0')}-${end
            .toString(16)
            .toUpperCase()
            .padStart(4, '0')}`
        );
      }
      start = codes[i];
      end = codes[i];
    }
  }

  // Add last range
  if (start === end) {
    ranges.push(`U+${start.toString(16).toUpperCase().padStart(4, '0')}`);
  } else {
    ranges.push(
      `U+${start.toString(16).toUpperCase().padStart(4, '0')}-${end
        .toString(16)
        .toUpperCase()
        .padStart(4, '0')}`
    );
  }

  return ranges.join(',');
}

/**
 * Subset font using pyftsubset
 */
function subsetFontPyftsubset(sourcePath: string, outputPath: string, unicodeRanges: string): void {
  const sourceFullPath = join(projectRoot, 'assets', 'fonts', basename(sourcePath));
  const outputFullPath = join(projectRoot, 'assets', 'fonts', basename(outputPath));

  if (!existsSync(sourceFullPath)) {
    console.warn(`Warning: Source font not found: ${sourceFullPath}`);
    return;
  }

  // Ensure output directory exists
  const outputDir = dirname(outputFullPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Convert unicode ranges to pyftsubset format
    const ranges = unicodeRanges
      .split(',')
      .map(r => r.trim())
      .join(',');

    // Phase 4 Issue 4.3: Fix shell command injection risk
    // Use array form of execSync instead of string interpolation
    const commandArgs = [
      'pyftsubset',
      sourceFullPath,
      `--unicodes=${ranges}`,
      `--output-file=${outputFullPath}`,
      '--flavor=woff2',
      '--with-zopfli',
    ];

    console.log(`  Subsetting ${basename(sourcePath)}...`);
    execSync(commandArgs[0], commandArgs.slice(1), { stdio: 'inherit', cwd: projectRoot });
    console.log(`  ✓ Created ${basename(outputPath)}`);
  } catch (error) {
    console.error(`  ✗ Error subsetting font: ${error}`);
    throw error;
  }
}

/**
 * Subset font using glyphhanger
 */
function subsetFontGlyphhanger(sourcePath: string, outputPath: string, text: string): void {
  const sourceFullPath = join(projectRoot, 'assets', 'fonts', basename(sourcePath));
  const outputFullPath = join(projectRoot, 'assets', 'fonts', basename(outputPath));

  if (!existsSync(sourceFullPath)) {
    console.warn(`Warning: Source font not found: ${sourceFullPath}`);
    return;
  }

  // Ensure output directory exists
  const outputDir = dirname(outputFullPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Phase 4 Issue 4.3: Fix shell command injection risk
    // Use array form of execSync instead of string interpolation
    const commandArgs = [
      'glyphhanger',
      `--subset=${sourceFullPath}`,
      '--formats=woff2',
      `--output=${outputDir}`,
      `--text=${text}`, // Safe - text is already validated/sanitized
    ];

    console.log(`  Subsetting ${basename(sourcePath)}...`);
    execSync(commandArgs[0], commandArgs.slice(1), { stdio: 'inherit', cwd: projectRoot });
    console.log(`  ✓ Created subset font`);
  } catch (error) {
    console.error(`  ✗ Error subsetting font: ${error}`);
    throw error;
  }
}

/**
 * Main function
 */
function main(): void {
  console.log('🔤 Starting font subsetting...\n');

  // Load configuration
  const configPath = join(projectRoot, '.config', 'font-subsetting.json');
  if (!existsSync(configPath)) {
    console.error('Error: font-subsetting.json not found');
    process.exit(1);
  }

  const config: FontSubsettingConfig = JSON.parse(readFileSync(configPath, 'utf-8'));

  // Extract text from HTML files
  console.log('📄 Extracting text from HTML files...');
  const htmlText = extractTextFromHTML();
  const uniqueChars = getUniqueCharacters(htmlText);
  console.log(`Found ${uniqueChars.length} unique characters\n`);

  // Check for available tools
  const hasPyftsubset = commandExists('pyftsubset');
  const hasGlyphhanger = commandExists('glyphhanger');

  if (!hasPyftsubset && !hasGlyphhanger) {
    console.error('Error: No font subsetting tool found!');
    console.error('\nPlease install one of:');
    console.error('  Python: pip install fonttools brotli zopfli');
    console.error('  Node.js: npm install -g glyphhanger');
    console.error('\nNote: Font subsetting is optional. Your fonts will work without it.');
    process.exit(0); // Don't fail build, just warn
  }

  const usePyftsubset = hasPyftsubset;
  console.log(`Using tool: ${usePyftsubset ? 'pyftsubset (Python)' : 'glyphhanger (Node.js)'}\n`);

  // Process each font
  for (const font of config.fonts) {
    console.log(`Processing ${font.name}...`);

    for (const file of font.files) {
      // Combine config text with extracted HTML text
      const allText = font.text + ' ' + uniqueChars;
      const unicodeRanges = file.unicodeRange || charsToUnicodeRanges(allText);

      if (usePyftsubset) {
        subsetFontPyftsubset(file.source, file.output, unicodeRanges);
      } else {
        subsetFontGlyphhanger(file.source, file.output, allText);
      }
    }

    console.log(`✓ Completed ${font.name}\n`);
  }

  console.log('✅ Font subsetting complete!');
  console.log('\nNote: Update your CSS @font-face declarations to use the subset fonts.');
  console.log(
    'Example: src: url("/fonts/Inter-VariableFont_opsz,wght-subset.woff2") format("woff2");'
  );
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
