/**
 * Global Error Handler
 * Provides user-friendly error handling with client-side tracking
 * Integrates with error boundary system for recovery strategies
 */

import { getContainer } from '@core/di-container.js';
import { getErrorBoundary, ErrorSeverity, type ErrorContext } from '@core/error-boundary.js';
import { ServiceIdentifiers, createLoggerService } from '@core/services/index.js';
import { trackError, trackUnhandledRejection } from '@utils/error-tracker.js';

// Initialize DI container with logger service
const container = getContainer();
if (!container.has(ServiceIdentifiers.Logger)) {
  container.register(ServiceIdentifiers.Logger, () => createLoggerService(), true);
}

// Type-safe check for development mode
const isDev = (import.meta as { env?: { DEV?: boolean } }).env?.DEV ?? false;

/**
 * Setup global error handlers
 * Integrates with error boundary for recovery strategies
 */
export function setupErrorHandling(): void {
  const errorBoundary = getErrorBoundary();

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    void (async () => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason || 'Unhandled promise rejection'));

      // Track error locally (no server analytics)
      trackUnhandledRejection(event.reason);

      // Handle with error boundary
      const context: ErrorContext = {
        severity: ErrorSeverity.MEDIUM,
        component: 'GlobalErrorHandler',
        operation: 'unhandledrejection',
        userMessage: 'An unexpected error occurred. Please try again.',
        recoverable: true,
      };

      await errorBoundary.handleError(error, context);

      if (isDev) {
        console.error('Unhandled promise rejection:', event.reason);
      }
    })();
  });

  // Handle both JavaScript errors and resource loading errors
  window.addEventListener(
    'error',
    (event: ErrorEvent) => {
      void (async () => {
        // Check if this is a resource loading error
        if (event.target && (event.target as HTMLElement).tagName) {
          const target = event.target as HTMLElement;
          const tagName = target.tagName.toLowerCase();

          if (['img', 'script', 'link', 'style'].includes(tagName)) {
            const src =
              (target as HTMLImageElement).src || (target as HTMLLinkElement).href || 'unknown';

            const error = new Error(`Failed to load ${tagName}: ${src}`);
            const context: ErrorContext = {
              severity: ErrorSeverity.LOW,
              component: 'ResourceLoader',
              operation: `load_${tagName}`,
              userMessage: `Failed to load resource: ${tagName}`,
              recoverable: true,
              metadata: { src, tagName },
            };

            await errorBoundary.handleError(error, context);

            if (isDev) {
              console.warn(`Failed to load ${tagName}: ${src}`);
            }
            return; // Resource loading error handled
          }
        }

        // Handle JavaScript errors (not resource loading)
        const error =
          event.error instanceof Error ? event.error : new Error(event.message || 'Unknown error');

        // Track error locally (no server analytics)
        trackError(error, event);

        // Handle with error boundary
        const context: ErrorContext = {
          severity: ErrorSeverity.HIGH,
          component: 'GlobalErrorHandler',
          operation: 'error',
          userMessage: 'A JavaScript error occurred. Please refresh the page.',
          recoverable: false,
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        };

        await errorBoundary.handleError(error, context);

        if (isDev) {
          console.error('JavaScript error:', error);
        }
      })();
    },
    true
  ); // Use capture phase to catch resource loading errors
}

/**
 * Safe async function wrapper
 * Catches and reports errors automatically
 */
export function safeAsync<T extends (...args: unknown[]) => Promise<unknown>>(fn: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (isDev) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(`Error in ${fn.name}:`, err);
      }
      throw error;
    }
  }) as T;
}

/**
 * Safe sync function wrapper
 */
export function safeSync<T extends (...args: unknown[]) => unknown>(fn: T): T {
  return ((...args: Parameters<T>) => {
    try {
      return fn(...args);
    } catch (error) {
      if (isDev) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(`Error in ${fn.name}:`, err);
      }
      throw error;
    }
  }) as T;
}
