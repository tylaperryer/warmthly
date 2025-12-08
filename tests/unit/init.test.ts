import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initApp } from '@utils/init.js';

describe('Init', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize app and set up error handling', async () => {
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    // Re-import to trigger initialization
    await import('@utils/init.js');
    if ((import.meta as any).env?.DEV) {
      expect(consoleSpy).toHaveBeenCalled();
    }
    consoleSpy.mockRestore();
  });

  it('should export initApp function', () => {
    expect(typeof initApp).toBe('function');
  });

  it('should call initApp when executed', () => {
    expect(() => initApp()).not.toThrow();
  });
});
