/**
 * Advanced Secrets Management
 * Supports multiple secret storage backends:
 * - Environment variables (default)
 * - HashiCorp Vault
 * - Oracle Cloud Vault (via environment variables or OCI SDK)
 *
 * Provides runtime secret fetching, caching, and rotation support
 */

import logger from './logger.js';

/**
 * Secret provider type
 */
export enum SecretProvider {
  ENV = 'env',
  HASHICORP_VAULT = 'vault',
  ORACLE_VAULT = 'oracle',
}

/**
 * Secret configuration
 */
export interface SecretConfig {
  readonly name: string;
  readonly provider?: SecretProvider;
  readonly key?: string; // Key name in secrets manager (defaults to name)
  readonly required: boolean;
  readonly cacheTtl?: number; // Cache TTL in milliseconds (default: 5 minutes)
  readonly description?: string;
}

/**
 * Secret cache entry
 */
interface SecretCacheEntry {
  readonly value: string;
  readonly expiresAt: number;
}

/**
 * In-memory secret cache
 */
const secretCache = new Map<string, SecretCacheEntry>();

/**
 * Default cache TTL: 5 minutes
 */
const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

/**
 * Get secret from environment variable
 */
function getSecretFromEnv(name: string): string | null {
  return process.env[name] ?? null;
}


/**
 * Get secret from HashiCorp Vault
 * Requires: node-vault or direct HTTP client
 */
