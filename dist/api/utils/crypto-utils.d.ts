/**
 * Cryptographic Utilities
 * Shared cryptographic functions for security operations
 */
/**
 * Constant-time string comparison
 * Prevents timing attacks by comparing strings in constant time
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal, false otherwise
 */
export declare function constantTimeCompare(a: string | null | undefined, b: string | null | undefined): boolean;
/**
 * Generate a cryptographically secure random string
 *
 * @param length - Length in bytes (default: 32)
 * @returns Hex-encoded random string
 */
export declare function generateRandomString(length?: number): string;
/**
 * Generate a cryptographically secure random base64 string
 *
 * @param length - Length in bytes (default: 32)
 * @returns Base64-encoded random string
 */
export declare function generateRandomBase64(length?: number): string;
//# sourceMappingURL=crypto-utils.d.ts.map