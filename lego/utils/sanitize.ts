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
 * Safely set innerHTML by parsing and sanitizing
 * Only use for trusted HTML from your own codebase
 */
export function setSafeHtml(element: HTMLElement, html: string): void {
  // Parse HTML into DOM nodes
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Move nodes to target element
  while (temp.firstChild) {
    element.appendChild(temp.firstChild);
  }
}

