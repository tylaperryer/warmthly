/**
 * Cryptographic Utilities
 * Shared cryptographic functions for security operations
 */

import crypto from 'crypto';

/**
 * Constant-time string comparison
 * Prevents timing attacks by comparing strings in constant time
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal, false otherwise
 */
export function constantTimeCompare(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (!a || !b) {
    return false;
  }

  if (a.length !== b.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  } catch (error: unknown) {
    // If timingSafeEqual fails, return false
    return false;
  }
}

/**
 * Generate a cryptographically secure random string
 *
 * @param length - Length in bytes (default: 32)
 * @returns Hex-encoded random string
 */
export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a cryptographically secure random base64 string
 *
 * @param length - Length in bytes (default: 32)
 * @returns Base64-encoded random string
 */
export function generateRandomBase64(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64');
}
