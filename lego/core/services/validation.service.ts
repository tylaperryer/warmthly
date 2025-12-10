/**
 * Validation Service
 * Provides input validation and sanitization
 */

import {
  validateString,
  validateEmail,
  validateNumber,
  validateUrl,
  validateCurrency,
  validateRequestBody,
  sanitizeHtml,
  type ValidationResult,
  type StringValidationOptions,
  type NumberValidationOptions,
  type EmailValidationOptions,
} from '@api/middleware/index.js';

import type { IService } from './service.interface.js';

/**
 * Validation service interface
 */
export interface IValidationService extends IService {
  validateString(value: unknown, options?: StringValidationOptions): ValidationResult;
  validateEmail(value: unknown, options?: EmailValidationOptions): ValidationResult;
  validateNumber(value: unknown, options?: NumberValidationOptions): ValidationResult;
  validateUrl(
    value: unknown,
    options?: { readonly required?: boolean; readonly allowedProtocols?: readonly string[] }
  ): ValidationResult;
  validateCurrency(value: unknown, allowedCurrencies?: readonly string[]): ValidationResult;
  validateRequestBody(
    body: unknown,
    schema: Record<string, (value: unknown) => ValidationResult>
  ): {
    readonly valid: boolean;
    readonly errors?: Record<string, string>;
    readonly sanitized?: Record<string, unknown>;
  };
  sanitizeHtml(html: string): string;
}

/**
 * Validation service implementation
 */
class ValidationService implements IValidationService {
  validateString(value: unknown, options?: StringValidationOptions): ValidationResult {
    return validateString(value, options);
  }

  validateEmail(value: unknown, options?: EmailValidationOptions): ValidationResult {
    return validateEmail(value, options);
  }

  validateNumber(value: unknown, options?: NumberValidationOptions): ValidationResult {
    return validateNumber(value, options);
  }

  validateUrl(
    value: unknown,
    options?: { readonly required?: boolean; readonly allowedProtocols?: readonly string[] }
  ): ValidationResult {
    return validateUrl(value, options);
  }

  validateCurrency(value: unknown, allowedCurrencies?: readonly string[]): ValidationResult {
    return validateCurrency(value, allowedCurrencies);
  }

  validateRequestBody(
    body: unknown,
    schema: Record<string, (value: unknown) => ValidationResult>
  ): {
    readonly valid: boolean;
    readonly errors?: Record<string, string>;
    readonly sanitized?: Record<string, unknown>;
  } {
    return validateRequestBody(body, schema);
  }

  sanitizeHtml(html: string): string {
    return sanitizeHtml(html);
  }
}

/**
 * Create validation service instance
 */
export function createValidationService(): IValidationService {
  return new ValidationService();
}
