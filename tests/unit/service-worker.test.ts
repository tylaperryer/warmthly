/**
 * Service Worker Tests
 * Tests for lego/utils/service-worker.ts
 */

import {
  isServiceWorkerActive,
  registerServiceWorker,
  initServiceWorker,
} from '@utils/service-worker.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Service Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should check if service worker is supported', () => {
    expect(typeof isServiceWorkerActive).toBe('function');
  });

  it('should register service worker', async () => {
    const mockRegister = vi.fn().mockResolvedValue({
      installing: null,
      addEventListener: vi.fn(),
    });

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: mockRegister,
        controller: null,
      },
      writable: true,
    });

    const result = await registerServiceWorker();

    expect(mockRegister).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    (expect(result) as any).toBeTruthy();
  });

  it('should return null if service workers not supported', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      writable: true,
    });

    const result = await registerServiceWorker();

    (expect(result) as any).toBeNull();
  });

  it('should handle registration errors', async () => {
    const mockRegister = vi.fn().mockRejectedValue(new Error('Registration failed'));

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: mockRegister,
      },
      writable: true,
    });

    const result = await registerServiceWorker();

    (expect(result) as any).toBeNull();
  });

  it('should initialize service worker', () => {
    const mockRegister = vi.fn().mockResolvedValue({
      installing: null,
      addEventListener: vi.fn(),
    });

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: mockRegister,
        controller: null,
        addEventListener: vi.fn(),
      },
      writable: true,
    });

    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true,
    });

    (expect(() => initServiceWorker()) as any).not.toThrow();
  });
});
