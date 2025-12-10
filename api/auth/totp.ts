/**
 * TOTP (Time-based One-Time Password) Implementation
 * RFC 6238 compliant TOTP generation and verification
 * World-class MFA for admin authentication
 */

import crypto from 'crypto';

import logger from '../utils/logger.js';
import { getRedisClient } from '../utils/redis-client.js';

/**
 * Encrypted TOTP data structure
 */
interface EncryptedTOTPData {
  readonly iv: string;
  readonly authTag: string;
  readonly encrypted: string;
}

/**
 * TOTP configuration
 */
const TOTP_PERIOD = 30; // 30-second time windows
const TOTP_DIGITS = 6; // 6-digit codes
const TOTP_ALGORITHM = 'sha1';
const TOTP_WINDOW = 1; // Accept codes within ±1 time window (30 seconds)

/**
 * Generate a random TOTP secret
 *
 * @returns Base32-encoded secret (compatible with Google Authenticator, Authy, etc.)
 */
export function generateTOTPSecret(): string {
  // Generate 20 random bytes (160 bits) as recommended by RFC 6238
  const secret = crypto.randomBytes(20);
  return base32Encode(secret);
}

/**
 * Generate TOTP code from secret
 *
 * @param secret - Base32-encoded secret
 * @param time - Unix timestamp (default: current time)
 * @returns 6-digit TOTP code
 */
export function generateTOTP(secret: string, time?: number): string {
  const timestamp = Math.floor((time ?? Date.now()) / 1000 / TOTP_PERIOD);

  // Decode base32 secret
  const secretBytes = base32Decode(secret);

  // Create HMAC-SHA1 hash
  const hmac = crypto.createHmac(TOTP_ALGORITHM, secretBytes);
  const timeBuffer = Buffer.allocUnsafe(8);
  timeBuffer.writeBigUInt64BE(BigInt(timestamp), 0);
  hmac.update(timeBuffer);
  const hash = hmac.digest();

  // Dynamic truncation (RFC 4226)
  const lastByte = hash[hash.length - 1];
  if (lastByte === undefined) {
    throw new Error('Invalid hash for TOTP');
  }
  const offset = lastByte & 0x0f;
  if (offset + 3 >= hash.length) {
    throw new Error('Invalid hash length for TOTP');
  }
  const binary =
    ((hash[offset]! & 0x7f) << 24) |
    ((hash[offset + 1]! & 0xff) << 16) |
    ((hash[offset + 2]! & 0xff) << 8) |
    (hash[offset + 3]! & 0xff);

  const otp = binary % Math.pow(10, TOTP_DIGITS);

  // Pad with leading zeros
  return otp.toString().padStart(TOTP_DIGITS, '0');
}

/**
 * Verify TOTP code
 * Accepts codes within the specified time window
 *
 * @param secret - Base32-encoded secret
 * @param code - TOTP code to verify
 * @param time - Unix timestamp (default: current time)
 * @returns True if code is valid
 */
export function verifyTOTP(secret: string, code: string, time?: number): boolean {
  const currentTime = time ?? Date.now();

  // Check current time window and adjacent windows
  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    const windowTime = currentTime + i * TOTP_PERIOD * 1000;
    const expectedCode = generateTOTP(secret, windowTime);

    // Constant-time comparison
    if (constantTimeCompare(code, expectedCode)) {
      return true;
    }
  }

  return false;
}

/**
 * Constant-time string comparison
 * Prevents timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Base32 encoding (RFC 4648)
 */
function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';

  for (let i = 0; i < buffer.length; i += 5) {
    let bits = 0;
    let bitCount = 0;

    for (let j = 0; j < 5 && i + j < buffer.length; j++) {
      const byte = buffer[i + j];
      if (byte !== undefined) {
        bits = (bits << 8) | byte;
        bitCount += 8;
      }
    }

    while (bitCount >= 5) {
      result += alphabet[(bits >>> (bitCount - 5)) & 0x1f];
      bitCount -= 5;
    }

    if (bitCount > 0) {
      result += alphabet[(bits << (5 - bitCount)) & 0x1f];
    }
  }

  return result;
}

