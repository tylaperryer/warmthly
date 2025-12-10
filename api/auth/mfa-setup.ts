/**
 * MFA Setup Handler
 * Generates TOTP secret and QR code for admin MFA setup
 * Requires authentication to access
 */

import jwt from 'jsonwebtoken';

import {
  withRateLimit,
  apiRateLimitOptions,
  type Request,
  type Response,
} from '../middleware/rate-limit.js';
import logger from '../utils/logger.js';

import { generateTOTPSecret, generateTOTPQRCode, storeTOTPSecret } from './totp.js';

/**
 * Verify JWT token and extract user
 */
function verifyAuthToken(authHeader: string | undefined): { valid: boolean; user?: string } {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false };
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return { valid: false };
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return { valid: false };
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    if (typeof decoded === 'object' && decoded !== null && 'user' in decoded) {
      const user = (decoded as { user?: string }).user;
      return { valid: true, user };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

/**
 * MFA setup handler
 */
async function mfaSetupHandler(req: Request, res: Response): Promise<unknown> {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  // Verify authentication
  const auth = verifyAuthToken(req.headers.authorization);
  if (!auth.valid || auth.user !== 'admin') {
    return res.status(401).json({ error: { message: 'Authentication required' } });
  }

  const body = req.body as {
    action?: 'generate' | 'verify' | 'enable';
    code?: string;
    secret?: string;
    [key: string]: unknown;
  };
  const { action, code } = body;

  try {
    if (action === 'generate') {
      // Generate new TOTP secret
      const secret = generateTOTPSecret();
      const account = 'admin@warmthly.org';
      const issuer = 'Warmthly';

      // Generate QR code URL (otpauth:// format)
      const otpauthUrl = generateTOTPQRCode(secret, account, issuer);

      // Store secret temporarily (will be enabled after verification)
      // In production, store in a temporary key with expiration
      // For now, we'll store it in the response and require immediate verification

      return res.status(200).json({
        secret,
        qrCodeUrl: otpauthUrl,
        manualEntryKey: secret, // For manual entry
        message:
          'Scan the QR code with your authenticator app, then verify with a code to enable MFA',
      });
    } else if (action === 'verify' && code) {
      // Verify TOTP code and enable MFA
      // In production, retrieve temp secret from storage
      // For now, this is a simplified flow - in production you'd:
      // 1. Store temp secret with expiration
      // 2. Verify code against temp secret
      // 3. If valid, store permanent secret

      // This endpoint should be called after 'generate' with the secret
      // In a real implementation, you'd pass the secret in the request or retrieve from temp storage

      return res.status(400).json({
        error: { message: 'Please use the generate action first, then verify with the secret' },
      });
    } else if (action === 'enable' && code && body.secret) {
      // Enable MFA with verified secret
      const secret = body.secret;
      const verificationCode = code;

      // Verify the code
      const { verifyTOTP } = await import('./totp.js');
      const isValid = verifyTOTP(secret, verificationCode);

      if (!isValid) {
        return res.status(400).json({ error: { message: 'Invalid verification code' } });
      }

      // Store the secret permanently
      await storeTOTPSecret(secret);

      logger.info('[mfa-setup] MFA enabled for admin');

      return res.status(200).json({
        message: 'MFA has been successfully enabled',
        enabled: true,
      });
    } else {
      return res.status(400).json({ error: { message: 'Invalid action or missing parameters' } });
    }
  } catch (error) {
    logger.error('[mfa-setup] Error:', error);
    return res.status(500).json({ error: { message: 'Failed to process MFA setup' } });
  }
}

export default withRateLimit(mfaSetupHandler, apiRateLimitOptions);
