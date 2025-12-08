/**
 * Request Signing Utilities
 * Provides HMAC-based request signing for sensitive operations
 * Ensures request integrity and prevents tampering
 */
import crypto from 'crypto';
/**
 * Sign a request payload using HMAC-SHA256
 *
 * @param payload - Request payload to sign
 * @param secret - Secret key for signing
 * @returns HMAC signature (hex string)
 */
export function signRequest(payload, secret) {
    const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
}
/**
 * Verify a request signature
 * Uses constant-time comparison to prevent timing attacks
 *
 * @param payload - Request payload that was signed
 * @param signature - Signature to verify
 * @param secret - Secret key used for signing
 * @returns True if signature is valid, false otherwise
 */
export function verifyRequest(payload, signature, secret) {
    if (!signature) {
        return false;
    }
    const expected = signRequest(payload, secret);
    // Use constant-time comparison
    try {
        return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    }
    catch {
        return false;
    }
}
/**
 * Create a signed request payload
 * Includes timestamp to prevent replay attacks
 *
 * @param payload - Request payload
 * @param secret - Secret key
 * @param ttl - Time-to-live in seconds (default: 300 = 5 minutes)
 * @returns Signed request object
 */
export function createSignedRequest(payload, secret, ttl = 300) {
    const timestamp = Date.now();
    const expiresAt = timestamp + ttl * 1000;
    const signedPayload = {
        ...payload,
        timestamp,
        expiresAt,
    };
    const signature = signRequest(signedPayload, secret);
    return {
        payload: signedPayload,
        signature,
        timestamp,
        expiresAt,
    };
}
/**
 * Verify a signed request
 * Checks signature validity and expiration
 *
 * @param signedRequest - Signed request object
 * @param secret - Secret key
 * @returns True if valid and not expired, false otherwise
 */
export function verifySignedRequest(signedRequest, secret) {
    if (!signedRequest.payload || !signedRequest.signature) {
        return { valid: false, error: 'Missing payload or signature' };
    }
    // Check expiration
    if (signedRequest.expiresAt && Date.now() > signedRequest.expiresAt) {
        return { valid: false, error: 'Request expired' };
    }
    // Verify signature
    if (!verifyRequest(signedRequest.payload, signedRequest.signature, secret)) {
        return { valid: false, error: 'Invalid signature' };
    }
    return { valid: true };
}
/**
 * Extract signature from request headers
 *
 * @param headers - Request headers
 * @returns Signature or null
 */
export function extractSignature(headers) {
    return headers['x-request-signature'] || null;
}
//# sourceMappingURL=request-signing.js.map