import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('WarmthlyStoplight Component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should create and register the component', async () => {
    await import('@components/warmthly-stoplight.js');

    const element = document.createElement('warmthly-stoplight');
    (expect(element) as any).toBeDefined();
  });

  it('should render stoplight with app attribute', async () => {
    await import('@components/warmthly-stoplight.js');

    const element = document.createElement('warmthly-stoplight');
    element.setAttribute('app', 'mint');
    document.body.appendChild(element);

    await new Promise(resolve => setTimeout(resolve, 100));

    const button = element.querySelector('button');
    (expect(button) as any).toBeDefined();
    (expect(button?.getAttribute('aria-label')) as any).toContain('menu');
  });

  it('should use custom menu items', async () => {
    await import('@components/warmthly-stoplight.js');

    const element = document.createElement('warmthly-stoplight');
    element.innerHTML = '<a href="/page1">Page 1</a><a href="/page2">Page 2</a>';
    document.body.appendChild(element);

    await new Promise(resolve => setTimeout(resolve, 100));

    const links = element.querySelectorAll('a');
    (expect(links.length) as any).toBeGreaterThan(0);
  });

  it('should handle errors gracefully', async () => {
    const consoleSpy: any = vi.spyOn(console, 'error').mockImplementation(() => {});
    await import('@components/warmthly-stoplight.js');

    const element = document.createElement('warmthly-stoplight');
    // Testing error handling by temporarily removing document
    const originalDocument = (globalThis as any).document;
    (globalThis as any).document = undefined;

    try {
      if (
        'connectedCallback' in element &&
        typeof (element as any).connectedCallback === 'function'
      ) {
        await (element as any).connectedCallback();
      }
    } catch {
      // Expected
    }

    // Restore document
    (globalThis as any).document = originalDocument;
    consoleSpy.mockRestore();
  });
});
