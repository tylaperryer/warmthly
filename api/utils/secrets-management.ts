/**
 * Secrets Management Utilities
 * Provides secret validation, rotation reminders, and secure handling
 * Security Enhancement 12: Secrets Management
 */

import { generateRandomString } from './crypto-utils.js';
import logger from './logger.js';

/**
 * Secret configuration
 */
export interface SecretConfig {
  readonly name: string;
  readonly required: boolean;
  readonly minLength?: number;
  readonly rotationDays?: number; // Recommended rotation interval
  readonly lastRotated?: Date;
  readonly description?: string;
}

/**
 * Required secrets configuration
 */
const REQUIRED_SECRETS: SecretConfig[] = [
  {
    name: 'ADMIN_PASSWORD',
    required: true,
    minLength: 16,
    rotationDays: 90,
    description: 'Admin login password',
  },
  {
    name: 'JWT_SECRET',
    required: true,
    minLength: 32,
    rotationDays: 180,
    description: 'JWT signing secret',
  },
  {
    name: 'YOCO_SECRET_KEY',
    required: true,
    minLength: 32,
    rotationDays: 90,
    description: 'Yoco payment secret key',
  },
  {
    name: 'AIRTABLE_API_KEY',
    required: true,
    minLength: 17,
    rotationDays: 180,
    description: 'Airtable API key',
  },
  {
    name: 'RESEND_API_KEY',
    required: true,
    minLength: 32,
    rotationDays: 180,
    description: 'Resend email API key',
  },
  {
    name: 'REDIS_URL',
    required: true,
    minLength: 10,
    rotationDays: 365,
    description: 'Redis connection string',
  },
  {
    name: 'REQUEST_SIGNING_SECRET',
    required: false,
    minLength: 32,
    rotationDays: 180,
    description: 'Request signing secret (optional)',
  },
];

/**
 * Validate that all required secrets are present
 *
 * @returns Validation result with missing secrets
 */
export function validateRequiredSecrets(): {
  readonly valid: boolean;
  readonly missing: string[];
  readonly warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const secret of REQUIRED_SECRETS) {
    const value = process.env[secret.name];

    if (secret.required && !value) {
      missing.push(secret.name);
    } else if (value && secret.minLength && value.length < secret.minLength) {
      warnings.push(`${secret.name} is too short (minimum ${secret.minLength} characters)`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Check if secrets need rotation
 *
 * @returns Array of secrets that should be rotated
 */
export function checkSecretRotation(): Array<{
  readonly name: string;
  readonly daysSinceRotation: number;
  readonly recommendedRotationDays: number;
  readonly description?: string;
}> {
  const needsRotation: Array<{
    readonly name: string;
    readonly daysSinceRotation: number;
    readonly recommendedRotationDays: number;
    readonly description?: string;
  }> = [];

  for (const secret of REQUIRED_SECRETS) {
    if (!secret.rotationDays) {
      continue;
    }

    const value = process.env[secret.name];
    if (!value) {
      continue;
    }

    // In a real implementation, you would store last rotation date
    // For now, we'll check if secret looks like it might be old
    // This is a placeholder - actual rotation tracking would use a database or secrets manager

    // For demonstration, we'll just log a warning if rotation is recommended
    logger.warn(
      `[secrets-management] Consider rotating ${secret.name} (recommended every ${secret.rotationDays} days)`
    );
  }

  return needsRotation;
}

/**
 * Generate a secure secret
 *
 * @param length - Length of secret in bytes (default: 32)
 * @returns Secure random secret
 */
export function generateSecureSecret(length: number = 32): string {
  return generateRandomString(length);
}

/**
 * Validate secret strength
 *
 * @param secret - Secret to validate
 * @param minLength - Minimum length (default: 32)
 * @returns Validation result
 */
export function validateSecretStrength(
  secret: string,
  minLength: number = 32
): {
  readonly valid: boolean;
  readonly errors: string[];
  readonly score: number; // 0-100
} {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (secret.length < minLength) {
    errors.push(`Secret must be at least ${minLength} characters`);
  } else {
    score += 30;
  }

  // Complexity checks
  if (secret.length >= 64) {
    score += 20;
  }

  // Character diversity
  const hasLower = /[a-z]/.test(secret);
  const hasUpper = /[A-Z]/.test(secret);
  const hasNumbers = /[0-9]/.test(secret);
  const hasSpecial = /[^a-zA-Z0-9]/.test(secret);

  if (hasLower) score += 10;
  if (hasUpper) score += 10;
  if (hasNumbers) score += 10;
  if (hasSpecial) score += 10;

  if (!hasLower && !hasUpper && !hasNumbers && !hasSpecial) {
    errors.push('Secret should contain a mix of character types');
  }

  // Entropy check (basic)
  const uniqueChars = new Set(secret).size;
  if (uniqueChars < secret.length * 0.5) {
    errors.push('Secret has low entropy (too many repeated characters)');
    score -= 20;
  }

  return {
    valid: errors.length === 0 && score >= 70,
    errors,
    score: Math.max(0, Math.min(100, score)),
  };
}

/**
 * Check for secrets in code (prevent accidental commits)
 * Basic pattern matching for common secret formats
 *
 * @param content - Content to check
 * @returns Array of potential secrets found
 */
export function detectSecretsInCode(content: string): Array<{
  readonly type: string;
  readonly line: number;
  readonly snippet: string;
}> {
  const patterns = [
    {
      type: 'API Key',
      regex: /(api[_-]?key|apikey)\s*[=:]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/i,
    },
    {
      type: 'Secret Key',
      regex: /(secret[_-]?key|secretkey)\s*[=:]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/i,
    },
    {
      type: 'Password',
      regex: /(password|pwd|pass)\s*[=:]\s*['"]?([^\s'"]{8,})['"]?/i,
    },
    {
      type: 'Token',
      regex: /(token|bearer)\s*[=:]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/i,
    },
    {
      type: 'Private Key',
      regex: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/i,
    },
  ];

  const found: Array<{ readonly type: string; readonly line: number; readonly snippet: string }> =
    [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of patterns) {
      if (pattern.regex.test(line)) {
        // Extract snippet (first 50 chars)
        const snippet = line.trim().substring(0, 50);
        found.push({
          type: pattern.type,
          line: i + 1,
          snippet,
        });
      }
    }
  }

  return found;
}

/**
 * Get secrets status report
 *
 * @returns Status report
 */
export function getSecretsStatus(): {
  readonly configured: number;
  readonly missing: number;
  readonly total: number;
  readonly warnings: string[];
} {
  const validation = validateRequiredSecrets();
  const configured = REQUIRED_SECRETS.length - validation.missing.length;

  return {
    configured,
    missing: validation.missing.length,
    total: REQUIRED_SECRETS.length,
    warnings: validation.warnings,
  };
}
