/**
 * API Module
 * Centralized exports for the entire API
 *
 * This is the main barrel export for the API module.
 * It provides convenient access to all API functionality.
 *
 * Usage:
 *   import { endpoints, auth, utils, middleware, security } from '@api/index.js';
 *
 *   // Then use:
 *   import { airtable } from endpoints;
 *   import { login } from auth;
 *   import { logger, getRedisClient } from utils;
 *   import { withRateLimit, validateEmail } from middleware;
 *   import { withTimeout } from security;
 *
 * Note: Direct imports still work and are not affected:
 *   import airtable from '@api/endpoints/airtable.js'; // Still works!
 */

export * as endpoints from './endpoints/index.js';
export * as auth from './auth/index.js';
export * as utils from './utils/index.js';
export * as middleware from './middleware/index.js';
export * as security from './security/index.js';
