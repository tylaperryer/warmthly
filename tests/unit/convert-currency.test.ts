/**
 * Convert Currency Tests
 * Tests for api/convert-currency.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch
(globalThis as any).fetch = vi.fn();

describe('Convert Currency Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 405 for non-GET requests', async () => {
    const { convertCurrency } = await import('@api/endpoints/index.js');
    const req = {
      method: 'POST',
      query: {},
      url: '',
      headers: {},
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await convertCurrency(req, res as any);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('should return 400 for invalid currency', async () => {
    const { convertCurrency } = await import('@api/endpoints/index.js');
    const req = {
      method: 'GET',
      query: {
        amount: '100',
        from: 'INVALID',
        to: 'ZAR',
      },
      url: '',
      headers: {},
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await convertCurrency(req, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 for invalid amount', async () => {
    const { convertCurrency } = await import('@api/endpoints/index.js');
    const req = {
      method: 'GET',
      query: {
        amount: 'invalid',
        from: 'USD',
        to: 'ZAR',
      },
      url: '',
      headers: {},
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await convertCurrency(req, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return same amount for same currency', async () => {
    const { convertCurrency } = await import('@api/endpoints/index.js');
    const req = {
      method: 'GET',
      query: {
        amount: '100',
        from: 'USD',
        to: 'USD',
      },
      url: '',
      headers: {},
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await convertCurrency(req, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      (expect as any).objectContaining({
        rate: 1,
      })
    );
  });

  it('should convert currency successfully', async () => {
    (globalThis as any).fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        rates: {
          ZAR: 18.5,
        },
      }),
    });

    const { convertCurrency } = await import('@api/endpoints/index.js');
    const req = {
      method: 'GET',
      query: {
        amount: '100',
        from: 'USD',
        to: 'ZAR',
      },
      url: '',
      headers: {},
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await convertCurrency(req, res as any);

    expect((globalThis as any).fetch).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      (expect as any).objectContaining({
        from: 'USD',
        to: 'ZAR',
        rate: 18.5,
      })
    );
  });
});
