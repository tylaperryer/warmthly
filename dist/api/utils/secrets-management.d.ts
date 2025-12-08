/**
 * Secrets Management Utilities
 * Provides secret validation, rotation reminders, and secure handling
 * Security Enhancement 12: Secrets Management
 */
/**
 * Secret configuration
 */
export interface SecretConfig {
    readonly name: string;
    readonly required: boolean;
    readonly minLength?: number;
    readonly rotationDays?: number;
    readonly lastRotated?: Date;
    readonly description?: string;
}
/**
 * Validate that all required secrets are present
 *
 * @returns Validation result with missing secrets
 */
export declare function validateRequiredSecrets(): {
    readonly valid: boolean;
    readonly missing: string[];
    readonly warnings: string[];
};
/**
 * Check if secrets need rotation
 *
 * @returns Array of secrets that should be rotated
 */
export declare function checkSecretRotation(): Array<{
    readonly name: string;
    readonly daysSinceRotation: number;
    readonly recommendedRotationDays: number;
    readonly description?: string;
}>;
/**
 * Generate a secure secret
 *
 * @param length - Length of secret in bytes (default: 32)
 * @returns Secure random secret
 */
export declare function generateSecureSecret(length?: number): string;
/**
 * Validate secret strength
 *
 * @param secret - Secret to validate
 * @param minLength - Minimum length (default: 32)
 * @returns Validation result
 */
export declare function validateSecretStrength(secret: string, minLength?: number): {
    readonly valid: boolean;
    readonly errors: string[];
    readonly score: number;
};
/**
 * Check for secrets in code (prevent accidental commits)
 * Basic pattern matching for common secret formats
 *
 * @param content - Content to check
 * @returns Array of potential secrets found
 */
export declare function detectSecretsInCode(content: string): Array<{
    readonly type: string;
    readonly line: number;
    readonly snippet: string;
}>;
/**
 * Get secrets status report
 *
 * @returns Status report
 */
export declare function getSecretsStatus(): {
    readonly configured: number;
    readonly missing: number;
    readonly total: number;
    readonly warnings: string[];
};
//# sourceMappingURL=secrets-management.d.ts.map