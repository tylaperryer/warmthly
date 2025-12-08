/**
 * Airtable API Tests
 * Tests for api/airtable.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch
(globalThis as any).fetch = vi.fn();

// Mock redis-client
vi.mock('@api/utils/redis-client.js', () => ({
  getRedisClient: vi.fn().mockResolvedValue({
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue(1),
  }),
}));

// Mock rate-limit
vi.mock('@api/middleware/rate-limit.js', () => ({
  withRateLimit: vi.fn((handler: unknown) => handler),
  apiRateLimitOptions: {},
}));

describe('Airtable Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).AIRTABLE_API_KEY;
    }
  });

  it('should return 405 for non-GET requests', async () => {
    const { airtable } = await import('@api/endpoints/index.js');
    const req = {
      method: 'POST',
      query: {},
      url: 'http://localhost/api/airtable',
      headers: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    };

    await airtable(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('should return 500 if AIRTABLE_API_KEY is not configured', async () => {
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).AIRTABLE_API_KEY;
    }

    const { airtable } = await import('@api/endpoints/index.js');
    const req = {
      method: 'GET',
      query: {},
      url: 'http://localhost/api/airtable',
      headers: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    };

    await airtable(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should return 400 if baseId and tableName are missing', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).AIRTABLE_API_KEY = 'test-key';
    }

    const { airtable } = await import('@api/endpoints/index.js');
    const req = {
      method: 'GET',
      query: {},
      url: 'http://localhost/api/airtable',
      headers: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    };

    await airtable(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fetch from Airtable API', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).AIRTABLE_API_KEY = 'test-key';
    }

    ((globalThis as any).fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ records: [] }),
    });

    const { airtable } = await import('@api/endpoints/index.js');
    const req = {
      method: 'GET',
      query: {
        baseId: 'base123',
        tableName: 'table1',
      },
      url: 'http://localhost/api/airtable',
      headers: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    };

    await airtable(req, res);

    expect((globalThis as any).fetch).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return cached data if available', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).AIRTABLE_API_KEY = 'test-key';
    }

    const { getRedisClient } = await import('@api/utils/index.js');
    const mockClient = await getRedisClient();
    (mockClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(
      JSON.stringify({ cached: true })
    );

    const { airtable } = await import('@api/endpoints/index.js');
    const req = {
      method: 'GET',
      query: {
        baseId: 'base123',
        tableName: 'table1',
      },
      url: 'http://localhost/api/airtable',
      headers: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    };

    await airtable(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
