import { setupErrorHandling, safeAsync, safeSync } from '@utils/error-handler.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Type augmentation for import.meta.env
declare global {
  interface ImportMeta {
    env: {
      DEV?: boolean;
      MODE?: string;
      [key: string]: string | boolean | undefined;
    };
  }
}

describe('Error Handler', () => {
  beforeEach(() => {
    // Clear all event listeners
    window.removeEventListener('unhandledrejection', () => {});
    window.removeEventListener('error', () => {});
  });

  describe('setupErrorHandling', () => {
    it('should set up unhandled rejection handler', () => {
      const consoleSpy: any = vi.spyOn(console, 'error').mockImplementation(() => {});
      setupErrorHandling();

      const rejection = new Promise((_, reject) => reject(new Error('Test error')));
      rejection.catch(() => {});

      // Trigger unhandled rejection
      window.dispatchEvent(new Event('unhandledrejection'));

      // In dev mode, should log errors
      if (import.meta.env?.DEV) {
        expect(consoleSpy).toHaveBeenCalled();
      }

      consoleSpy.mockRestore();
    });

    it('should set up error handler', () => {
      const consoleSpy: any = vi.spyOn(console, 'error').mockImplementation(() => {});
      setupErrorHandling();

      const errorEvent = new ErrorEvent('error', {
        error: new Error('Test error'),
        message: 'Test error message',
      });

      window.dispatchEvent(errorEvent);

      if (import.meta.env?.DEV) {
        expect(consoleSpy).toHaveBeenCalled();
      }

      consoleSpy.mockRestore();
    });

    it('should handle resource loading errors', () => {
      const consoleSpy: any = vi.spyOn(console, 'warn').mockImplementation(() => {});
      setupErrorHandling();

      const img = document.createElement('img');
      img.src = 'invalid-image.jpg';
      const errorEvent = new Event('error');
      Object.defineProperty(errorEvent, 'target', { value: img, enumerable: true });

      window.dispatchEvent(errorEvent);

      if (import.meta.env?.DEV) {
        expect(consoleSpy).toHaveBeenCalled();
      }

      consoleSpy.mockRestore();
    });
  });

  describe('safeAsync', () => {
    it('should execute async function successfully', async () => {
      const fn = async (x: number) => x * 2;
      const safeFn = safeAsync(fn as (...args: unknown[]) => Promise<unknown>);

      const result = await safeFn(5);
      expect(result).toBe(10);
    });

    it('should catch and rethrow errors in dev mode', async () => {
      const consoleSpy: any = vi.spyOn(console, 'error').mockImplementation(() => {});
      const fn = async () => {
        throw new Error('Test error');
      };
      const safeFn = safeAsync(fn);

      await expect(safeFn()).rejects.toThrow('Test error');

      if (import.meta.env?.DEV) {
        expect(consoleSpy).toHaveBeenCalled();
      }

      consoleSpy.mockRestore();
    });

    it('should preserve function parameters', async () => {
      const fn = async (a: number, b: string) => `${a}-${b}`;
      const safeFn = safeAsync(fn as (...args: unknown[]) => Promise<unknown>);

      const result = await safeFn(1, 'test');
      expect(result).toBe('1-test');
    });
  });

  describe('safeSync', () => {
    it('should execute sync function successfully', () => {
      const fn = (x: number) => x * 2;
      const safeFn = safeSync(fn as (...args: unknown[]) => unknown);

      const result = safeFn(5);
      expect(result).toBe(10);
    });

    it('should catch and rethrow errors in dev mode', () => {
      const consoleSpy: any = vi.spyOn(console, 'error').mockImplementation(() => {});
      const fn = () => {
        throw new Error('Test error');
      };
      const safeFn = safeSync(fn);

      expect(() => safeFn()).toThrow('Test error');

      if (import.meta.env?.DEV) {
        expect(consoleSpy).toHaveBeenCalled();
      }

      consoleSpy.mockRestore();
    });

    it('should preserve function parameters', () => {
      const fn = (a: number, b: string) => `${a}-${b}`;
      const safeFn = safeSync(fn as (...args: unknown[]) => unknown);

      const result = safeFn(1, 'test');
      expect(result).toBe('1-test');
    });
  });
});
