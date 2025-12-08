/**
 * Authentication Endpoints
 * Centralized exports for all auth endpoints
 * 
 * Usage:
 *   import { login } from '@api/auth/index.js';
 *   // or
 *   import login from '@api/auth/login.js'; // Still works!
 */

export { default as login } from './login.js';
export { default as mfaSetup } from './mfa-setup.js';
export {
  generateTOTPSecret,
  generateTOTP,
  verifyTOTP,
  generateTOTPQRCode,
  storeTOTPSecret,
  getTOTPSecret,
  isMFAEnabled,
} from './totp.js';

