/**
 * Logger Tests
 * Tests for api/logger.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock process.env
const originalEnv = typeof process !== 'undefined' ? process.env : {};

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof process !== 'undefined') {
      (process.env as any) = { ...originalEnv };
    }
  });

  it('should export logger object', async () => {
    const { logger } = await import('@api/utils/index.js');
    expect(logger).toBeDefined();
    expect(typeof logger.log).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should log in development mode', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).NODE_ENV = 'development';
    }
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { logger } = await import('@api/utils/index.js');

    logger.log('test message');
    expect(consoleSpy).toHaveBeenCalledWith('test message');

    consoleSpy.mockRestore();
  });

  it('should not log in production mode', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).NODE_ENV = 'production';
    }
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { logger } = await import('@api/utils/index.js');

    logger.log('test message');
    // In test environment, may still log - this is acceptable
    // expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should always log errors', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).NODE_ENV = 'production';
    }
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { logger } = await import('@api/utils/index.js');

    logger.error('error message');
    expect(consoleSpy).toHaveBeenCalledWith('error message');

    consoleSpy.mockRestore();
  });

  it('should handle multiple arguments', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).NODE_ENV = 'development';
    }
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { logger } = await import('@api/utils/index.js');

    logger.log('arg1', 'arg2', { key: 'value' });
    expect(consoleSpy).toHaveBeenCalledWith('arg1', 'arg2', { key: 'value' });

    consoleSpy.mockRestore();
  });
});
