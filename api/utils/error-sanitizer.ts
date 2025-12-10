/**
 * Error Sanitization Utility
 * Sanitizes error messages to prevent information leakage
 * Logs detailed errors server-side while returning generic messages to clients
 */

import logger from './logger.js';

/**
 * Error codes for client-facing errors
 */
export enum ErrorCode {
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
}

/**
 * Sanitized error response structure
 */
export interface SanitizedError {
  error: {
    code: ErrorCode;
    message: string;
  };
}

/**
 * Sanitize error message to prevent information leakage
 * @param error - Error object or message
 * @param errorCode - Error code for client
 * @param logDetails - Whether to log detailed error server-side
 * @returns Sanitized error response
 */
export function sanitizeError(
  error: unknown,
  errorCode: ErrorCode = ErrorCode.INTERNAL_ERROR,
  logDetails = true
): SanitizedError {
  // Log detailed error server-side
  if (logDetails) {
    if (error instanceof Error) {
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: errorCode,
      });
    } else {
      logger.error('Error details:', {
        error,
        code: errorCode,
      });
    }
  }

  // Return generic error message to client
  const clientMessages: Record<ErrorCode, string> = {
    [ErrorCode.INVALID_REQUEST]: 'Invalid request. Please check your input and try again.',
    [ErrorCode.UNAUTHORIZED]: 'Authentication required. Please log in and try again.',
    [ErrorCode.FORBIDDEN]: 'Access denied. You do not have permission to perform this action.',
    [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
    [ErrorCode.INTERNAL_ERROR]: 'An internal error occurred. Please try again later.',
    [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable. Please try again later.',
    [ErrorCode.VALIDATION_ERROR]: 'Validation failed. Please check your input and try again.',
    [ErrorCode.PAYMENT_ERROR]: 'Payment processing failed. Please try again or contact support.',
    [ErrorCode.EXTERNAL_API_ERROR]: 'External service error. Please try again later.',
  };

  return {
    error: {
      code: errorCode,
      message: clientMessages[errorCode],
    },
  };
}

/**
 * Check if error message contains sensitive information
 * @param message - Error message to check
 * @returns True if message contains sensitive information
 */
function containsSensitiveInfo(message: string): boolean {
  const sensitivePatterns = [
    /api[_-]?key/i,
    /secret/i,
    /password/i,
    /token/i,
    /bearer/i,
    /authorization/i,
    /credential/i,
    /\.env/i,
    /localhost/i,
    /127\.0\.0\.1/i,
    /internal/i,
    /private/i,
    /database/i,
    /connection string/i,
  ];

  return sensitivePatterns.some(pattern => pattern.test(message));
}

/**
 * Sanitize error message string
 * @param message - Error message to sanitize
 * @returns Sanitized message
 */
export function sanitizeErrorMessage(message: string): string {
  if (containsSensitiveInfo(message)) {
    return 'An error occurred. Please contact support if the problem persists.';
  }

  // Remove stack traces and file paths
  const firstLine = message.split('\n')[0];
  if (!firstLine) {
    return 'An error occurred.';
  }
  return firstLine
    .replace(/at\s+.*/g, '') // Remove stack trace lines
    .replace(/\/[^\s]+/g, '') // Remove file paths
    .replace(/:\d+:\d+/g, '') // Remove line numbers
    .trim();
}
