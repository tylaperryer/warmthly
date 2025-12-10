/**
 * Component Loader Tests
 * Tests for lego/utils/component-loader.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('Component Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should initialize font loader', async () => {
    const { initFontLoader } = await import('@utils/font-loader-utils.js');
    expect(typeof initFontLoader).toBe('function');
  });

  it('should load stoplight component when element exists', async () => {
    const stoplightElement = document.createElement('div');
    stoplightElement.id = 'stoplight';
    document.body.appendChild(stoplightElement);

    // Mock stoplight-utils
    (vi as any).mock('@utils/stoplight-utils.js', () => ({
      initStoplight: vi.fn(),
    }));

    // Import component-loader (it runs on import)
    await import('@utils/component-loader.js');

    // Wait for dynamic import
    await new Promise(resolve => setTimeout(resolve, 100));

    const { initStoplight } = await import('@utils/stoplight-utils.js');
    expect(initStoplight).toHaveBeenCalled();
  });

  it('should not load stoplight component when element does not exist', async () => {
    // Mock stoplight-utils
    (vi as any).mock('@utils/stoplight-utils.js', () => ({
      initStoplight: vi.fn(),
    }));

    // Import component-loader
    await import('@utils/component-loader.js');

    // Wait for dynamic import
    await new Promise(resolve => setTimeout(resolve, 100));

    const { initStoplight } = await import('@utils/stoplight-utils.js');
    (expect(initStoplight) as any).not.toHaveBeenCalled();
  });
});
