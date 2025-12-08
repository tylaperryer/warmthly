/**
 * HTML Sanitization Utilities
 * Safe alternatives to innerHTML for preventing XSS attacks
 */

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.textContent || '';
}

/**
 * Escape HTML attribute values
 */
export function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Escape URL to prevent javascript: and data: protocols
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    // Only allow https protocol (HSTS enabled - HTTP is blocked)
    if (parsed.protocol === 'https:') {
      return parsed.href;
    }
    // Fallback to safe relative URL
    return '#';
  } catch {
    // Invalid URL, return safe fallback
    return '#';
  }
}

/**
 * Create element with text content (safe)
 */
export function createTextElement(tag: string, text: string): HTMLElement {
  const element = document.createElement(tag);
  element.textContent = text;
  return element;
}

/**
 * Create element with attributes (safe)
 */
export function createElementWithAttributes(
  tag: string,
  attributes: Record<string, string>,
  textContent?: string
): HTMLElement {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'href' || key === 'src') {
      element.setAttribute(key, sanitizeUrl(value));
    } else {
      element.setAttribute(key, escapeHtmlAttribute(value));
    }
  }

  if (textContent !== undefined) {
    element.textContent = textContent;
  }

  return element;
}

/**
 * Allowed HTML tags for sanitization
 * Only safe, formatting tags are allowed
 */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'span', 'div',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'blockquote', 'code', 'pre'
]);

/**
 * Allowed attributes per tag
 */
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  '*': new Set(['class', 'id', 'title', 'lang', 'dir'])
};

/**
 * Sanitize HTML by removing dangerous elements and attributes
 * Only allows safe formatting tags and removes script, style, and event handlers
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Create a temporary container
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Recursively sanitize nodes
  function sanitizeNode(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.cloneNode(true);
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      // Remove script, style, and other dangerous tags
      if (tagName === 'script' || tagName === 'style' || tagName === 'iframe' || 
          tagName === 'object' || tagName === 'embed' || tagName === 'form') {
        return null;
      }

      // Only allow whitelisted tags
      if (!ALLOWED_TAGS.has(tagName)) {
        // If tag is not allowed, return its text content only
        const textNode = document.createTextNode(element.textContent || '');
        return textNode;
      }

      // Create a new element with the same tag
      const sanitized = document.createElement(tagName);

      // Copy allowed attributes
      // Phase 7: Simplified logic to avoid redundancy
      const tagAttrs = ALLOWED_ATTRIBUTES[tagName] || new Set();
      const globalAttrs = ALLOWED_ATTRIBUTES['*'] || new Set();
      const allAllowedAttrs = new Set([...tagAttrs, ...globalAttrs]);

      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        if (!attr) continue;
        const attrName = attr.name.toLowerCase();

        // Skip event handlers and dangerous attributes
        if (attrName.startsWith('on') || 
            attrName === 'style' || 
            attrName === 'javascript' ||
            attrName === 'data:' ||
            attrName.includes('javascript:')) {
          continue;
        }

        // Only allow whitelisted attributes
        if (allAllowedAttrs.has(attrName)) {
          // Sanitize href and src attributes
          if (attrName === 'href' || attrName === 'src') {
            const sanitizedUrl = sanitizeUrl(attr.value);
            sanitized.setAttribute(attrName, sanitizedUrl);
          } else {
            sanitized.setAttribute(attrName, escapeHtmlAttribute(attr.value));
          }
        }
      }

      // Recursively sanitize children
      for (let i = 0; i < element.childNodes.length; i++) {
        const childNode = element.childNodes[i];
        if (!childNode) continue;
        const sanitizedChild = sanitizeNode(childNode);
        if (sanitizedChild) {
          sanitized.appendChild(sanitizedChild);
        }
      }

      return sanitized;
    }

    return null;
  }

  // Sanitize all nodes in the temp container
  const sanitizedContainer = document.createElement('div');
  for (let i = 0; i < temp.childNodes.length; i++) {
    const childNode = temp.childNodes[i];
    if (!childNode) continue;
    const sanitized = sanitizeNode(childNode);
    if (sanitized) {
      sanitizedContainer.appendChild(sanitized);
    }
  }

  return sanitizedContainer.innerHTML;
}

/**
 * Safely set innerHTML by parsing and sanitizing
 * Sanitizes HTML to prevent XSS attacks
 * Only allows safe formatting tags (p, strong, em, a, etc.)
 */
export function setSafeHtml(element: HTMLElement, html: string): void {
  if (!html || typeof html !== 'string') {
    element.textContent = '';
    return;
  }

  // Sanitize the HTML
  const sanitized = sanitizeHtml(html);

  // Parse and set sanitized HTML
  const temp = document.createElement('div');
  temp.innerHTML = sanitized;

  // Clear element and move sanitized nodes
  element.textContent = '';
  while (temp.firstChild) {
    element.appendChild(temp.firstChild);
  }
}
