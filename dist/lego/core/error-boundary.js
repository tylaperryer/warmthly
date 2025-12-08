/**
 * Error Boundary System
 * Provides error recovery strategies and context propagation
 * Implements error boundary pattern for graceful error handling
 */
import { getContainer } from './di-container.js';
import { ServiceIdentifiers } from './services/index.js';
/**
 * Error severity levels
 */
export var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (ErrorSeverity = {}));
/**
 * Error with context
 */
export class ContextualError extends Error {
    context;
    constructor(message, context) {
        super(message);
        this.name = 'ContextualError';
        this.context = context;
    }
}
/**
 * Default error recovery strategies
 */
class DefaultRecoveryStrategies {
    /**
     * Retry strategy - retries the operation
     */
    static retry(maxAttempts = 3, delay = 1000) {
        return {
            canHandle: (error, context) => context.recoverable === true && context.severity !== ErrorSeverity.CRITICAL,
            recover: async (error, context) => {
                // This would be implemented by the caller
                // This is just a placeholder strategy
                const logger = getContainer().resolve(ServiceIdentifiers.Logger);
                logger.warn(`[ErrorBoundary] Retry strategy triggered for: ${error.message}`);
            },
        };
    }
    /**
     * Fallback strategy - uses fallback value/function
     */
    static fallback(fallbackValue) {
        return {
            canHandle: () => true,
            recover: async (error, context) => {
                const logger = getContainer().resolve(ServiceIdentifiers.Logger);
                logger.warn(`[ErrorBoundary] Fallback strategy triggered for: ${error.message}`);
            },
        };
    }
    /**
     * Log and continue strategy
     */
    static logAndContinue() {
        return {
            canHandle: () => true,
            recover: async (error, context) => {
                const logger = getContainer().resolve(ServiceIdentifiers.Logger);
                logger.error(`[ErrorBoundary] Error logged: ${error.message}`, context);
            },
        };
    }
}
/**
 * Error boundary class
 * Manages error handling and recovery
 */
export class ErrorBoundary {
    strategies = [];
    logger;
    constructor(logger) {
        this.logger = logger || getContainer().resolve(ServiceIdentifiers.Logger);
        // Add default strategies
        this.addStrategy(DefaultRecoveryStrategies.logAndContinue());
    }
    /**
     * Add a recovery strategy
     */
    addStrategy(strategy) {
        this.strategies.push(strategy);
    }
    /**
     * Handle an error with recovery strategies
     */
    async handleError(error, context) {
        // Log the error
        this.logger.error(`[ErrorBoundary] ${error.message}`, {
            error: error.message,
            stack: error.stack,
            context,
        });
        // Try to find a recovery strategy
        for (const strategy of this.strategies) {
            if (strategy.canHandle(error, context)) {
                try {
                    await strategy.recover(error, context);
                    return true; // Recovery successful
                }
                catch (recoveryError) {
                    this.logger.error(`[ErrorBoundary] Recovery strategy failed: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)}`);
                }
            }
        }
        return false; // No recovery possible
    }
    /**
     * Wrap a function with error boundary
     */
    wrap(fn, context) {
        return (async (...args) => {
            try {
                return await fn(...args);
            }
            catch (error) {
                const handled = await this.handleError(error instanceof Error ? error : new Error(String(error)), context);
                if (!handled && context.severity === ErrorSeverity.CRITICAL) {
                    throw error; // Re-throw critical errors that couldn't be recovered
                }
                return undefined;
            }
        });
    }
    /**
     * Wrap a sync function with error boundary
     */
    wrapSync(fn, context) {
        return ((...args) => {
            try {
                return fn(...args);
            }
            catch (error) {
                void this.handleError(error instanceof Error ? error : new Error(String(error)), context);
                if (context.severity === ErrorSeverity.CRITICAL) {
                    throw error;
                }
                return undefined;
            }
        });
    }
}
/**
 * Global error boundary instance
 */
let globalErrorBoundary = null;
/**
 * Get or create the global error boundary
 */
export function getErrorBoundary() {
    if (!globalErrorBoundary) {
        globalErrorBoundary = new ErrorBoundary();
    }
    return globalErrorBoundary;
}
/**
 * Create a new error boundary instance (for testing)
 */
export function createErrorBoundary(logger) {
    return new ErrorBoundary(logger);
}
/**
 * Reset the global error boundary (for testing)
 */
export function resetErrorBoundary() {
    globalErrorBoundary = null;
}
export { DefaultRecoveryStrategies };
//# sourceMappingURL=error-boundary.js.map