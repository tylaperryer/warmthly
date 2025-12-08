/**
 * Shared utilities for scripts
 */

import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

/**
 * Find all HTML files recursively
 * Shared utility to avoid code duplication
 */
export function findHTMLFiles(dir: string, fileList: string[] = []): string[] {
  try {
    const files = readdirSync(dir);

    files.forEach((file: string) => {
      const filePath = join(dir, file);
      try {
        const stat = statSync(filePath);

        if (stat.isDirectory()) {
          if (
            !file.startsWith('.') &&
            file !== 'node_modules' &&
            file !== 'dist' &&
            file !== 'build'
          ) {
            findHTMLFiles(filePath, fileList);
          }
        } else if (extname(file) === '.html') {
          fileList.push(filePath);
        }
      } catch (error) {
        // Skip files/directories we can't access
        console.warn(`Warning: Could not access ${filePath}: ${error}`);
      }
    });
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}: ${error}`);
  }

  return fileList;
}

/**
 * Extract text content from HTML
 * Shared utility for content extraction
 */
export function extractTextContent(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  // Improved regex to handle multi-byte characters and nested tags
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?<\/embed>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Get URL from file path
 * Shared utility for URL generation
 */
export function getUrlFromPath(
  filePath: string,
  projectRoot: string
): string {
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
    return `https://mint.warmthly.org${path.replace('/index.html', '/')}`;
  }

  if (relative.includes('/apps/post/')) {
    const path = relative.replace('/apps/post', '');
    if (path === '/index.html' || path === '/') {
      return 'https://post.warmthly.org/';
    }
    return `https://post.warmthly.org${path.replace('/index.html', '/')}`;
  }

  if (relative.includes('/apps/admin/')) {
    const path = relative.replace('/apps/admin', '');
    if (path === '/index.html' || path === '/') {
      return 'https://admin.warmthly.org/';
    }
    return `https://admin.warmthly.org${path.replace('/index.html', '/')}`;
  }

  return relative;
}

