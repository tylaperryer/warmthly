/**
 * Logger Utility
 * Provides type-safe logging with environment-aware output
 * Only logs errors in production, all logs in development
 */

/**
 * Check if running in development environment
 */
const isDevelopment = process.env.NODE_ENV === 'development';

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
const logger: Logger = {
  /**
   * Log message (development only)
   * @param args - Arguments to log
   */
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log warning (development only)
   * @param args - Arguments to log
   */
  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log error (always logged)
   * @param args - Arguments to log
   */
  error: (...args: unknown[]): void => {
    console.error(...args);
  },

  /**
   * Log info (development only)
   * @param args - Arguments to log
   */
  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Log debug (development only)
   * @param args - Arguments to log
   */
  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};

export default logger;
