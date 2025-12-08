/**
 * Error Sanitization
 * Prevents leakage of sensitive information through error messages
 */

/**
 * Sanitize error message for user display
 * Removes sensitive details while providing actionable information
 */
export function sanitizeErrorMessage(error, context) {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Generic error messages for common scenarios
  const genericMessages = {
    network: 'Network error. Please check your connection and try again.',
    timeout: 'Request timed out. Please try again.',
    payment: 'Payment processing error. Please try again or use a different payment method.',
    currency: 'Currency conversion error. Please try again.',
    validation: 'Invalid input. Please check your information and try again.',
    server: 'Server error. Please try again later or contact support.',
  };

  // Check for specific error patterns
  if (
    errorMessage.toLowerCase().includes('network') ||
    errorMessage.toLowerCase().includes('fetch')
  ) {
    return genericMessages.network;
  }

  if (errorMessage.toLowerCase().includes('timeout')) {
    return genericMessages.timeout;
  }

  if (
    errorMessage.toLowerCase().includes('payment') ||
    errorMessage.toLowerCase().includes('yoco')
  ) {
    return genericMessages.payment;
  }

  if (
    errorMessage.toLowerCase().includes('currency') ||
    errorMessage.toLowerCase().includes('convert')
  ) {
    return genericMessages.currency;
  }

  if (
    errorMessage.toLowerCase().includes('validation') ||
    errorMessage.toLowerCase().includes('invalid')
  ) {
    return genericMessages.validation;
  }

  // Log full error for debugging (server-side)
  if (typeof console !== 'undefined' && console.error) {
    console.error('[Error]', context || 'Unknown context', error);
  }

  // Return generic server error for unknown errors
  return genericMessages.server;
}

/**
 * Log error securely (for internal debugging)
 */
export function logErrorSecurely(error, context, additionalData) {
  if (typeof console !== 'undefined' && console.error) {
    const errorData = {
      context,
      error:
        error instanceof Error
          ? {
              message: error.message,
              name: error.name,
              stack: error.stack,
            }
          : String(error),
      timestamp: new Date().toISOString(),
      ...additionalData,
    };
    console.error('[Secure Error Log]', errorData);
  }
}
