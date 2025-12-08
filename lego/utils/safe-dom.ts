/**
 * Safe DOM Manipulation Utilities
 * Prevents XSS attacks by using safe DOM methods instead of innerHTML
 */

import { sanitizeUrl, createElementWithAttributes } from './sanitize.js';

/**
 * Safely create a DOM element with text content
 */
export function createSafeElement(
  tag: string,
  className?: string,
  textContent?: string
): HTMLElement {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (textContent !== undefined) {
    element.textContent = textContent;
  }
  return element;
}

/**
 * Safely create a link element
 */
export function createSafeLink(
  href: string,
  text: string,
  className?: string,
  target?: string
): HTMLAnchorElement {
  const link = createElementWithAttributes(
    'a',
    {
      href: sanitizeUrl(href),
      ...(target && { target }),
      ...(className && { class: className }),
    },
    text
  ) as HTMLAnchorElement;
  return link;
}

/**
 * Safely create a div with label and value structure
 */
export function createLabelValuePair(
  label: string,
  value: string | HTMLElement,
  className?: string
): HTMLDivElement {
  const container = document.createElement('div') as HTMLDivElement;
  if (className) {
    container.className = className;
  }
  container.align = '';
  
  const labelEl = createSafeElement('div', 'expense-popup-item-label', label);
  container.appendChild(labelEl);
  
  const valueEl = createSafeElement('div', 'expense-popup-item-value');
  if (typeof value === 'string') {
    valueEl.textContent = value;
  } else {
    valueEl.appendChild(value);
  }
  container.appendChild(valueEl);
  
  return container;
}

/**
 * Safely set HTML content using DOM methods
 * This is a safer alternative to innerHTML for structured content
 */
export function setSafeStructuredContent(
  container: HTMLElement,
  structure: {
    label?: string;
    value?: string | HTMLElement;
    children?: Array<{ label: string; value: string | HTMLElement }>;
  }
): void {
  // Clear container
  container.textContent = '';
  
  if (structure.label && structure.value) {
    const pair = createLabelValuePair(structure.label, structure.value);
    container.appendChild(pair);
  }
  
  if (structure.children) {
    structure.children.forEach((child) => {
      const pair = createLabelValuePair(child.label, child.value);
      container.appendChild(pair);
    });
  }
}

