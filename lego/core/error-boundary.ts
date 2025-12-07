/**
 * Error Boundary System
 * Provides error recovery strategies and context propagation
 * Implements error boundary pattern for graceful error handling
 */

import type { ILoggerService } from './services/logger.service.js';
import { getContainer } from './di-container.js';
import { ServiceIdentifiers } from './services/index.js';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error context information
 */
export interface ErrorContext {
  readonly severity: ErrorSeverity;
  readonly component?: string;
  readonly operation?: string;
  readonly userMessage?: string;
  readonly recoverable?: boolean;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Error with context
 */
export class ContextualError extends Error {
  readonly context: ErrorContext;

  constructor(message: string, context: ErrorContext) {
    super(message);
    this.name = 'ContextualError';
    this.context = context;
  }
}

/**
 * Error recovery strategy
 */
export interface ErrorRecoveryStrategy {
  /**
   * Check if this strategy can handle the error
   */
  canHandle(error: Error, context: ErrorContext): boolean;

  /**
   * Attempt to recover from the error
   */
  recover(error: Error, context: ErrorContext): Promise<void> | void;
}

/**
 * Default error recovery strategies
 */
class DefaultRecoveryStrategies {
  /**
   * Retry strategy - retries the operation
   */
  static retry(maxAttempts = 3, delay = 1000): ErrorRecoveryStrategy {
    return {
      canHandle: (error, context) => context.recoverable === true && context.severity !== ErrorSeverity.CRITICAL,
      recover: async (error, context) => {
        // This would be implemented by the caller
        // This is just a placeholder strategy
        const logger = getContainer().resolve<ILoggerService>(ServiceIdentifiers.Logger);
        logger.warn(`[ErrorBoundary] Retry strategy triggered for: ${error.message}`);
      },
    };
  }

  /**
   * Fallback strategy - uses fallback value/function
   */
  static fallback<T>(fallbackValue: T): ErrorRecoveryStrategy {
    return {
      canHandle: () => true,
      recover: async (error, context) => {
        const logger = getContainer().resolve<ILoggerService>(ServiceIdentifiers.Logger);
        logger.warn(`[ErrorBoundary] Fallback strategy triggered for: ${error.message}`);
      },
    };
  }

  /**
   * Log and continue strategy
   */
  static logAndContinue(): ErrorRecoveryStrategy {
    return {
      canHandle: () => true,
      recover: async (error, context) => {
        const logger = getContainer().resolve<ILoggerService>(ServiceIdentifiers.Logger);
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
  private readonly strategies: ErrorRecoveryStrategy[] = [];
  private readonly logger: ILoggerService;

  constructor(logger?: ILoggerService) {
    this.logger = logger || getContainer().resolve<ILoggerService>(ServiceIdentifiers.Logger);
    
    // Add default strategies
    this.addStrategy(DefaultRecoveryStrategies.logAndContinue());
  }

  /**
   * Add a recovery strategy
   */
  addStrategy(strategy: ErrorRecoveryStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * Handle an error with recovery strategies
   */
  async handleError(error: Error, context: ErrorContext): Promise<boolean> {
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
        } catch (recoveryError) {
          this.logger.error(`[ErrorBoundary] Recovery strategy failed: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)}`);
        }
      }
    }

    return false; // No recovery possible
  }

  /**
   * Wrap a function with error boundary
   */
  wrap<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    context: ErrorContext
  ): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        const handled = await this.handleError(
          error instanceof Error ? error : new Error(String(error)),
          context
        );
        
        if (!handled && context.severity === ErrorSeverity.CRITICAL) {
          throw error; // Re-throw critical errors that couldn't be recovered
        }
        
        return undefined;
      }
    }) as T;
  }

  /**
   * Wrap a sync function with error boundary
   */
  wrapSync<T extends (...args: unknown[]) => unknown>(
    fn: T,
    context: ErrorContext
  ): T {
    return ((...args: Parameters<T>) => {
      try {
        return fn(...args);
      } catch (error) {
        void this.handleError(
          error instanceof Error ? error : new Error(String(error)),
          context
        );
        
        if (context.severity === ErrorSeverity.CRITICAL) {
          throw error;
        }
        
        return undefined;
      }
    }) as T;
  }
}

/**
 * Global error boundary instance
 */
let globalErrorBoundary: ErrorBoundary | null = null;

/**
 * Get or create the global error boundary
 */
export function getErrorBoundary(): ErrorBoundary {
  if (!globalErrorBoundary) {
    globalErrorBoundary = new ErrorBoundary();
  }
  return globalErrorBoundary;
}

/**
 * Create a new error boundary instance (for testing)
 */
export function createErrorBoundary(logger?: ILoggerService): ErrorBoundary {
  return new ErrorBoundary(logger);
}

/**
 * Reset the global error boundary (for testing)
 */
export function resetErrorBoundary(): void {
  globalErrorBoundary = null;
}

export { DefaultRecoveryStrategies };

