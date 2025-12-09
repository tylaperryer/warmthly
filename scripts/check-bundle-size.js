#!/usr/bin/env node
/**
 * Bundle Size Monitoring Script
 * Checks bundle sizes against performance budgets
 * Used in CI to prevent bundle size regressions
 */

import { readFileSync, statSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Performance budgets (in KB)
// These match the budgets mentioned in README: 500KB JS, 100KB CSS, 2MB total
const BUDGETS = {
  // JavaScript budgets
  js: {
    maxInitial: 500, // Max initial JS bundle (500KB) - matches README
    maxTotal: 2000, // Max total JS across all chunks (2MB) - matches README
    maxChunk: 1000, // Max individual chunk size (1MB) - warning threshold
  },
  // CSS budgets
  css: {
    maxTotal: 100, // Max total CSS (100KB)
    maxFile: 50, // Max individual CSS file (50KB)
  },
  // Image budgets
  images: {
    maxFile: 200, // Max individual image (200KB)
    maxTotal: 1000, // Max total images (1MB)
  },
  // Font budgets
  fonts: {
    maxFile: 150, // Max individual font file (150KB)
    maxTotal: 300, // Max total fonts (300KB)
  },
  // HTML budgets
  html: {
    maxFile: 50, // Max individual HTML file (50KB)
  },
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

/**
 * Format bytes to KB
 */
function formatKB(bytes) {
  return (bytes / 1024).toFixed(2);
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
  try {
    const stats = statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Recursively get all files in directory
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  try {
    const files = readdirSync(dirPath, { withFileTypes: true });

    files.forEach(file => {
      const filePath = join(dirPath, file.name);
      if (file.isDirectory()) {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      } else {
        arrayOfFiles.push(filePath);
      }
    });
  } catch (error) {
    // Directory doesn't exist or can't be read
  }

  return arrayOfFiles;
}

/**
 * Check bundle sizes
 */
function checkBundleSizes(buildDir = 'dist') {
  const buildPath = join(__dirname, '..', buildDir);

  console.log(`${colors.blue}📦 Bundle Size Analysis${colors.reset}`);
  console.log(`Checking: ${buildPath}\n`);

  if (!statSync(buildPath).isDirectory()) {
    console.error(`${colors.red}❌ Build directory not found: ${buildPath}${colors.reset}`);
    process.exit(1);
  }

  const allFiles = getAllFiles(buildPath);
  const issues = [];
  const stats = {
    js: { files: [], total: 0, chunks: [] },
    css: { files: [], total: 0 },
    images: { files: [], total: 0 },
    fonts: { files: [], total: 0 },
    html: { files: [], total: 0 },
  };

  // Categorize and analyze files
  allFiles.forEach(filePath => {
    const size = getFileSize(filePath);
    const relativePath = filePath.replace(buildPath + '/', '');
    const ext = relativePath.split('.').pop()?.toLowerCase();

    if (ext === 'js') {
      stats.js.files.push({ path: relativePath, size });
      stats.js.total += size;

      // Check for chunk files
      if (relativePath.includes('assets/') && relativePath.includes('-')) {
        stats.js.chunks.push({ path: relativePath, size });
      }
    } else if (ext === 'css') {
      stats.css.files.push({ path: relativePath, size });
      stats.css.total += size;
    } else if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) {
      stats.images.files.push({ path: relativePath, size });
      stats.images.total += size;
    } else if (['ttf', 'otf', 'woff', 'woff2', 'eot'].includes(ext)) {
      stats.fonts.files.push({ path: relativePath, size });
      stats.fonts.total += size;
    } else if (ext === 'html') {
      stats.html.files.push({ path: relativePath, size });
      stats.html.total += size;
    }
  });

  // Check JavaScript budgets
  console.log(`${colors.blue}JavaScript Analysis:${colors.reset}`);
  const jsTotalKB = formatKB(stats.js.total);
  console.log(`  Total JS: ${jsTotalKB} KB (${stats.js.files.length} files)`);

  if (stats.js.total > BUDGETS.js.maxTotal * 1024) {
    issues.push({
      type: 'js',
      message: `Total JS exceeds budget: ${jsTotalKB} KB > ${BUDGETS.js.maxTotal} KB`,
      severity: 'error',
    });
    console.log(`  ${colors.red}❌ Total JS exceeds budget${colors.reset}`);
  } else {
    console.log(`  ${colors.green}✓ Total JS within budget${colors.reset}`);
  }

  // Check individual chunks
  stats.js.chunks.forEach(chunk => {
    const chunkKB = formatKB(chunk.size);
    if (chunk.size > BUDGETS.js.maxChunk * 1024) {
      issues.push({
        type: 'js',
        message: `Chunk exceeds budget: ${chunk.path} (${chunkKB} KB > ${BUDGETS.js.maxChunk} KB)`,
        severity: 'warning',
      });
      console.log(
        `  ${colors.yellow}⚠ Chunk exceeds budget: ${chunk.path} (${chunkKB} KB)${colors.reset}`
      );
    }
  });

  // Check CSS budgets
  console.log(`\n${colors.blue}CSS Analysis:${colors.reset}`);
  const cssTotalKB = formatKB(stats.css.total);
  console.log(`  Total CSS: ${cssTotalKB} KB (${stats.css.files.length} files)`);

  if (stats.css.total > BUDGETS.css.maxTotal * 1024) {
    issues.push({
      type: 'css',
      message: `Total CSS exceeds budget: ${cssTotalKB} KB > ${BUDGETS.css.maxTotal} KB`,
      severity: 'error',
    });
    console.log(`  ${colors.red}❌ Total CSS exceeds budget${colors.reset}`);
  } else {
    console.log(`  ${colors.green}✓ Total CSS within budget${colors.reset}`);
  }

  stats.css.files.forEach(file => {
    const fileKB = formatKB(file.size);
    if (file.size > BUDGETS.css.maxFile * 1024) {
      issues.push({
        type: 'css',
        message: `CSS file exceeds budget: ${file.path} (${fileKB} KB > ${BUDGETS.css.maxFile} KB)`,
        severity: 'warning',
      });
      console.log(
        `  ${colors.yellow}⚠ File exceeds budget: ${file.path} (${fileKB} KB)${colors.reset}`
      );
    }
  });

  // Check font budgets
  console.log(`\n${colors.blue}Font Analysis:${colors.reset}`);
  const fontTotalKB = formatKB(stats.fonts.total);
  console.log(`  Total Fonts: ${fontTotalKB} KB (${stats.fonts.files.length} files)`);

  if (stats.fonts.total > BUDGETS.fonts.maxTotal * 1024) {
    issues.push({
      type: 'fonts',
      message: `Total fonts exceed budget: ${fontTotalKB} KB > ${BUDGETS.fonts.maxTotal} KB`,
      severity: 'warning',
    });
    console.log(`  ${colors.yellow}⚠ Total fonts exceed budget${colors.reset}`);
  } else {
    console.log(`  ${colors.green}✓ Total fonts within budget${colors.reset}`);
  }

  stats.fonts.files.forEach(file => {
    const fileKB = formatKB(file.size);
    if (file.size > BUDGETS.fonts.maxFile * 1024) {
      issues.push({
        type: 'fonts',
        message: `Font file exceeds budget: ${file.path} (${fileKB} KB > ${BUDGETS.fonts.maxFile} KB)`,
        severity: 'warning',
      });
      console.log(
        `  ${colors.yellow}⚠ Font exceeds budget: ${file.path} (${fileKB} KB)${colors.reset}`
      );
    }
  });

  // Summary
  console.log(`\n${colors.blue}📊 Summary:${colors.reset}`);
  console.log(`  Total files analyzed: ${allFiles.length}`);
  console.log(`  JS files: ${stats.js.files.length} (${jsTotalKB} KB)`);
  console.log(`  CSS files: ${stats.css.files.length} (${cssTotalKB} KB)`);
  console.log(`  Font files: ${stats.fonts.files.length} (${fontTotalKB} KB)`);
  console.log(`  Image files: ${stats.images.files.length} (${formatKB(stats.images.total)} KB)`);
  console.log(`  HTML files: ${stats.html.files.length} (${formatKB(stats.html.total)} KB)`);

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  if (errors.length > 0) {
    console.log(`\n${colors.red}❌ Found ${errors.length} error(s):${colors.reset}`);
    errors.forEach(issue => {
      console.log(`  - ${issue.message}`);
    });
  }

  if (warnings.length > 0) {
    console.log(`\n${colors.yellow}⚠ Found ${warnings.length} warning(s):${colors.reset}`);
    warnings.forEach(issue => {
      console.log(`  - ${issue.message}`);
    });
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log(`\n${colors.green}✅ All bundle sizes within budget!${colors.reset}`);
    return 0;
  }

  // Exit with error code if there are critical issues
  if (errors.length > 0) {
    console.log(`\n${colors.red}❌ Bundle size check failed${colors.reset}`);
    return 1;
  }

  return 0;
}

// Run if called directly
// Check if this file is being run directly (not imported)
const isMainModule = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` ||
  process.argv[1]?.endsWith('check-bundle-size.js');

if (isMainModule) {
  // Phase 4 Issue 4.2: Add input validation for script arguments
  (async () => {
    const buildDir = process.argv[2] || 'dist';
    
    // Validate build directory path to prevent path traversal
    const path = await import('path');
    const resolvedPath = path.resolve(buildDir);
    const projectRoot = path.resolve(process.cwd());
    
    // Ensure build directory is within project root
    if (!resolvedPath.startsWith(projectRoot)) {
      console.error(`❌ Error: Build directory must be within project root: ${projectRoot}`);
      process.exit(1);
    }
    
    // Additional validation: ensure it's a valid directory name
    if (buildDir.includes('..') || buildDir.includes('/') || buildDir.includes('\\')) {
      console.error(`❌ Error: Invalid build directory name: ${buildDir}`);
      process.exit(1);
    }
    
    const exitCode = checkBundleSizes(buildDir);
    process.exit(exitCode);
  })();
}

export { checkBundleSizes, BUDGETS };
