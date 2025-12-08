/**
 * Logger Service
 * Provides logging functionality throughout the application
 */
import type { IService } from './service.interface.js';
/**
 * Log levels
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
/**
 * Logger service interface
 */
export interface ILoggerService extends IService {
    debug(...args: unknown[]): void;
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
    setLevel(level: LogLevel): void;
    getLevel(): LogLevel;
}
/**
 * Create logger service instance
 */
export declare function createLoggerService(): ILoggerService;
//# sourceMappingURL=logger.service.d.ts.map