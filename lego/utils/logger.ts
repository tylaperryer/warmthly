/**
 * Client-Side Logger Utility
 * Provides environment-aware logging that works in both development and production
 * Replaces console statements with proper logging
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableErrorTracking: boolean;
}

/**
 * Default configuration
 */
const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
  enableConsole: true,
  enableErrorTracking: true,
};

let config: LoggerConfig = { ...defaultConfig };

/**
 * Initialize logger configuration
 */
export function initLogger(customConfig?: Partial<LoggerConfig>): void {
  config = { ...defaultConfig, ...customConfig };
}

/**
 * Check if a log level should be logged
 */
function shouldLog(level: LogLevel): boolean {
  return level >= config.level;
}

/**
 * Get error tracker (lazy load to avoid circular dependencies)
 */
async function getErrorTracker() {
  if (!config.enableErrorTracking) {
    return null;
  }
  try {
    const { trackError } = await import('./error-tracker.js');
    return trackError;
  } catch {
    return null;
  }
}

/**
 * Base log function
 */
function log(level: LogLevel, method: keyof Console, ...args: unknown[]): void {
  if (!shouldLog(level)) {
    return;
  }

  if (config.enableConsole && typeof console !== 'undefined' && console[method] && typeof console[method] === 'function') {
    (console[method] as (...args: unknown[]) => void)(...args);
  }

  // Track errors
  if (level >= LogLevel.ERROR) {
    getErrorTracker().then((trackError) => {
      if (trackError) {
        const error = args[0] instanceof Error ? args[0] : new Error(String(args[0]));
        trackError(error);
      }
    });
  }
}

/**
 * Debug log (development only)
 */
export function debug(...args: unknown[]): void {
  log(LogLevel.DEBUG, 'debug', ...args);
}

/**
 * Info log
 */
export function info(...args: unknown[]): void {
  log(LogLevel.INFO, 'info', ...args);
}

/**
 * Warning log
 */
export function warn(...args: unknown[]): void {
  log(LogLevel.WARN, 'warn', ...args);
}

/**
 * Error log
 */
export function error(...args: unknown[]): void {
  log(LogLevel.ERROR, 'error', ...args);
}

/**
 * Logger object for convenience
 */
export const logger = {
  debug,
  info,
  warn,
  error,
  init: initLogger,
};