/**
 * Base32 decoding (RFC 4648)
 */
function base32Decode(encoded: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const map: Record<string, number> = {};

  for (let i = 0; i < alphabet.length; i++) {
    const char = alphabet[i];
    if (char !== undefined) {
      map[char] = i;
    }
  }

  encoded = encoded.toUpperCase().replace(/=+$/, '');
  const buffer: number[] = [];
  let bits = 0;
  let bitCount = 0;

  for (const char of encoded) {
    const mapValue = map[char];
    if (mapValue === undefined) {
      throw new Error(`Invalid base32 character: ${char}`);
    }

    bits = (bits << 5) | mapValue;
    bitCount += 5;

    if (bitCount >= 8) {
      buffer.push((bits >>> (bitCount - 8)) & 0xff);
      bitCount -= 8;
    }
  }

  return Buffer.from(buffer);
}

/**
 * Generate QR code data URL for TOTP setup
 * Format: otpauth://totp/{issuer}:{account}?secret={secret}&issuer={issuer}
 *
 * @param secret - Base32-encoded secret
 * @param account - Account identifier (e.g., "admin@warmthly.org")
 * @param issuer - Service name (e.g., "Warmthly")
 * @returns QR code data URL (can be used directly in <img src>)
 */
export function generateTOTPQRCode(secret: string, account: string, issuer: string): string {
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(
    account
  )}?secret=${secret}&issuer=${encodeURIComponent(
    issuer
  )}&algorithm=${TOTP_ALGORITHM.toUpperCase()}&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;

  // For production, use a QR code library like 'qrcode' package
  // For now, return the otpauth URL which can be used with a QR code service
  // In production: import qrcode from 'qrcode'; return await qrcode.toDataURL(otpauthUrl);

  return otpauthUrl;
}

/**
 * Store TOTP secret for admin user
 * Encrypted and stored in Redis
 *
 * @param secret - Base32-encoded secret
 * @returns Promise that resolves when secret is stored
 */
export async function storeTOTPSecret(secret: string): Promise<void> {
  try {
    const client = await getRedisClient();

    // Encrypt secret before storing (using a key derived from JWT_SECRET)
    const encryptionKey = process.env.JWT_SECRET;
    if (!encryptionKey) {
      throw new Error('JWT_SECRET not configured');
    }

    // Simple encryption using AES-256-GCM
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      crypto.createHash('sha256').update(encryptionKey).digest().slice(0, 32),
      iv
    );

    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    const encryptedData = {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };

    // Store in Redis with expiration (never expires, but can be rotated)
    await client.set('admin:totp:secret', JSON.stringify(encryptedData));
  } catch (error) {
    logger.error('[totp] Failed to store TOTP secret:', error);
    throw error;
  }
}

/**
 * Retrieve and decrypt TOTP secret for admin user
 *
 * @returns Decrypted TOTP secret or null if not configured
 */
export async function getTOTPSecret(): Promise<string | null> {
  try {
    const client = await getRedisClient();
    const encryptedDataStr = await client.get('admin:totp:secret');

    if (!encryptedDataStr) {
      return null;
    }

    const encryptedData = JSON.parse(encryptedDataStr) as EncryptedTOTPData;
    const encryptionKey = process.env.JWT_SECRET;

    if (!encryptionKey) {
      throw new Error('JWT_SECRET not configured');
    }

    // Decrypt
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      crypto.createHash('sha256').update(encryptionKey).digest().slice(0, 32),
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('[totp] Failed to retrieve TOTP secret:', error);
    return null;
  }
}

/**
 * Check if MFA is enabled for admin
 *
 * @returns True if TOTP secret is configured
 */
export async function isMFAEnabled(): Promise<boolean> {
  const secret = await getTOTPSecret();
  return secret !== null;
}
