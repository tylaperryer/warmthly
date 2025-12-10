/**
 * CSRF Protection Utilities
 * Provides CSRF token generation and validation for state-changing operations
 * Implements double-submit cookie pattern for stateless CSRF protection
 */

import crypto from 'crypto';

import { constantTimeCompare } from '../utils/crypto-utils.js';

/**
 * Generate a secure CSRF token
 * Uses cryptographically secure random bytes
 *
 * @returns CSRF token string (64 hex characters)
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token using constant-time comparison
 * Prevents timing attacks during token validation
 *
 * @param token - Token from request
 * @param sessionToken - Token from session/storage
 * @returns True if tokens match, false otherwise
 */
export function validateCSRFToken(
  token: string | null | undefined,
  sessionToken: string | null | undefined
): boolean {
  if (!token || !sessionToken) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  return constantTimeCompare(token, sessionToken);
}

/**
 * Add CSRF token to response header
 *
 * @param res - Response object
 * @param token - CSRF token to add
 */
export function addCSRFTokenHeader(res: Response): void {
  const token = generateCSRFToken();
  if (res.headers && typeof res.headers.set === 'function') {
    res.headers.set('X-CSRF-Token', token);
  }
}

/**
 * Extract CSRF token from request
 * Checks both header and body for token
 *
 * @param req - Request object
 * @returns CSRF token or null
 */
export function extractCSRFToken(req: {
  readonly headers?: {
    readonly 'x-csrf-token'?: string;
    readonly [key: string]: string | undefined;
  };
  readonly body?: {
    readonly csrfToken?: string;
    readonly [key: string]: unknown;
  };
}): string | null {
  // Check header first (preferred)
  const headerToken = req.headers?.['x-csrf-token'];
  if (headerToken) {
    return headerToken;
  }

  // Fallback to body
  const bodyToken = req.body?.csrfToken;
  if (typeof bodyToken === 'string') {
    return bodyToken;
  }

  return null;
}

/**
 * CSRF protection middleware
 * Validates CSRF token for state-changing operations
 *
 * @param handler - Request handler function
 * @returns Wrapped handler with CSRF protection
 */
export function withCSRFProtection<
  T extends {
    readonly method: string;
    readonly body?: { readonly csrfToken?: string; [key: string]: unknown };
  },
>(
  handler: (
    req: T,
    res: { status: (code: number) => { json: (data: unknown) => unknown } }
  ) => Promise<unknown>,
  getSessionToken: (req: T) => string | null | undefined
) {
  return async (
    req: T,
    res: { status: (code: number) => { json: (data: unknown) => unknown } }
  ): Promise<unknown> => {
    // Only protect state-changing methods
    const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!stateChangingMethods.includes(req.method)) {
      const result = handler(req, res);
      return result instanceof Promise ? await result : result;
    }

    // Extract and validate CSRF token
    const token = extractCSRFToken(req);
    const sessionToken = getSessionToken(req);

    if (!validateCSRFToken(token, sessionToken)) {
      res.status(403).json({
        error: { message: 'Invalid or missing CSRF token' },
      });
      return;
    }

    // Token valid, proceed with handler
    const result = handler(req, res);
    return result instanceof Promise ? await result : result;
  };
}
