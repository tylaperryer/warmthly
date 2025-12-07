/**
 * Get Yoco Public Key Tests
 * Tests for api/get-yoco-public-key.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('get-yoco-public-key', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).YOCO_PUBLIC_KEY;
    }
  });

  it('should return public key on GET request', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).YOCO_PUBLIC_KEY = 'pk_test_123456';
    }
    
    const handler = await import('@api/endpoints/get-yoco-public-key.js');
    const req = {
      method: 'GET',
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ publicKey: 'pk_test_123456' });
  });

  it('should return 405 for non-GET requests', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).YOCO_PUBLIC_KEY = 'pk_test_123456';
    }
    
    const handler = await import('@api/endpoints/get-yoco-public-key.js');
    const req = {
      method: 'POST',
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('should return 500 if public key is not configured', async () => {
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).YOCO_PUBLIC_KEY;
    }
    
    const handler = await import('@api/endpoints/get-yoco-public-key.js');
    const req = {
      method: 'GET',
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Yoco public key not configured' });
  });

  it('should handle errors gracefully', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).YOCO_PUBLIC_KEY = 'pk_test_123456';
    }
    
    const handler = await import('@api/endpoints/get-yoco-public-key.js');
    const req = {
      method: 'GET',
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    // Mock process.env to throw
    if (typeof process !== 'undefined') {
      const originalEnv = process.env;
      Object.defineProperty(process, 'env', {
        get: () => {
          throw new Error('Access error');
        },
        configurable: true,
      });

      await handler.default(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to get public key' });

      // Restore
      Object.defineProperty(process, 'env', {
        get: () => originalEnv,
        configurable: true,
      });
    }
  });
});

