/**
 * Validation Service
 * Provides input validation and sanitization
 */
import { validateString, validateEmail, validateNumber, validateUrl, validateCurrency, validateRequestBody, sanitizeHtml, } from '@api/middleware/input-validation.js';
/**
 * Validation service implementation
 */
class ValidationService {
    validateString(value, options) {
        return validateString(value, options);
    }
    validateEmail(value, options) {
        return validateEmail(value, options);
    }
    validateNumber(value, options) {
        return validateNumber(value, options);
    }
    validateUrl(value, options) {
        return validateUrl(value, options);
    }
    validateCurrency(value, allowedCurrencies) {
        return validateCurrency(value, allowedCurrencies);
    }
    validateRequestBody(body, schema) {
        return validateRequestBody(body, schema);
    }
    sanitizeHtml(html) {
        return sanitizeHtml(html);
    }
}
/**
 * Create validation service instance
 */
export function createValidationService() {
    return new ValidationService();
}
//# sourceMappingURL=validation.service.js.map