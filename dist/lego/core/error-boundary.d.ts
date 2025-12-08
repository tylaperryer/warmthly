/**
 * Error Boundary System
 * Provides error recovery strategies and context propagation
 * Implements error boundary pattern for graceful error handling
 */
import type { ILoggerService } from './services/logger.service.js';
/**
 * Error severity levels
 */
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
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
export declare class ContextualError extends Error {
    readonly context: ErrorContext;
    constructor(message: string, context: ErrorContext);
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
declare class DefaultRecoveryStrategies {
    /**
     * Retry strategy - retries the operation
     */
    static retry(maxAttempts?: number, delay?: number): ErrorRecoveryStrategy;
    /**
     * Fallback strategy - uses fallback value/function
     */
    static fallback<T>(fallbackValue: T): ErrorRecoveryStrategy;
    /**
     * Log and continue strategy
     */
    static logAndContinue(): ErrorRecoveryStrategy;
}
/**
 * Error boundary class
 * Manages error handling and recovery
 */
export declare class ErrorBoundary {
    private readonly strategies;
    private readonly logger;
    constructor(logger?: ILoggerService);
    /**
     * Add a recovery strategy
     */
    addStrategy(strategy: ErrorRecoveryStrategy): void;
    /**
     * Handle an error with recovery strategies
     */
    handleError(error: Error, context: ErrorContext): Promise<boolean>;
    /**
     * Wrap a function with error boundary
     */
    wrap<T extends (...args: unknown[]) => Promise<unknown>>(fn: T, context: ErrorContext): T;
    /**
     * Wrap a sync function with error boundary
     */
    wrapSync<T extends (...args: unknown[]) => unknown>(fn: T, context: ErrorContext): T;
}
/**
 * Get or create the global error boundary
 */
export declare function getErrorBoundary(): ErrorBoundary;
/**
 * Create a new error boundary instance (for testing)
 */
export declare function createErrorBoundary(logger?: ILoggerService): ErrorBoundary;
/**
 * Reset the global error boundary (for testing)
 */
export declare function resetErrorBoundary(): void;
export { DefaultRecoveryStrategies };
//# sourceMappingURL=error-boundary.d.ts.map