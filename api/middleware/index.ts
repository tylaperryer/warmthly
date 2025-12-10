/**
 * API Middleware
 * Centralized exports for all middleware
 *
 * Usage:
 *   import { withRateLimit, validateEmail } from '@api/middleware/index.js';
 *   // or
 *   import { validateEmail } from '@api/middleware/input-validation.js'; // Still works!
 */

// API Versioning
export type { APIVersion } from './api-versioning.js';
export {
  validateAPIVersion,
  getAPIVersion,
  isVersionDeprecated,
  getDeprecationHeaders,
  registerAPIVersion,
  deprecateVersion,
  sunsetVersion,
  extractAPIVersion,
  validateAPIVersionMiddleware,
  getSupportedVersions,
} from './api-versioning.js';

// Input Validation
export type {
  ValidationResult,
  StringValidationOptions,
  NumberValidationOptions,
  EmailValidationOptions,
} from './input-validation.js';
export {
  validateString,
  validateNumber,
  validateEmail,
  validateUrl,
  validateCurrency,
  detectAttackPatterns,
  sanitizeHtml,
  validateInputWithAttackDetection,
  validateRequestBody,
} from './input-validation.js';

// Rate Limiting Enhanced
export type { EnhancedRateLimitResult, EnhancedRateLimitOptions } from './rate-limit-enhanced.js';
export { checkRateLimitWithBackoff, checkEnhancedRateLimit } from './rate-limit-enhanced.js';

// Rate Limiting
export { RateLimitFailureMode } from './rate-limit.js';
export type { RateLimitOptions, RateLimitResult, Request, Response } from './rate-limit.js';
export {
  withRateLimit,
  loginRateLimitOptions,
  emailRateLimitOptions,
  apiRateLimitOptions,
  voteRateLimitOptions,
} from './rate-limit.js';
