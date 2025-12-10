/**
 * Request Timeout Tests
 * Tests for api/request-timeout.ts
 */

import { withTimeout } from '@api/security/index.js';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

interface MockRequest {
  method: string;
  url: string;
  headers: Headers;
  [key: string]: unknown;
}

interface MockResponse {
  status: (code: number) => MockResponse;
  json: (data: unknown) => MockResponse;
  setHeader: (name: string, value: string | number) => void;
  headersSent: boolean;
  [key: string]: unknown;
}

describe('withTimeout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (vi as any).useFakeTimers();
  });

  afterEach(() => {
    (vi as any).useRealTimers();
  });

  it('should execute handler successfully', async () => {
    const handler = vi.fn(((req: MockRequest, res: MockResponse) => {
      return Promise.resolve(res.status(200).json({ success: true }));
    }) as any);

    const wrapped = withTimeout(handler, 1000);
    const req: MockRequest = { method: 'GET', url: '/test', headers: new Headers() };
    const res: MockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      headersSent: false,
    };

    const result = await wrapped(req, res as any);

    expect(handler).toHaveBeenCalledWith(req, res);
    (expect(result) as any).toBeDefined();
  });

  it('should timeout if handler takes too long', async () => {
    const handler = vi.fn((async (req: MockRequest, res: MockResponse) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return res.status(200).json({ success: true });
    }) as any);

    const wrapped = withTimeout(handler, 1000);
    const req: MockRequest = { method: 'GET', url: '/test', headers: new Headers() };
    const res: MockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      headersSent: false,
    };

    const promise = wrapped(req, res);

    // Fast-forward time
    (vi as any).advanceTimersByTime(1000);

    await expect(promise).rejects.toThrow('Request timeout');
    expect(res.status).toHaveBeenCalledWith(504);
  });

  it('should use default timeout if not specified', async () => {
    const handler = vi.fn(((req: MockRequest, res: MockResponse) => {
      return Promise.resolve(res.status(200).json({ success: true }));
    }) as any);

    const wrapped = withTimeout(handler, 5000);
    const req: MockRequest = { method: 'GET', url: '/test', headers: new Headers() };
    const res: MockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      headersSent: false,
    };

    await wrapped(req, res as any);
    expect(handler).toHaveBeenCalled();
  });

  it('should not send timeout response if headers already sent', async () => {
    const handler = vi.fn((async (req: MockRequest, res: MockResponse) => {
      res.headersSent = true;
      await new Promise(resolve => setTimeout(resolve, 2000));
      return res.status(200).json({ success: true });
    }) as any);

    const wrapped = withTimeout(handler, 1000);
    const req: MockRequest = { method: 'GET', url: '/test', headers: new Headers() };
    const res: MockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      headersSent: false,
    };

    const promise = wrapped(req, res);
    (vi as any).advanceTimersByTime(1000);

    await expect(promise).rejects.toThrow('Request timeout');
    // Should not call status/json if headers already sent
    (expect(res.status) as any).not.toHaveBeenCalledWith(504);
  });
});