async function getSecretFromVault(secretPath: string): Promise<string | null> {
  try {
    const vaultAddr = process.env.VAULT_ADDR || 'http://127.0.0.1:8200';
    const vaultToken = process.env.VAULT_TOKEN;

    if (!vaultToken) {
      logger.error('[secrets] VAULT_TOKEN not configured');
      return null;
    }

    // Parse secret path (format: secret/data/path or secret/path)
    const pathParts = secretPath.split('/');
    const mount = pathParts[0] || 'secret';
    const dataPath = pathParts.slice(1).join('/');

    // Use Vault KV v2 API
    const url = `${vaultAddr}/v1/${mount}/data/${dataPath}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Vault-Token': vaultToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Vault API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract secret value (Vault KV v2 structure)
    if (data.data?.data) {
      // If multiple keys, return JSON string; if single key, return value
      const secretData = data.data.data;
      const keys = Object.keys(secretData);
      if (keys.length === 1 && keys[0]) {
        return secretData[keys[0]];
      }
      return JSON.stringify(secretData);
    }

    return null;
  } catch (error) {
    logger.error(`[secrets] Failed to fetch secret from Vault (${secretPath}):`, error);
    return null;
  }
}

/**
 * Get secret from Oracle Cloud Vault
 * Oracle Cloud Vault secrets are typically accessed via OCI SDK or environment variables
 * For now, we support reading from environment variables prefixed with OCI_VAULT_
 * or direct environment variable access (Oracle Vault secrets are often injected as env vars)
 */
async function getSecretFromOracle(secretName: string): Promise<string | null> {
  try {
    // Try OCI_VAULT_ prefix first (common pattern for OCI Vault secrets)
    const ociKey = `OCI_VAULT_${secretName}`;
    if (process.env[ociKey]) {
      return process.env[ociKey];
    }

    // Fallback to direct environment variable
    if (process.env[secretName]) {
      return process.env[secretName];
    }

    // If OCI SDK is available, could use it here
    // For now, Oracle Vault secrets are typically injected as environment variables
    logger.warn(`[secrets] Oracle Vault secret not found: ${secretName} (check OCI_VAULT_${secretName} or ${secretName} env var)`);
    return null;
  } catch (error) {
    logger.error(`[secrets] Failed to fetch secret from Oracle Cloud Vault (${secretName}):`, error);
    return null;
  }
}

/**
 * Get secret value from configured provider
 *
 * @param config - Secret configuration
 * @returns Secret value or null if not found
 */
export async function getSecret(config: SecretConfig): Promise<string | null> {
  const cacheKey = `${config.provider ?? SecretProvider.ENV}:${config.name}`;

  // Check cache
  const cached = secretCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value;
  }

  // Determine provider
  const provider = config.provider ?? SecretProvider.ENV;
  const secretKey = config.key ?? config.name;

  let value: string | null = null;

  // Fetch from provider
  switch (provider) {
    case SecretProvider.ENV:
      value = await getSecretFromEnv(secretKey);
      break;

    case SecretProvider.HASHICORP_VAULT:
      value = await getSecretFromVault(secretKey);
      break;

    case SecretProvider.ORACLE_VAULT:
      value = await getSecretFromOracle(secretKey);
      break;

    default:
      logger.error(`[secrets] Unknown provider: ${provider}`);
      value = null;
  }

  // Cache the result
  if (value !== null) {
    const ttl = config.cacheTtl ?? DEFAULT_CACHE_TTL;
    secretCache.set(cacheKey, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  return value;
}

/**
 * Clear secret cache (useful for testing or forced rotation)
 */
export function clearSecretCache(secretName?: string): void {
  if (secretName) {
    // Clear specific secret from all providers
    for (const key of secretCache.keys()) {
      if (key.endsWith(`:${secretName}`)) {
        secretCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    secretCache.clear();
  }
}

/**
 * Get multiple secrets at once
 *
 * @param configs - Array of secret configurations
 * @returns Map of secret names to values
 */
export async function getSecrets(
  configs: readonly SecretConfig[]
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();

  await Promise.all(
    configs.map(async config => {
      const value = await getSecret(config);
      results.set(config.name, value);
    })
  );

  return results;
}

/**
 * Validate that all required secrets are available
 *
 * @param configs - Array of secret configurations
 * @returns Validation result
 */
export async function validateSecrets(configs: readonly SecretConfig[]): Promise<{
  readonly valid: boolean;
  readonly missing: string[];
  readonly errors: string[];
}> {
  const missing: string[] = [];
  const errors: string[] = [];

  await Promise.all(
    configs.map(async config => {
      if (config.required) {
        const value = await getSecret(config);
        if (!value) {
          missing.push(config.name);
          errors.push(
            `Required secret '${config.name}' not found (provider: ${
              config.provider ?? SecretProvider.ENV
            })`
          );
        }
      }
    })
  );

  return {
    valid: missing.length === 0,
    missing,
    errors,
  };
}

/**
 * Pre-configured secret definitions
 * Can be overridden via environment variables
 */
export const SECRET_CONFIGS: Record<string, SecretConfig> = {
  ADMIN_PASSWORD: {
    name: 'ADMIN_PASSWORD',
    provider: (process.env.SECRET_PROVIDER as SecretProvider) ?? SecretProvider.ENV,
    required: true,
    description: 'Admin login password',
  },
  JWT_SECRET: {
    name: 'JWT_SECRET',
    provider: (process.env.SECRET_PROVIDER as SecretProvider) ?? SecretProvider.ENV,
    required: true,
    description: 'JWT signing secret',
  },
  YOCO_SECRET_KEY: {
    name: 'YOCO_SECRET_KEY',
    provider: (process.env.SECRET_PROVIDER as SecretProvider) ?? SecretProvider.ENV,
    required: true,
    description: 'Yoco payment secret key',
  },
  AIRTABLE_API_KEY: {
    name: 'AIRTABLE_API_KEY',
    provider: (process.env.SECRET_PROVIDER as SecretProvider) ?? SecretProvider.ENV,
    required: true,
    description: 'Airtable API key',
  },
  RESEND_API_KEY: {
    name: 'RESEND_API_KEY',
    provider: (process.env.SECRET_PROVIDER as SecretProvider) ?? SecretProvider.ENV,
    required: true,
    description: 'Resend email API key',
  },
  REDIS_URL: {
    name: 'REDIS_URL',
    provider: (process.env.SECRET_PROVIDER as SecretProvider) ?? SecretProvider.ENV,
    required: true,
    description: 'Redis connection string',
  },
};

/**
 * Convenience function to get a secret by name
 * Uses default configuration or environment variable provider
 */
export async function getSecretByName(name: string): Promise<string | null> {
  const config = SECRET_CONFIGS[name] ?? {
    name,
    provider: SecretProvider.ENV,
    required: false,
  };

  return getSecret(config);
}
