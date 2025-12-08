/**
 * Secure Cookie Utilities
 * Provides secure cookie handling with proper flags
 * Implements best practices for cookie security
 */
/**
 * Default secure cookie options
 * Follows security best practices
 */
const DEFAULT_SECURE_OPTIONS = {
    httpOnly: true, // Prevent XSS access
    secure: true, // HTTPS only
    sameSite: 'strict', // CSRF protection
    path: '/',
};
/**
 * Create a secure cookie string
 *
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options
 * @returns Cookie string
 */
export function createSecureCookie(name, value, options = {}) {
    const opts = { ...DEFAULT_SECURE_OPTIONS, ...options };
    // Validate cookie name and value
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        throw new Error('Invalid cookie name');
    }
    // Build cookie string
    let cookie = `${name}=${encodeURIComponent(value)}`;
    // Add max-age
    if (opts.maxAge !== undefined) {
        cookie += `; Max-Age=${opts.maxAge}`;
    }
    // Add path
    if (opts.path) {
        cookie += `; Path=${opts.path}`;
    }
    // Add domain
    if (opts.domain) {
        cookie += `; Domain=${opts.domain}`;
    }
    // Add Secure flag (HTTPS only)
    if (opts.secure) {
        cookie += '; Secure';
    }
    // Add HttpOnly flag (prevent JavaScript access)
    if (opts.httpOnly) {
        cookie += '; HttpOnly';
    }
    // Add SameSite flag (CSRF protection)
    if (opts.sameSite) {
        cookie += `; SameSite=${opts.sameSite}`;
    }
    return cookie;
}
/**
 * Set a secure cookie in response headers
 *
 * @param res - Response object
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options
 */
export function setSecureCookie(res, name, value, options = {}) {
    const cookie = createSecureCookie(name, value, options);
    if (res.headers) {
        if (typeof res.headers.set === 'function') {
            res.headers.set('Set-Cookie', cookie);
        }
        else if (typeof res.headers.append === 'function') {
            res.headers.append('Set-Cookie', cookie);
        }
    }
}
/**
 * Clear a cookie (set to expired)
 *
 * @param res - Response object
 * @param name - Cookie name
 * @param path - Cookie path (must match original)
 */
export function clearCookie(res, name, path = '/') {
    const cookie = createSecureCookie(name, '', {
        maxAge: 0,
        path,
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
    });
    if (res.headers) {
        if (typeof res.headers.set === 'function') {
            res.headers.set('Set-Cookie', cookie);
        }
        else if (typeof res.headers.append === 'function') {
            res.headers.append('Set-Cookie', cookie);
        }
    }
}
//# sourceMappingURL=secure-cookies.js.map