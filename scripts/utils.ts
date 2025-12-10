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
        console.warn(
          `Warning: Could not access ${filePath}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  } catch (error) {
    console.warn(
      `Warning: Could not read directory ${dir}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return fileList;
}

/**
 * Extract text content from HTML
 * Shared utility for content extraction
 * SECURITY: Uses Cheerio HTML parser instead of regex to prevent XSS bypasses
 * This properly handles malformed HTML, nested tags, and all edge cases that regex cannot
 */
import { load } from 'cheerio';

export function extractTextContent(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    // Cheerio safely parses the HTML into a Document Object Model (DOM) structure
    // This is far more secure and reliable than regex-based stripping
    const $ = load(html);

    // Remove dangerous elements structurally (far more reliable than regex)
    // This handles malformed tags, nested structures, and all edge cases
    $('script, style, iframe, object, embed, noscript, form').remove();

    // Remove all event handler attributes (onclick, onerror, etc.)
    $('*').each(function () {
      const element = $(this);
      // Remove all attributes that start with 'on' (event handlers)
      const attrs = element.attr();
      if (attrs) {
        Object.keys(attrs).forEach(attr => {
          if (attr.toLowerCase().startsWith('on')) {
            element.removeAttr(attr);
          }
        });
      }
    });

    // Get the clean text from the body and normalize whitespace
    // This automatically handles all Unicode characters, nested tags, and malformed HTML
    const text = $('body').text() || $.text();
    return text
      .replace(/[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+/gu, ' ')
      .trim();
  } catch (error) {
    // Fallback: if parsing fails, return empty string rather than potentially unsafe content
    console.warn(
      '[extractTextContent] Failed to parse HTML:',
      error instanceof Error ? error.message : String(error)
    );
    return '';
  }
}

/**
 * Get URL from file path
 * Shared utility for URL generation
 */
export function getUrlFromPath(filePath: string, projectRoot: string): string {
  const relative = filePath.replace(projectRoot, '').replace(/\\/g, '/');

  if (relative.includes('/apps/main/')) {
    const path = relative.replace('/apps/main', '');
    if (path === '/index.html' || path === '/') {
      return 'https://www.warmthly.org/';
    }
    const cleanPath = path.includes('/index.html') ? path.replace('/index.html', '/') : path;
    return `https://www.warmthly.org${cleanPath}`;
  }

  if (relative.includes('/apps/mint/')) {
    const path = relative.replace('/apps/mint', '');
    if (path === '/index.html' || path === '/') {
      return 'https://mint.warmthly.org/';
    }
    const cleanPath = path.includes('/index.html') ? path.replace('/index.html', '/') : path;
    return `https://mint.warmthly.org${cleanPath}`;
  }

  if (relative.includes('/apps/post/')) {
    const path = relative.replace('/apps/post', '');
    if (path === '/index.html' || path === '/') {
      return 'https://post.warmthly.org/';
    }
    const cleanPath = path.includes('/index.html') ? path.replace('/index.html', '/') : path;
    return `https://post.warmthly.org${cleanPath}`;
  }

  if (relative.includes('/apps/admin/')) {
    const path = relative.replace('/apps/admin', '');
    if (path === '/index.html' || path === '/') {
      return 'https://admin.warmthly.org/';
    }
    const cleanPath = path.includes('/index.html') ? path.replace('/index.html', '/') : path;
    return `https://admin.warmthly.org${cleanPath}`;
  }

  return relative;
}
