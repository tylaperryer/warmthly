/**
 * Get Emails Tests
 * Tests for api/get-emails.ts
 */

import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock jsonwebtoken
(vi as any).mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

// Mock redis-client
(vi as any).mock('@api/redis-client.js', () => ({
  getRedisClient: vi.fn().mockResolvedValue({
    lRange: vi
      .fn()
      .mockResolvedValue([
        JSON.stringify({ id: '1', from: 'test@example.com' }),
        JSON.stringify({ id: '2', from: 'test2@example.com' }),
      ]),
  }),
}));

// Mock rate-limit
(vi as any).mock('@api/rate-limit.js', () => ({
  withRateLimit: vi.fn((handler: unknown) => handler),
  apiRateLimitOptions: {},
}));

describe('Get Emails Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).JWT_SECRET;
    }
  });

  it('should return 405 for non-GET requests', async () => {
    const { getEmails } = await import('@api/endpoints/index.js');
    const req = {
      method: 'POST',
      headers: {},
      url: 'http://localhost/api/get-emails',
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    };

    await getEmails(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('should return 401 if authorization header is missing', async () => {
    const { getEmails } = await import('@api/endpoints/index.js');
    const req = {
      method: 'GET',
      headers: {},
      url: 'http://localhost/api/get-emails',
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    };

    await getEmails(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 401 for invalid token', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).JWT_SECRET = 'test-secret';
    }
    (jwt.verify as ReturnType<typeof vi.fn> as any).mockImplementation(() => {
      throw new jwt.JsonWebTokenError('Invalid token');
    });

    const { getEmails } = await import('@api/endpoints/index.js');
    const req = {
      method: 'GET',
      headers: {
        authorization: 'Bearer invalid-token',
      },
      url: 'http://localhost/api/get-emails',
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    };

    await getEmails(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return emails for valid token', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).JWT_SECRET = 'test-secret';
    }
    (jwt.verify as ReturnType<typeof vi.fn>).mockReturnValue({ user: 'admin' });

    const { getEmails } = await import('@api/endpoints/index.js');
    const req = {
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
      url: 'http://localhost/api/get-emails',
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    };

    await getEmails(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  it('should return 500 if JWT_SECRET is not configured', async () => {
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).JWT_SECRET;
    }

    const { getEmails } = await import('@api/endpoints/index.js');
    const req = {
      method: 'GET',
      headers: {
        authorization: 'Bearer token',
      },
      url: 'http://localhost/api/get-emails',
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    };

    await getEmails(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
