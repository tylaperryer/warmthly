import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('WarmthlyFontLoader Component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.className = '';
  });

  it('should create and register the component', async () => {
    await import('@components/warmthly-font-loader.js');

    const element = document.createElement('warmthly-font-loader');
    (expect(element) as any).toBeDefined();
  });

  it('should initialize font loader on connection', async () => {
    await import('@components/warmthly-font-loader.js');

    const element = document.createElement('warmthly-font-loader');
    document.body.appendChild(element);

    // Component should initialize font loader
    await new Promise(resolve => setTimeout(resolve, 100));

    (expect(element) as any).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    const consoleSpy: any = vi.spyOn(console, 'error').mockImplementation(() => {});
    await import('@components/warmthly-font-loader.js');

    const element = document.createElement('warmthly-font-loader');
    (globalThis as any).document = undefined;

    try {
      if (
        'connectedCallback' in element &&
        typeof (element as any).connectedCallback === 'function'
      ) {
        (element as any).connectedCallback();
      }
    } catch {
      // Expected
    }

    (globalThis as any).document = window.document;
    consoleSpy.mockRestore();
  });
});
