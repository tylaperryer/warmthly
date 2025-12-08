import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  escapeHtmlAttribute,
  sanitizeUrl,
  createTextElement,
  createElementWithAttributes,
  setSafeHtml,
} from '@utils/sanitize.js';

describe('Sanitize', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert("xss")&lt;/script&gt;'
      );
      expect(escapeHtml('Hello & World')).toBe('Hello &amp; World');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should handle normal text', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('escapeHtmlAttribute', () => {
    it('should escape attribute values', () => {
      expect(escapeHtmlAttribute('value"with"quotes')).toBe('value&quot;with&quot;quotes');
      expect(escapeHtmlAttribute("value'with'apostrophes")).toBe(
        'value&#x27;with&#x27;apostrophes'
      );
      expect(escapeHtmlAttribute('value<with>tags')).toBe('value&lt;with&gt;tags');
    });
  });

  describe('sanitizeUrl', () => {
    it('should block http URLs (HSTS enabled)', () => {
      expect(sanitizeUrl('http://example.com')).toBe('#');
    });

    it('should allow https URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
    });

    it('should block javascript: URLs', () => {
      expect(sanitizeUrl('javascript:alert("xss")')).toBe('#');
    });

    it('should block data: URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert("xss")</script>')).toBe('#');
    });

    it('should handle relative URLs', () => {
      expect(sanitizeUrl('/path/to/page')).toBe('#');
    });

    it('should handle invalid URLs', () => {
      expect(sanitizeUrl('not a url')).toBe('#');
    });
  });

  describe('createTextElement', () => {
    it('should create element with text content', () => {
      const element = createTextElement('p', 'Hello World');
      expect(element.tagName).toBe('P');
      expect(element.textContent).toBe('Hello World');
    });

    it('should escape HTML in text content', () => {
      const element = createTextElement('p', '<script>alert("xss")</script>');
      expect(element.textContent).toBe('<script>alert("xss")</script>');
      expect(element.innerHTML).not.toContain('<script>');
    });
  });

  describe('createElementWithAttributes', () => {
    it('should create element with attributes', () => {
      const element = createElementWithAttributes(
        'a',
        { href: 'https://example.com', class: 'link' },
        'Click me'
      );
      expect(element.tagName).toBe('A');
      expect(element.getAttribute('href')).toBe('https://example.com/');
      expect(element.getAttribute('class')).toBe('link');
      expect(element.textContent).toBe('Click me');
    });

    it('should sanitize href attribute', () => {
      const element = createElementWithAttributes('a', { href: 'javascript:alert("xss")' });
      expect(element.getAttribute('href')).toBe('#');
    });

    it('should escape attribute values', () => {
      const element = createElementWithAttributes('div', { 'data-value': 'value"with"quotes' });
      expect(element.getAttribute('data-value')).toBe('value&quot;with&quot;quotes');
    });
  });

  describe('setSafeHtml', () => {
    it('should set HTML content', () => {
      const element = document.createElement('div');
      setSafeHtml(element, '<p>Hello</p>');
      expect(element.innerHTML).toBe('<p>Hello</p>');
    });

    it('should handle empty HTML', () => {
      const element = document.createElement('div');
      setSafeHtml(element, '');
      expect(element.innerHTML).toBe('');
    });
  });
});
