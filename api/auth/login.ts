/**
 * Login Handler
 * Authenticates admin users and issues JWT tokens
 * Uses constant-time comparison to prevent timing attacks
 * Includes rate limiting for security
 */

import jwt from 'jsonwebtoken';

import {
  withRateLimit,
  loginRateLimitOptions,
  type Request,
  type Response,
} from '../middleware/rate-limit.js';
import { SecurityLogger } from '../security/security-monitor.js';
import { constantTimeCompare } from '../utils/crypto-utils.js';
import logger from '../utils/logger.js';

import { isMFAEnabled, verifyTOTP } from './totp.js';

/**
 * Extended Request interface for login handler
 * Adds body property for login data
 */
interface LoginRequest extends Request {
  readonly body?: {
    readonly password?: string;
    readonly totpCode?: string;
    readonly mfaStep?: 'password' | 'totp';
    [key: string]: unknown;
  };
}

/**
 * Extract client identifier from request
 * Uses IP address from headers or connection
 *
 * @param req - Request object
 * @returns Client identifier string
 */
function getClientIdentifier(req: LoginRequest): string {
  return (
    (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers?.['x-real-ip'] as string) ||
    (req.connection as { remoteAddress?: string })?.remoteAddress ||
    'unknown'
  );
}

/**
 * Generate JWT token for admin user
 * @returns JWT token string
 * @throws Error if JWT_SECRET is not configured
 */
function generateAdminToken(): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    logger.error('[login] JWT_SECRET is not configured');
    throw new Error('Authentication system not configured.');
  }
  return jwt.sign({ user: 'admin' }, jwtSecret, { expiresIn: '8h' });
}

/**
 * Handle password verification step
 * Validates password and either issues token or requests TOTP
 */
async function handlePasswordVerification(
  res: Response,
  identifier: string,
  password: string | undefined,
  adminPassword: string,
  mfaEnabled: boolean
): Promise<Response> {
  if (!constantTimeCompare(password || '', adminPassword)) {
    SecurityLogger.authenticationFailure(identifier, '/api/login');
    return res.status(401).json({ error: { message: 'Incorrect password' } });
  }

  if (!mfaEnabled) {
    try {
      const token = generateAdminToken();
      return res.status(200).json({ token });
    } catch (error) {
      return res.status(500).json({ error: { message: 'Authentication system not configured.' } });
    }
  }

  return res.status(200).json({
    mfaRequired: true,
    message: 'Password correct. Please provide TOTP code.',
    nextStep: 'totp',
  });
}

/**
 * Handle TOTP verification step
 * Validates TOTP code and issues JWT token
 */
async function handleTOTPVerification(
  res: Response,
  identifier: string,
  totpCode: string | undefined
): Promise<Response> {
  if (!totpCode) {
    return res.status(400).json({ error: { message: 'TOTP code is required' } });
  }

  const { getTOTPSecret } = await import('./totp.js');
  const secret = await getTOTPSecret();

  if (!secret) {
    logger.error('[login] MFA enabled but secret not found');
    return res.status(500).json({ error: { message: 'MFA configuration error' } });
  }

  if (!verifyTOTP(secret, totpCode)) {
    SecurityLogger.authenticationFailure(identifier, '/api/login');
    return res.status(401).json({ error: { message: 'Invalid TOTP code' } });
  }

  try {
    const token = generateAdminToken();
    logger.info('[login] Admin login successful with MFA');
    return res.status(200).json({ token });
  } catch (error) {
    return res.status(500).json({ error: { message: 'Authentication system not configured.' } });
  }
}

/**
 * Login handler
 * Validates password and issues JWT token
 * Supports two-step authentication with MFA
 *
 * @param req - Request object
 * @param res - Response object
 * @returns Response with JWT token or error
 */
async function loginHandler(req: LoginRequest, res: Response): Promise<Response> {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  const { password, totpCode, mfaStep } = req.body || {};
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({ error: { message: 'Admin password not configured.' } });
  }

  const identifier = getClientIdentifier(req);
  const mfaEnabled = await isMFAEnabled();

  // Handle TOTP verification step
  if (mfaStep === 'totp' && mfaEnabled) {
    return await handleTOTPVerification(res, identifier, totpCode);
  }

  // Handle password verification step
  if (!mfaStep || mfaStep === 'password') {
    return await handlePasswordVerification(res, identifier, password, adminPassword, mfaEnabled);
  }

  return res.status(400).json({ error: { message: 'Invalid login request' } });
}

// Export the handler with rate limiting
export default withRateLimit(loginHandler, loginRateLimitOptions);
