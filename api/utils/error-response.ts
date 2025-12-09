/**
 * Standardized Error Response Utility
 * Provides consistent error response format across all API endpoints
 * Phase 3 Issue 3.8: Inconsistent Error Response Format
 */

import { ErrorCode, sanitizeError } from './error-sanitizer.js';

// Re-export ErrorCode for convenience (enum is both type and value)
export { ErrorCode };

/**
 * Standard error response structure
 */
export interface StandardErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Standard success response structure
 */
export interface StandardSuccessResponse<T = unknown> {
  data?: T;
  message?: string;
  meta?: Record<string, unknown>;
}

/**
 * Create standardized error response
 *
 * @param errorCode - Error code
 * @param customMessage - Optional custom message (will be sanitized)
 * @param details - Optional additional details
 * @returns Standardized error response
 *
 * @example
 * ```typescript
 * return res.status(400).json(createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Invalid input'));
 * ```
 */
export function createErrorResponse(
  errorCode: ErrorCode,
  customMessage?: string,
  details?: Record<string, unknown>
): StandardErrorResponse {
  const sanitized = sanitizeError(customMessage || '', errorCode, false);

  return {
    error: {
      code: errorCode,
      message: customMessage ? sanitized.error.message : sanitized.error.message,
      ...(details && { details }),
    },
  };
}

/**
 * Create standardized success response
 *
 * @param data - Response data
 * @param message - Optional success message
 * @param meta - Optional metadata
 * @returns Standardized success response
 *
 * @example
 * ```typescript
 * return res.status(200).json(createSuccessResponse({ id: '123' }, 'Created successfully'));
 * ```
 */
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  meta?: Record<string, unknown>
): StandardSuccessResponse<T> {
  const response: StandardSuccessResponse<T> = {};

  if (data !== undefined) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  if (meta) {
    response.meta = meta;
  }

  return response;
}

/**
 * HTTP status codes mapped to error codes
 */
export const HTTP_STATUS_TO_ERROR_CODE: Record<number, ErrorCode> = {
  400: ErrorCode.INVALID_REQUEST,
  401: ErrorCode.UNAUTHORIZED,
  403: ErrorCode.FORBIDDEN,
  404: ErrorCode.NOT_FOUND,
  429: ErrorCode.RATE_LIMIT_EXCEEDED,
  500: ErrorCode.INTERNAL_ERROR,
  503: ErrorCode.SERVICE_UNAVAILABLE,
};

/**
 * Create error response from HTTP status code
 *
 * @param statusCode - HTTP status code
 * @param customMessage - Optional custom message
 * @param details - Optional additional details
 * @returns Standardized error response
 */
export function createErrorResponseFromStatus(
  statusCode: number,
  customMessage?: string,
  details?: Record<string, unknown>
): StandardErrorResponse {
  const errorCode = HTTP_STATUS_TO_ERROR_CODE[statusCode] || ErrorCode.INTERNAL_ERROR;
  return createErrorResponse(errorCode, customMessage, details);
}

