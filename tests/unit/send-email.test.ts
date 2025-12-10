/**
 * Send Email Tests
 * Tests for api/send-email.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock resend
(vi as any).mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'email-id' } }),
    },
  })),
}));

// Mock rate-limit
(vi as any).mock('@api/middleware/rate-limit.js', () => ({
  withRateLimit: vi.fn((handler: unknown) => handler),
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
    const { sendEmail } = await import('@api/endpoints/index.js');
    const req = {
      method: 'GET',
      body: {},
      url: 'http://localhost/api/send-email',
      headers: {},
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    } as any;

    await sendEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('should return 500 if RESEND_API_KEY is not configured', async () => {
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).RESEND_API_KEY;
    }

    const { sendEmail } = await import('@api/endpoints/index.js');
    const req = {
      method: 'POST',
      body: {},
      url: 'http://localhost/api/send-email',
      headers: {},
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    } as any;

    await sendEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should return 400 if recipient email is missing', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).RESEND_API_KEY = 'test-key';
    }

    const { sendEmail } = await import('@api/endpoints/index.js');
    const req = {
      method: 'POST',
      body: {},
      url: 'http://localhost/api/send-email',
      headers: {},
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    } as any;

    await sendEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 for invalid email format', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).RESEND_API_KEY = 'test-key';
    }

    const { sendEmail } = await import('@api/endpoints/index.js');
    const req = {
      method: 'POST',
      body: {
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>',
      },
      url: 'http://localhost/api/send-email',
      headers: {},
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    } as any;

    await sendEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if subject is missing', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).RESEND_API_KEY = 'test-key';
    }

    const { sendEmail } = await import('@api/endpoints/index.js');
    const req = {
      method: 'POST',
      body: {
        to: 'test@example.com',
        html: '<p>Test</p>',
      },
      url: 'http://localhost/api/send-email',
      headers: {},
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    } as any;

    await sendEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if HTML body is empty', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).RESEND_API_KEY = 'test-key';
    }

    const { sendEmail } = await import('@api/endpoints/index.js');
    const req = {
      method: 'POST',
      body: {
        to: 'test@example.com',
        subject: 'Test',
        html: '<p></p>',
      },
      url: 'http://localhost/api/send-email',
      headers: {},
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    } as any;

    await sendEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should send email successfully', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).RESEND_API_KEY = 'test-key';
    }

    const { sendEmail } = await import('@api/endpoints/index.js');
    const req = {
      method: 'POST',
      body: {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      },
      url: 'http://localhost/api/send-email',
      headers: {},
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    } as any;

    await sendEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      (expect as any).objectContaining({
        message: 'Email sent successfully!',
      })
    );
  });
});
