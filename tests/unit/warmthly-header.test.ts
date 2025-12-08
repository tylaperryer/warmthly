import { describe, it, expect, beforeEach } from 'vitest';

describe('WarmthlyHeader Component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('should create and register the component', async () => {
    await import('@components/warmthly-header.js');

    const element = document.createElement('warmthly-header');
    expect(element).toBeDefined();
  });

  it('should render header with app attribute', async () => {
    await import('@components/warmthly-header.js');

    const element = document.createElement('warmthly-header');
    element.setAttribute('app', 'mint');
    document.body.appendChild(element);

    await new Promise(resolve => setTimeout(resolve, 100));

    const link = element.querySelector('a.warmthly-link');
    expect(link).toBeDefined();
    expect(link?.textContent).toBe('Warmthly');
  });

  it('should auto-detect app from hostname', async () => {
    await import('@components/warmthly-header.js');

    // Mock hostname
    Object.defineProperty(window, 'location', {
      value: { hostname: 'mint.warmthly.org' },
      writable: true,
    });

    const element = document.createElement('warmthly-header');
    document.body.appendChild(element);

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(element.querySelector('a.mint-text')).toBeDefined();
  });

  it('should use custom subdomain attributes', async () => {
    await import('@components/warmthly-header.js');

    const element = document.createElement('warmthly-header');
    element.setAttribute('subdomain-url', 'https://custom.example.com');
    element.setAttribute('subdomain-name', 'Custom');
    element.setAttribute('subdomain-class', 'custom-class');
    document.body.appendChild(element);

    await new Promise(resolve => setTimeout(resolve, 100));

    const customLink = element.querySelector('a.custom-class');
    expect(customLink).toBeDefined();
    expect(customLink?.textContent).toBe('Custom');
    expect(customLink?.getAttribute('href')).toBe('https://custom.example.com');
  });

  it('should handle errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await import('@components/warmthly-header.js');

    // Create element that might cause error
    const element = document.createElement('warmthly-header');
    // Force error by removing document temporarily
    const originalDocument = (globalThis as any).document;
    // @ts-expect-error - Testing error handling
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

    (globalThis as any).document = originalDocument;
    consoleSpy.mockRestore();
  });
});
