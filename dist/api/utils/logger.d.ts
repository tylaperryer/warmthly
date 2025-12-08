/**
 * Logger Utility
 * Provides type-safe logging with environment-aware output
 * Only logs errors in production, all logs in development
 */
/**
 * Logger interface
 */
interface Logger {
    log: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    debug: (...args: unknown[]) => void;
}
/**
 * Logger implementation
 * Environment-aware logging utility
 */
declare const logger: Logger;
export default logger;
//# sourceMappingURL=logger.d.ts.map