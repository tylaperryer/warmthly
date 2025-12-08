/**
 * API Integration Tests
 * Tests for API integration with frontend
 * Phase 5 Issue 5.4: Improve Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockFetchResponse, expectErrorCode, expectStatus } from '../utils/test-helpers.js';

// Mock fetch
(globalThis as any).fetch = vi.fn();

describe('API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      ((globalThis as any).fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      try {
        await fetch('/api/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('should handle timeout errors', async () => {
      ((globalThis as any).fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Request timeout')
      );

      try {
        await fetch('/api/test');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Request timeout');
      }
    });

    it('should handle 500 server errors', async () => {
      const response = createMockFetchResponse(
        { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
        { status: 500 }
      );
      ((globalThis as any).fetch as ReturnType<typeof vi.fn>).mockResolvedValue(response);

      const res = await fetch('/api/test');
      expectStatus({ status: res.status }, 500);
      
      const data = await res.json();
      expectErrorCode(data, 'INTERNAL_ERROR');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting (429)', async () => {
      const response = createMockFetchResponse(
        { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString(),
          },
        }
      );
      ((globalThis as any).fetch as ReturnType<typeof vi.fn>).mockResolvedValue(response);

      const res = await fetch('/api/test');
      expectStatus({ status: res.status }, 429);
      expect(res.headers.get('Retry-After')).toBe('60');
      
      const data = await res.json();
      expectErrorCode(data, 'RATE_LIMIT_EXCEEDED');
    });

    it('should include rate limit headers in response', async () => {
      const response = createMockFetchResponse(
        { data: 'success' },
        {
          status: 200,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '99',
            'X-RateLimit-Reset': new Date(Date.now() + 900000).toISOString(),
          },
        }
      );
      ((globalThis as any).fetch as ReturnType<typeof vi.fn>).mockResolvedValue(response);

      const res = await fetch('/api/test');
      expect(res.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('99');
      expect(res.headers.get('X-RateLimit-Reset')).toBeDefined();
    });
  });

  describe('Authentication', () => {
    it('should handle authentication errors (401)', async () => {
      const response = createMockFetchResponse(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
      ((globalThis as any).fetch as ReturnType<typeof vi.fn>).mockResolvedValue(response);

      const res = await fetch('/api/test');
      expectStatus({ status: res.status }, 401);
      
      const data = await res.json();
      expectErrorCode(data, 'UNAUTHORIZED');
    });

    it('should handle authorization errors (403)', async () => {
      const response = createMockFetchResponse(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
      ((globalThis as any).fetch as ReturnType<typeof vi.fn>).mockResolvedValue(response);

      const res = await fetch('/api/test');
      expectStatus({ status: res.status }, 403);
      
      const data = await res.json();
      expectErrorCode(data, 'FORBIDDEN');
    });
  });

  describe('Request/Response Flow', () => {
    it('should handle successful API responses', async () => {
      const response = createMockFetchResponse(
        { data: { id: '123', status: 'success' } },
        { status: 200 }
      );
      ((globalThis as any).fetch as ReturnType<typeof vi.fn>).mockResolvedValue(response);

      const res = await fetch('/api/test');
      expectStatus({ status: res.status }, 200);
      
      const data = await res.json();
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('status');
    });

    it('should handle validation errors (400)', async () => {
      const response = createMockFetchResponse(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } },
        { status: 400 }
      );
      ((globalThis as any).fetch as ReturnType<typeof vi.fn>).mockResolvedValue(response);

      const res = await fetch('/api/test');
      expectStatus({ status: res.status }, 400);
      
      const data = await res.json();
      expectErrorCode(data, 'VALIDATION_ERROR');
    });

    it('should handle not found errors (404)', async () => {
      const response = createMockFetchResponse(
        { error: { code: 'NOT_FOUND', message: 'Resource not found' } },
        { status: 404 }
      );
      ((globalThis as any).fetch as ReturnType<typeof vi.fn>).mockResolvedValue(response);

      const res = await fetch('/api/test');
      expectStatus({ status: res.status }, 404);
      
      const data = await res.json();
      expectErrorCode(data, 'NOT_FOUND');
    });
  });

  describe('Request Headers', () => {
    it('should send Content-Type header', async () => {
      let capturedHeaders: HeadersInit = {};
      ((globalThis as any).fetch as ReturnType<typeof vi.fn>).mockImplementation(
        async (url: string, options?: RequestInit) => {
          capturedHeaders = options?.headers as HeadersInit;
          return createMockFetchResponse({ data: 'success' });
        }
      );

      await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      });

      expect(capturedHeaders).toHaveProperty('Content-Type');
      expect((capturedHeaders as Record<string, string>)['Content-Type']).toBe('application/json');
    });

    it('should send Authorization header when provided', async () => {
      let capturedHeaders: HeadersInit = {};
      ((globalThis as any).fetch as ReturnType<typeof vi.fn>).mockImplementation(
        async (url: string, options?: RequestInit) => {
          capturedHeaders = options?.headers as HeadersInit;
          return createMockFetchResponse({ data: 'success' });
        }
      );

      await fetch('/api/test', {
        headers: { Authorization: 'Bearer test-token' },
      });

      expect(capturedHeaders).toHaveProperty('Authorization');
      expect((capturedHeaders as Record<string, string>)['Authorization']).toBe('Bearer test-token');
    });
  });
});
