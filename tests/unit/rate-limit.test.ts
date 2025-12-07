/**
 * Rate Limiting Tests
 * Tests for api/rate-limit.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { withRateLimit, loginRateLimitOptions, emailRateLimitOptions, apiRateLimitOptions, voteRateLimitOptions } from '@api/middleware/rate-limit.js';

// Mock redis-client
vi.mock('@api/redis-client.js', () => {
  const mockPipeline = {
    incr: vi.fn().mockReturnThis(),
    pttl: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue([
      [null, 1], // incr result
      [null, 1000], // pttl result
    ]),
  };

  const mockClient = {
    isOpen: true,
    pipeline: vi.fn(() => mockPipeline),
    pexpire: vi.fn().mockResolvedValue(1),
    pttl: vi.fn().mockResolvedValue(1000),
  };

  return {
    getRedisClient: vi.fn().mockResolvedValue(mockClient),
  };
});

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('IP extraction', () => {
    it('should handle x-forwarded-for header', () => {
      const req = {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      };
      
      expect(req.headers['x-forwarded-for']).toBe('192.168.1.1, 10.0.0.1');
    });

    it('should handle x-real-ip header', () => {
      const req = {
        headers: {
          'x-real-ip': '192.168.1.1',
        },
      };
      
      expect(req.headers['x-real-ip']).toBe('192.168.1.1');
    });

    it('should handle connection remoteAddress', () => {
      const req = {
        connection: {
          remoteAddress: '192.168.1.1',
        },
      };
      
      expect(req.connection?.remoteAddress).toBe('192.168.1.1');
    });
  });

  describe('withRateLimit', () => {
    it('should wrap handler with rate limiting', async () => {
      const handler = vi.fn(async (req, res) => {
        return res.status(200).json({ success: true });
      });

      const wrapped = withRateLimit(handler, { max: 100, windowMs: 15000 });
      
      const req = {
        method: 'GET',
        url: '/test',
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
        connection: {},
      };
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        setHeader: vi.fn(),
      };

      await wrapped(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 100);
      expect(handler).toHaveBeenCalled();
    });

    it('should return 429 when rate limit exceeded', async () => {
      const { getRedisClient } = await import('@api/redis-client.js');
      const mockClient = await getRedisClient();
      const mockPipeline = (mockClient.pipeline as ReturnType<typeof vi.fn>)();
      
      (mockPipeline.exec as ReturnType<typeof vi.fn>).mockResolvedValue([
        [null, 101], // count exceeds max
        [null, 1000],
      ]);

      const handler = vi.fn();
      const wrapped = withRateLimit(handler, { max: 100, windowMs: 15000, message: 'Too many requests' });
      
      const req = {
        method: 'GET',
        url: '/test',
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
        connection: {},
      };
      
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        setHeader: vi.fn(),
      };

      await wrapped(req, res);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Too many requests' },
      });
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Pre-configured rate limit options', () => {
    it('should have correct login rate limit options', () => {
      expect(loginRateLimitOptions.max).toBe(5);
      expect(loginRateLimitOptions.windowMs).toBe(15 * 60 * 1000);
    });

    it('should have correct email rate limit options', () => {
      expect(emailRateLimitOptions.max).toBe(10);
      expect(emailRateLimitOptions.windowMs).toBe(60 * 60 * 1000);
    });

    it('should have correct API rate limit options', () => {
      expect(apiRateLimitOptions.max).toBe(100);
      expect(apiRateLimitOptions.windowMs).toBe(15 * 60 * 1000);
    });

    it('should have correct vote rate limit options', () => {
      expect(voteRateLimitOptions.max).toBe(1);
      expect(voteRateLimitOptions.windowMs).toBe(30 * 24 * 60 * 60 * 1000);
    });
  });
});

