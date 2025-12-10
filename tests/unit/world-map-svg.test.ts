/**
 * World Map SVG Component Tests
 * Tests for lego/components/world-map-svg.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as typeof fetch;

describe('WorldMapSVG Component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should create component with shadow DOM', () => {
    const element = document.createElement('world-map-svg');
    (expect(element.shadowRoot) as any).toBeNull(); // Shadow DOM created in connectedCallback

    document.body.appendChild(element);
    (expect(element.shadowRoot) as any).toBeTruthy();
  });

  it('should load SVG on connection', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<svg></svg>'),
    });

    const element = document.createElement('world-map-svg');
    document.body.appendChild(element);

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockFetch).toHaveBeenCalled();
  });
});
