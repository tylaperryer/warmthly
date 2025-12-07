/**
 * Send Email Tests
 * Tests for api/send-email.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock resend
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'email-id' } }),
    },
  })),
}));

// Mock rate-limit
vi.mock('@api/rate-limit.js', () => ({
  withRateLimit: vi.fn((handler) => handler),
  emailRateLimitOptions: {},
}));

describe('Send Email Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).RESEND_API_KEY;
    }
  });

  it('should return 405 for non-POST requests', async () => {
    const handler = await import('@api/endpoints/send-email.js');
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
  });

  it('should return 500 if RESEND_API_KEY is not configured', async () => {
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).RESEND_API_KEY;
    }
    
    const handler = await import('@api/endpoints/send-email.js');
    const req = {
      method: 'POST',
      body: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should return 400 if recipient email is missing', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).RESEND_API_KEY = 'test-key';
    }
    
    const handler = await import('@api/endpoints/send-email.js');
    const req = {
      method: 'POST',
      body: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 for invalid email format', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).RESEND_API_KEY = 'test-key';
    }
    
    const handler = await import('@api/endpoints/send-email.js');
    const req = {
      method: 'POST',
      body: {
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>',
      },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if subject is missing', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).RESEND_API_KEY = 'test-key';
    }
    
    const handler = await import('@api/endpoints/send-email.js');
    const req = {
      method: 'POST',
      body: {
        to: 'test@example.com',
        html: '<p>Test</p>',
      },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if HTML body is empty', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).RESEND_API_KEY = 'test-key';
    }
    
    const handler = await import('@api/endpoints/send-email.js');
    const req = {
      method: 'POST',
      body: {
        to: 'test@example.com',
        subject: 'Test',
        html: '<p></p>',
      },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should send email successfully', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).RESEND_API_KEY = 'test-key';
    }
    
    const handler = await import('@api/endpoints/send-email.js');
    const req = {
      method: 'POST',
      body: {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Email sent successfully!',
      })
    );
  });
});

