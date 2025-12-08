/**
 * Logger Service
 * Provides logging functionality throughout the application
 */

import type { IService } from './service.interface.js';

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
 * Logger service implementation
 */
class LoggerService implements ILoggerService {
  private level: LogLevel = LogLevel.INFO;
  private readonly isDev: boolean;

  constructor() {
    this.isDev = (import.meta as { env?: { DEV?: boolean } }).env?.DEV ?? false;
  }

  debug(...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      if (this.isDev) {
        console.debug('[DEBUG]', ...args);
      }
    }
  }

  info(...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info('[INFO]', ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error('[ERROR]', ...args);
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }
}

/**
 * Create logger service instance
 */
export function createLoggerService(): ILoggerService {
  return new LoggerService();
}
