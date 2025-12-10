/**
 * Inbound Email Tests
 * Tests for api/inbound-email.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock resend
(vi as any).mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    webhooks: {
      verify: vi.fn().mockReturnValue({
        type: 'email.received',
        data: {
          email_id: 'email-123',
          from: 'sender@example.com',
          to: 'recipient@example.com',
          subject: 'Test Subject',
          created_at: new Date().toISOString(),
        },
      }),
    },
  })),
}));

// Mock redis-client
(vi as any).mock('@api/redis-client.js', () => ({
  getRedisClient: vi.fn().mockResolvedValue({
    lPush: vi.fn().mockResolvedValue(1),
  }),
}));

describe('Inbound Email Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).RESEND_WEBHOOK_SECRET;
    }
  });

  it('should return 405 for non-POST requests', async () => {
    const { inboundEmail } = await import('@api/endpoints/index.js');
    const req = {
      method: 'GET',
      headers: {},
      body: {},
      url: '',
      on: vi.fn(),
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await inboundEmail(req, res as any);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('should return 500 if RESEND_WEBHOOK_SECRET is not configured', async () => {
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).RESEND_WEBHOOK_SECRET;
    }

    const { inboundEmail } = await import('@api/endpoints/index.js');
    const req = {
      method: 'POST',
      headers: {},
      body: {},
      url: '',
      on: vi.fn(((event: string, callback: () => void) => {
        if (event === 'end') {
          callback();
        }
      }) as any),
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await inboundEmail(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should return 401 for invalid webhook signature', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).RESEND_WEBHOOK_SECRET = 'test-secret';
    }

    const { Resend } = await import('resend');
    const mockResend = new Resend('');
    (mockResend.webhooks.verify as ReturnType<typeof vi.fn> as any).mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const { inboundEmail } = await import('@api/endpoints/index.js');
    const req = {
      method: 'POST',
      headers: {
        'svix-signature': 'invalid',
        'svix-id': 'id',
        'svix-timestamp': 'timestamp',
      },
      body: {},
      url: '',
      on: vi.fn(((event: string, callback: () => void) => {
        if (event === 'end') {
          callback();
        }
      }) as any),
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await inboundEmail(req, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should process email.received event successfully', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).RESEND_WEBHOOK_SECRET = 'test-secret';
    }

    const { inboundEmail } = await import('@api/endpoints/index.js');
    const chunks: Buffer[] = [Buffer.from(JSON.stringify({ type: 'email.received' }))];
    const req = {
      method: 'POST',
      headers: {
        'svix-signature': 'valid',
        'svix-id': 'id',
        'svix-timestamp': 'timestamp',
      },
      body: {},
      url: '',
      on: vi.fn(((event: string, callback: (data?: Buffer) => void) => {
        if (event === 'data') {
          callback(chunks[0]);
        }
        if (event === 'end') {
          callback();
        }
      }) as any),
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await inboundEmail(req, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
