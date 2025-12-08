/**
 * CSRF Protection Utilities
 * Provides CSRF token generation and validation for state-changing operations
 * Implements double-submit cookie pattern for stateless CSRF protection
 */
/**
 * Generate a secure CSRF token
 * Uses cryptographically secure random bytes
 *
 * @returns CSRF token string (64 hex characters)
 */
export declare function generateCSRFToken(): string;
/**
 * Validate CSRF token using constant-time comparison
 * Prevents timing attacks during token validation
 *
 * @param token - Token from request
 * @param sessionToken - Token from session/storage
 * @returns True if tokens match, false otherwise
 */
export declare function validateCSRFToken(token: string | null | undefined, sessionToken: string | null | undefined): boolean;
/**
 * Add CSRF token to response header
 *
 * @param res - Response object
 * @param token - CSRF token to add
 */
export declare function addCSRFTokenHeader(res: Response): void;
/**
 * Extract CSRF token from request
 * Checks both header and body for token
 *
 * @param req - Request object
 * @returns CSRF token or null
 */
export declare function extractCSRFToken(req: {
    readonly headers?: {
        readonly 'x-csrf-token'?: string;
        readonly [key: string]: string | undefined;
    };
    readonly body?: {
        readonly csrfToken?: string;
        readonly [key: string]: unknown;
    };
}): string | null;
/**
 * CSRF protection middleware
 * Validates CSRF token for state-changing operations
 *
 * @param handler - Request handler function
 * @returns Wrapped handler with CSRF protection
 */
export declare function withCSRFProtection<T extends {
    readonly method: string;
    readonly body?: {
        readonly csrfToken?: string;
        [key: string]: unknown;
    };
}>(handler: (req: T, res: {
    status: (code: number) => {
        json: (data: unknown) => unknown;
    };
}) => Promise<unknown> | unknown, getSessionToken: (req: T) => string | null | undefined): (req: T, res: {
    status: (code: number) => {
        json: (data: unknown) => unknown;
    };
}) => Promise<unknown>;
//# sourceMappingURL=csrf.d.ts.map