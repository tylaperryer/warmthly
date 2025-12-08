/**
 * Enhanced Input Validation Utilities
 * Provides comprehensive validation and sanitization for API inputs
 * Strengthens security by validating all user inputs
 */
/**
 * Validation result interface
 */
export interface ValidationResult {
    readonly valid: boolean;
    readonly error?: string;
    readonly sanitized?: string | number;
}
/**
 * String validation options
 */
export interface StringValidationOptions {
    readonly minLength?: number;
    readonly maxLength?: number;
    readonly pattern?: RegExp;
    readonly required?: boolean;
    readonly trim?: boolean;
    readonly allowEmpty?: boolean;
}
/**
 * Number validation options
 */
export interface NumberValidationOptions {
    readonly min?: number;
    readonly max?: number;
    readonly integer?: boolean;
    readonly required?: boolean;
}
/**
 * Email validation options
 */
export interface EmailValidationOptions {
    readonly required?: boolean;
    readonly maxLength?: number;
}
/**
 * Validate and sanitize a string input
 *
 * @param value - Value to validate
 * @param options - Validation options
 * @returns Validation result with sanitized value
 */
export declare function validateString(value: unknown, options?: StringValidationOptions): ValidationResult;
/**
 * Validate and sanitize a number input
 *
 * @param value - Value to validate
 * @param options - Validation options
 * @returns Validation result with sanitized value
 */
export declare function validateNumber(value: unknown, options?: NumberValidationOptions): ValidationResult;
/**
 * Validate an email address
 *
 * @param value - Email to validate
 * @param options - Validation options
 * @returns Validation result with sanitized email
 */
export declare function validateEmail(value: unknown, options?: EmailValidationOptions): ValidationResult;
/**
 * Validate a URL
 *
 * @param value - URL to validate
 * @param options - Validation options
 * @returns Validation result
 */
export declare function validateUrl(value: unknown, options?: {
    readonly required?: boolean;
    readonly allowedProtocols?: readonly string[];
}): ValidationResult;
/**
 * Validate currency code (ISO 4217)
 *
 * @param value - Currency code to validate
 * @param allowedCurrencies - List of allowed currency codes
 * @returns Validation result
 */
export declare function validateCurrency(value: unknown, allowedCurrencies?: readonly string[]): ValidationResult;
/**
 * Detect common attack patterns in input
 * Security Enhancement 10: Enhanced Input Validation
 *
 * @param input - Input string to check
 * @returns Object with detected attack type and details
 */
export declare function detectAttackPatterns(input: string): {
    readonly detected: boolean;
    readonly attackType?: 'xss' | 'sql_injection' | 'path_traversal' | 'command_injection' | 'ldap_injection';
    readonly pattern?: string;
};
/**
 * Sanitize HTML content (basic)
 * Removes potentially dangerous HTML tags and attributes
 *
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML
 */
export declare function sanitizeHtml(html: string): string;
/**
 * Validate input with attack pattern detection
 * Security Enhancement 10: Enhanced Input Validation
 *
 * @param value - Value to validate
 * @param options - Validation options
 * @returns Validation result with attack detection
 */
export declare function validateInputWithAttackDetection(value: unknown, options?: {
    readonly fieldName?: string;
    readonly logAttack?: boolean;
    readonly rejectOnAttack?: boolean;
}): ValidationResult & {
    readonly attackDetected?: boolean;
    readonly attackType?: string;
};
/**
 * Validate request body structure
 *
 * @param body - Request body to validate
 * @param schema - Validation schema
 * @returns Validation result
 */
export declare function validateRequestBody(body: unknown, schema: Record<string, (value: unknown) => ValidationResult>): {
    readonly valid: boolean;
    readonly errors?: Record<string, string>;
    readonly sanitized?: Record<string, unknown>;
};
//# sourceMappingURL=input-validation.d.ts.map