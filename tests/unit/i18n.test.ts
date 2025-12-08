/**
 * i18n API Tests
 * Tests for api/endpoints/i18n.ts (deprecated - actual API is in warmthly-api/functions/api/i18n/)
 *
 * @deprecated This test file tests the deprecated i18n endpoint. The actual i18n API is in warmthly-api/functions/api/i18n/[[path]].ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch
(globalThis as any).fetch = vi.fn();

describe.skip('i18n Handler (Deprecated)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).TRANSLATION_SERVICE_URL;
    }
  });

  it('should return 405 for non-GET requests', async () => {
    // @ts-expect-error - Deprecated endpoint, test skipped
    const handler = await import('@api/endpoints/i18n.js');
    const req = {
      method: 'POST',
      query: {},
      json: async () => ({}),
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: { message: 'Method Not Allowed' } });
  });

  it('should return fallback translations when no service configured', async () => {
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).TRANSLATION_SERVICE_URL;
    }

    // @ts-expect-error - Deprecated endpoint
    const handler = await import('@api/endpoints/i18n.js');
    const req = {
      method: 'GET',
      path: '/en',
      query: {},
      json: async () => ({}),
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  it('should handle chunked requests', async () => {
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).TRANSLATION_SERVICE_URL;
    }

    // @ts-expect-error - Deprecated endpoint
    const handler = await import('@api/endpoints/i18n.js');
    const req = {
      method: 'GET',
      path: '/en',
      query: { chunked: 'true' },
      json: async () => ({}),
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should handle specific keys request', async () => {
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).TRANSLATION_SERVICE_URL;
    }

    // @ts-expect-error - Deprecated endpoint
    const handler = await import('@api/endpoints/i18n.js');
    const req = {
      method: 'GET',
      path: '/en',
      query: { keys: 'common.loading,common.error' },
      json: async () => ({}),
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 400 for invalid language', async () => {
    // @ts-expect-error - Deprecated endpoint
    const handler = await import('@api/endpoints/i18n.js');
    const req = {
      method: 'GET',
      path: '/invalid',
      query: {},
      json: async () => ({}),
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await handler.default(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
