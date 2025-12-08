/**
 * TOTP (Time-based One-Time Password) Implementation
 * RFC 6238 compliant TOTP generation and verification
 * World-class MFA for admin authentication
 */
/**
 * Generate a random TOTP secret
 *
 * @returns Base32-encoded secret (compatible with Google Authenticator, Authy, etc.)
 */
export declare function generateTOTPSecret(): string;
/**
 * Generate TOTP code from secret
 *
 * @param secret - Base32-encoded secret
 * @param time - Unix timestamp (default: current time)
 * @returns 6-digit TOTP code
 */
export declare function generateTOTP(secret: string, time?: number): string;
/**
 * Verify TOTP code
 * Accepts codes within the specified time window
 *
 * @param secret - Base32-encoded secret
 * @param code - TOTP code to verify
 * @param time - Unix timestamp (default: current time)
 * @returns True if code is valid
 */
export declare function verifyTOTP(secret: string, code: string, time?: number): boolean;
/**
 * Generate QR code data URL for TOTP setup
 * Format: otpauth://totp/{issuer}:{account}?secret={secret}&issuer={issuer}
 *
 * @param secret - Base32-encoded secret
 * @param account - Account identifier (e.g., "admin@warmthly.org")
 * @param issuer - Service name (e.g., "Warmthly")
 * @returns QR code data URL (can be used directly in <img src>)
 */
export declare function generateTOTPQRCode(secret: string, account: string, issuer: string): string;
/**
 * Store TOTP secret for admin user
 * Encrypted and stored in Redis
 *
 * @param secret - Base32-encoded secret
 * @returns Promise that resolves when secret is stored
 */
export declare function storeTOTPSecret(secret: string): Promise<void>;
/**
 * Retrieve and decrypt TOTP secret for admin user
 *
 * @returns Decrypted TOTP secret or null if not configured
 */
export declare function getTOTPSecret(): Promise<string | null>;
/**
 * Check if MFA is enabled for admin
 *
 * @returns True if TOTP secret is configured
 */
export declare function isMFAEnabled(): Promise<boolean>;
//# sourceMappingURL=totp.d.ts.map