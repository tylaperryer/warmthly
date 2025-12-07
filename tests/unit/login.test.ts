/**
 * Login Tests
 * Tests for api/login.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn((payload, secret, options) => 'mock-jwt-token'),
  },
}));

// Mock rate-limit
vi.mock('@api/rate-limit.js', () => ({
  withRateLimit: vi.fn((handler) => handler),
  loginRateLimitOptions: {},
}));

describe('Login Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).ADMIN_PASSWORD;
      delete (process.env as any).JWT_SECRET;
    }
  });

  it('should return 405 for non-POST requests', async () => {
    const handler = await import('@api/login.js');
    const req = {
      method: 'GET',
      body: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: { message: 'Method Not Allowed' } });
  });

  it('should return 500 if ADMIN_PASSWORD is not configured', async () => {
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).ADMIN_PASSWORD;
    }
    
    const handler = await import('@api/login.js');
    const req = {
      method: 'POST',
      body: { password: 'test' },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: { message: 'Admin password not configured.' } });
  });

  it('should return 401 for incorrect password', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).ADMIN_PASSWORD = 'correct-password';
    }
    
    const handler = await import('@api/login.js');
    const req = {
      method: 'POST',
      body: { password: 'wrong-password' },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: { message: 'Incorrect password' } });
  });

  it('should return 500 if JWT_SECRET is not configured', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).ADMIN_PASSWORD = 'correct-password';
      delete (process.env as any).JWT_SECRET;
    }
    
    const handler = await import('@api/login.js');
    const req = {
      method: 'POST',
      body: { password: 'correct-password' },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: { message: 'Authentication system not configured.' } });
  });

  it('should return JWT token for correct password', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).ADMIN_PASSWORD = 'correct-password';
      (process.env as any).JWT_SECRET = 'jwt-secret';
    }
    
    const jwt = await import('jsonwebtoken');
    const handler = await import('@api/login.js');
    const req = {
      method: 'POST',
      body: { password: 'correct-password' },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler.default(req, res);

    expect(jwt.default.sign).toHaveBeenCalledWith(
      { user: 'admin' },
      'jwt-secret',
      { expiresIn: '8h' }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token: 'mock-jwt-token' });
  });

  it('should handle missing password in body', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).ADMIN_PASSWORD = 'correct-password';
    }
    
    const handler = await import('@api/login.js');
    const req = {
      method: 'POST',
      body: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: { message: 'Incorrect password' } });
  });
});

