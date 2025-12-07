/**
 * World Map SVG Component Tests
 * Tests for lego/components/world-map-svg.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock fetch
(globalThis as any).fetch = vi.fn();

describe('WorldMapSVG Component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should create component with shadow DOM', () => {
    const element = document.createElement('world-map-svg');
    expect(element.shadowRoot).toBeNull(); // Shadow DOM created in connectedCallback
    
    document.body.appendChild(element);
    expect(element.shadowRoot).toBeTruthy();
  });

  it('should load SVG on connection', async () => {
    ((globalThis as any).fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      text: async () => '<svg></svg>',
    });

    const element = document.createElement('world-map-svg');
    document.body.appendChild(element);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect((globalThis as any).fetch).toHaveBeenCalled();
  });
});

