/**
 * Create Checkout Tests
 * Tests for api/create-checkout.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch
(globalThis as any).fetch = vi.fn();

// Mock rate-limit
vi.mock('@api/rate-limit.js', () => ({
  withRateLimit: vi.fn((handler: unknown) => handler),
  apiRateLimitOptions: {},
}));

describe('Create Checkout Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).YOCO_SECRET_KEY;
    }
  });

  it('should return 405 for non-POST requests', async () => {
    const handler = await import('@api/endpoints/create-checkout.js');
    const req = {
      method: 'GET',
      body: {},
      url: 'http://localhost/api/create-checkout',
      headers: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('should return 400 for invalid amount', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).YOCO_SECRET_KEY = 'test-key';
    }
    
    const handler = await import('@api/endpoints/create-checkout.js');
    const req = {
      method: 'POST',
      body: {
        amount: 50, // Below minimum
      },
      url: 'http://localhost/api/create-checkout',
      headers: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 500 if YOCO_SECRET_KEY is not configured', async () => {
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).YOCO_SECRET_KEY;
    }
    
    const handler = await import('@api/endpoints/create-checkout.js');
    const req = {
      method: 'POST',
      body: {
        amount: 1000,
      },
      url: 'http://localhost/api/create-checkout',
      headers: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should create checkout successfully', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).YOCO_SECRET_KEY = 'test-key';
    }
    
    ((globalThis as any).fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'checkout-id',
        redirectUrl: 'https://checkout.yoco.com/checkout-id',
      }),
    });
    
    const handler = await import('@api/endpoints/create-checkout.js');
    const req = {
      method: 'POST',
      body: {
        amount: 1000,
        currency: 'ZAR',
      },
      url: 'http://localhost/api/create-checkout',
      headers: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    };

    await handler.default(req, res);

    expect((globalThis as any).fetch).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectUrl: expect.any(String),
        checkoutId: expect.any(String),
      })
    );
  });
});

