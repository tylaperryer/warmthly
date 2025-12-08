/**
 * Prefetch Tests
 * Tests for lego/utils/prefetch.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('Link Prefetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.head.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.head.innerHTML = '';
    vi.useRealTimers();
  });

  it('should prefetch a page', async () => {
    const { initLinkPrefetch } = await import('@utils/prefetch.js');

    // Mock document.fonts
    Object.defineProperty(document, 'fonts', {
      value: {
        ready: Promise.resolve(),
      },
      writable: true,
    });

    initLinkPrefetch();

    // Fast-forward time
    vi.advanceTimersByTime(2000);

    const links = document.head.querySelectorAll('link[rel="prefetch"]');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should handle missing document', async () => {
    const originalDocument = (globalThis as any).document;
    (globalThis as any).document = undefined;

    const { initLinkPrefetch } = await import('@utils/prefetch.js');
    expect(() => initLinkPrefetch()).not.toThrow();

    (globalThis as any).document = originalDocument;
  });

  it('should prefetch on link hover', async () => {
    const { initLinkPrefetch } = await import('@utils/prefetch.js');

    Object.defineProperty(document, 'fonts', {
      value: {
        ready: Promise.resolve(),
      },
      writable: true,
    });

    initLinkPrefetch();

    const link = document.createElement('a');
    link.href = '/test.html';
    document.body.appendChild(link);

    const mouseEvent = new MouseEvent('mouseover', { bubbles: true });
    link.dispatchEvent(mouseEvent);

    await new Promise(resolve => setTimeout(resolve, 100));

    const prefetchLinks = document.head.querySelectorAll('link[rel="prefetch"][href="/test.html"]');
    expect(prefetchLinks.length).toBeGreaterThan(0);
  });
});
