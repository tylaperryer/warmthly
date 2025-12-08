/**
 * Logger Service
 * Provides logging functionality throughout the application
 */
/**
 * Log levels
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
/**
 * Logger service implementation
 */
class LoggerService {
    level = LogLevel.INFO;
    isDev;
    constructor() {
        this.isDev = import.meta.env?.DEV ?? false;
    }
    debug(...args) {
        if (this.level <= LogLevel.DEBUG) {
            if (this.isDev) {
                console.debug('[DEBUG]', ...args);
            }
        }
    }
    info(...args) {
        if (this.level <= LogLevel.INFO) {
            console.info('[INFO]', ...args);
        }
    }
    warn(...args) {
        if (this.level <= LogLevel.WARN) {
            console.warn('[WARN]', ...args);
        }
    }
    error(...args) {
        if (this.level <= LogLevel.ERROR) {
            console.error('[ERROR]', ...args);
        }
    }
    setLevel(level) {
        this.level = level;
    }
    getLevel() {
        return this.level;
    }
}
/**
 * Create logger service instance
 */
export function createLoggerService() {
    return new LoggerService();
}
//# sourceMappingURL=logger.service.js.map