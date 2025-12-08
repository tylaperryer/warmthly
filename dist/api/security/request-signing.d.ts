/**
 * Request Signing Utilities
 * Provides HMAC-based request signing for sensitive operations
 * Ensures request integrity and prevents tampering
 */
/**
 * Sign a request payload using HMAC-SHA256
 *
 * @param payload - Request payload to sign
 * @param secret - Secret key for signing
 * @returns HMAC signature (hex string)
 */
export declare function signRequest(payload: object | string, secret: string): string;
/**
 * Verify a request signature
 * Uses constant-time comparison to prevent timing attacks
 *
 * @param payload - Request payload that was signed
 * @param signature - Signature to verify
 * @param secret - Secret key used for signing
 * @returns True if signature is valid, false otherwise
 */
export declare function verifyRequest(payload: object | string, signature: string | null | undefined, secret: string): boolean;
/**
 * Create a signed request payload
 * Includes timestamp to prevent replay attacks
 *
 * @param payload - Request payload
 * @param secret - Secret key
 * @param ttl - Time-to-live in seconds (default: 300 = 5 minutes)
 * @returns Signed request object
 */
export declare function createSignedRequest(payload: object, secret: string, ttl?: number): {
    readonly payload: object;
    readonly signature: string;
    readonly timestamp: number;
    readonly expiresAt: number;
};
/**
 * Verify a signed request
 * Checks signature validity and expiration
 *
 * @param signedRequest - Signed request object
 * @param secret - Secret key
 * @returns True if valid and not expired, false otherwise
 */
export declare function verifySignedRequest(signedRequest: {
    readonly payload?: object;
    readonly signature?: string;
    readonly timestamp?: number;
    readonly expiresAt?: number;
}, secret: string): {
    readonly valid: boolean;
    readonly error?: string;
};
/**
 * Extract signature from request headers
 *
 * @param headers - Request headers
 * @returns Signature or null
 */
export declare function extractSignature(headers: {
    readonly 'x-request-signature'?: string;
    readonly [key: string]: string | undefined;
}): string | null;
//# sourceMappingURL=request-signing.d.ts.map