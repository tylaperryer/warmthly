/**
 * Secure Cookie Utilities
 * Provides secure cookie handling with proper flags
 * Implements best practices for cookie security
 */
/**
 * Secure cookie options interface
 */
export interface SecureCookieOptions {
    readonly httpOnly?: boolean;
    readonly secure?: boolean;
    readonly sameSite?: 'strict' | 'lax' | 'none';
    readonly maxAge?: number;
    readonly path?: string;
    readonly domain?: string;
}
/**
 * Create a secure cookie string
 *
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options
 * @returns Cookie string
 */
export declare function createSecureCookie(name: string, value: string, options?: SecureCookieOptions): string;
/**
 * Set a secure cookie in response headers
 *
 * @param res - Response object
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options
 */
export declare function setSecureCookie(res: {
    readonly headers?: {
        set?: (name: string, value: string) => void;
        append?: (name: string, value: string) => void;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}, name: string, value: string, options?: SecureCookieOptions): void;
/**
 * Clear a cookie (set to expired)
 *
 * @param res - Response object
 * @param name - Cookie name
 * @param path - Cookie path (must match original)
 */
export declare function clearCookie(res: {
    readonly headers?: {
        set?: (name: string, value: string) => void;
        append?: (name: string, value: string) => void;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}, name: string, path?: string): void;
//# sourceMappingURL=secure-cookies.d.ts.map