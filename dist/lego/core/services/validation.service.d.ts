/**
 * Validation Service
 * Provides input validation and sanitization
 */
import { type ValidationResult, type StringValidationOptions, type NumberValidationOptions, type EmailValidationOptions } from '@api/middleware/input-validation.js';
import type { IService } from './service.interface.js';
/**
 * Validation service interface
 */
export interface IValidationService extends IService {
    validateString(value: unknown, options?: StringValidationOptions): ValidationResult;
    validateEmail(value: unknown, options?: EmailValidationOptions): ValidationResult;
    validateNumber(value: unknown, options?: NumberValidationOptions): ValidationResult;
    validateUrl(value: unknown, options?: {
        readonly required?: boolean;
        readonly allowedProtocols?: readonly string[];
    }): ValidationResult;
    validateCurrency(value: unknown, allowedCurrencies?: readonly string[]): ValidationResult;
    validateRequestBody(body: unknown, schema: Record<string, (value: unknown) => ValidationResult>): {
        readonly valid: boolean;
        readonly errors?: Record<string, string>;
        readonly sanitized?: Record<string, unknown>;
    };
    sanitizeHtml(html: string): string;
}
/**
 * Create validation service instance
 */
export declare function createValidationService(): IValidationService;
//# sourceMappingURL=validation.service.d.ts.map