/**
 * API Utilities
 * Centralized exports for all API utilities
 * 
 * Usage:
 *   import { logger, getRedisClient } from '@api/utils/index.js';
 *   // or
 *   import logger from '@api/utils/logger.js'; // Still works!
 */

// Logger
export { default as logger } from './logger.js';

// Crypto Utils
export {
  constantTimeCompare,
  generateRandomString,
  generateRandomBase64,
} from './crypto-utils.js';

// Redis Client
export { getRedisClient } from './redis-client.js';
// Note: RedisClientType is exported from redis-client.ts via getRedisClient return type

// Secrets Management
export type { SecretConfig } from './secrets-management.js';
export {
  validateRequiredSecrets,
  checkSecretRotation,
  generateSecureSecret,
  validateSecretStrength,
  detectSecretsInCode,
  getSecretsStatus,
} from './secrets-management.js';

// Advanced Secrets (with renamed SecretConfig to avoid conflict)
export { SecretProvider } from './advanced-secrets.js';
export type { SecretConfig as AdvancedSecretConfig } from './advanced-secrets.js';
export {
  getSecret,
  validateSecrets as validateAdvancedSecrets,
  SECRET_CONFIGS,
  clearSecretCache,
  getSecrets,
  getSecretByName,
  } from './advanced-secrets.js';

// String Utilities
export { safeStringify, safeToString } from './string-utils.js';
 
