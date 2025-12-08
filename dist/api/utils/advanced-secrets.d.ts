/**
 * Advanced Secrets Management
 * Supports multiple secret storage backends:
 * - Environment variables (default)
 * - AWS Secrets Manager
 * - HashiCorp Vault
 * - Azure Key Vault
 *
 * Provides runtime secret fetching, caching, and rotation support
 */
/**
 * Secret provider type
 */
export declare enum SecretProvider {
    ENV = "env",
    AWS_SECRETS_MANAGER = "aws",
    HASHICORP_VAULT = "vault",
    AZURE_KEY_VAULT = "azure"
}
/**
 * Secret configuration
 */
export interface SecretConfig {
    readonly name: string;
    readonly provider?: SecretProvider;
    readonly key?: string;
    readonly required: boolean;
    readonly cacheTtl?: number;
    readonly description?: string;
}
/**
 * Get secret value from configured provider
 *
 * @param config - Secret configuration
 * @returns Secret value or null if not found
 */
export declare function getSecret(config: SecretConfig): Promise<string | null>;
/**
 * Clear secret cache (useful for testing or forced rotation)
 */
export declare function clearSecretCache(secretName?: string): void;
/**
 * Get multiple secrets at once
 *
 * @param configs - Array of secret configurations
 * @returns Map of secret names to values
 */
export declare function getSecrets(configs: readonly SecretConfig[]): Promise<Map<string, string | null>>;
/**
 * Validate that all required secrets are available
 *
 * @param configs - Array of secret configurations
 * @returns Validation result
 */
export declare function validateSecrets(configs: readonly SecretConfig[]): Promise<{
    readonly valid: boolean;
    readonly missing: string[];
    readonly errors: string[];
}>;
/**
 * Pre-configured secret definitions
 * Can be overridden via environment variables
 */
export declare const SECRET_CONFIGS: Record<string, SecretConfig>;
/**
 * Convenience function to get a secret by name
 * Uses default configuration or environment variable provider
 */
export declare function getSecretByName(name: string): Promise<string | null>;
//# sourceMappingURL=advanced-secrets.d.ts.map