/**
 * MFA Setup Handler
 * Generates TOTP secret and QR code for admin MFA setup
 * Requires authentication to access
 */

import { generateTOTPSecret, generateTOTPQRCode, storeTOTPSecret } from './totp.js';
import { withRateLimit, apiRateLimitOptions } from '../middleware/rate-limit.js';
import logger from '../utils/logger.js';
import jwt from 'jsonwebtoken';

/**
 * Request object interface
 */
interface Request {
  readonly method: string;
  readonly headers: {
    readonly authorization?: string;
    [key: string]: string | undefined;
  };
  readonly body: {
    readonly action?: 'generate' | 'verify' | 'enable';
    readonly code?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Response object interface
 */
interface Response {
  status: (code: number) => Response;
  json: (data: unknown) => Response;
  [key: string]: unknown;
}

/**
 * Verify JWT token and extract user
 */
function verifyAuthToken(authHeader: string | undefined): { valid: boolean; user?: string } {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false };
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return { valid: false };
  }

  try {
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as { user?: string };
    return { valid: true, user: decoded.user };
  } catch {
    return { valid: false };
  }
}

/**
 * MFA setup handler
 */
async function mfaSetupHandler(req: Request, res: Response): Promise<Response> {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  // Verify authentication
  const auth = verifyAuthToken(req.headers.authorization);
  if (!auth.valid || auth.user !== 'admin') {
    return res.status(401).json({ error: { message: 'Authentication required' } });
  }

  const { action, code } = req.body;

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
      const tempKey = `admin:totp:temp:${Date.now()}`;
      // For now, we'll store it in the response and require immediate verification
      
      return res.status(200).json({
        secret,
        qrCodeUrl: otpauthUrl,
        manualEntryKey: secret, // For manual entry
        message: 'Scan the QR code with your authenticator app, then verify with a code to enable MFA',
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
    } else if (action === 'enable' && code && req.body.secret) {
      // Enable MFA with verified secret
      const secret = req.body.secret as string;
      const verificationCode = code as string;
      
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

