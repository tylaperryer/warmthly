/**
 * Intersection Observer Tests
 * Tests for lego/utils/intersection-observer.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { initIntersectionObserver } from '@utils/intersection-observer.js';

describe('Intersection Observer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should initialize intersection observer', () => {
    const element = document.createElement('div');
    element.className = 'fade-in';
    document.body.appendChild(element);

    initIntersectionObserver('.fade-in', 'visible');

    expect(element.classList.contains('visible')).toBe(false); // Not visible yet
  });

  it('should handle missing element', () => {
    expect(() => initIntersectionObserver('.non-existent')).not.toThrow();
  });

  it('should handle invalid selector', () => {
    expect(() => initIntersectionObserver('')).not.toThrow();
  });

  it('should use custom className', () => {
    const element = document.createElement('div');
    element.className = 'test-element';
    document.body.appendChild(element);

    initIntersectionObserver('.test-element', 'custom-visible');

    expect(element.classList.contains('custom-visible')).toBe(false);
  });
});

