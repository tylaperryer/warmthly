/**
 * Client-Side Error Tracker
 * Tracks errors locally in browser storage (no server analytics)
 * Provides error reporting UI for users to optionally report issues
 * 
 * Privacy-first: All data stays in browser until user explicitly reports
 */

/**
 * Error entry structure
 */
interface ErrorEntry {
  readonly timestamp: number;
  readonly message: string;
  readonly stack?: string;
  readonly url: string;
  readonly userAgent: string;
  readonly type: 'error' | 'unhandledrejection';
  readonly reported: boolean;
}

/**
 * Storage key for error log
 */
const ERROR_LOG_KEY = 'warmthly_error_log';
const MAX_ERRORS = 50; // Keep last 50 errors
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Check if storage is available
 */
function isStorageAvailable(): boolean {
  try {
    if (typeof localStorage === 'undefined') {
      return false;
    }
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get error log from storage
 */
function getErrorLog(): ErrorEntry[] {
  if (!isStorageAvailable()) {
    return [];
  }

  try {
    const stored = localStorage.getItem(ERROR_LOG_KEY);
    if (!stored) {
      return [];
    }

    const errors = JSON.parse(stored) as ErrorEntry[];
    const now = Date.now();

    // Filter out old errors
    return errors.filter((error) => now - error.timestamp < MAX_AGE_MS);
  } catch {
    return [];
  }
}

/**
 * Save error log to storage
 */
function saveErrorLog(errors: ErrorEntry[]): void {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    // Keep only last MAX_ERRORS
    const trimmed = errors.slice(-MAX_ERRORS);
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full or unavailable - silently fail
  }
}

/**
 * Add error to log
 */
function addError(error: ErrorEntry): void {
  const errors = getErrorLog();
  errors.push(error);
  saveErrorLog(errors);
}

/**
 * Create error entry from error event
 */
function createErrorEntry(
  error: Error | string,
  type: 'error' | 'unhandledrejection',
  stack?: string
): ErrorEntry {
  const message = error instanceof Error ? error.message : String(error);
  const errorStack = stack || (error instanceof Error ? error.stack : undefined);

  return {
    timestamp: Date.now(),
    message,
    stack: errorStack,
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    type,
    reported: false,
  };
}

/**
 * Track JavaScript error
 */
export function trackError(error: Error, event?: ErrorEvent): void {
  if (import.meta.env.DEV) {
    console.error('Error tracked:', error);
  }

  const entry = createErrorEntry(
    error,
    'error',
    event?.error?.stack || error.stack
  );

  addError(entry);
}

/**
 * Track unhandled promise rejection
 */
export function trackUnhandledRejection(reason: unknown): void {
  if (import.meta.env.DEV) {
    console.error('Unhandled rejection tracked:', reason);
  }

  const error = reason instanceof Error ? reason : new Error(String(reason));
  const entry = createErrorEntry(error, 'unhandledrejection');

  addError(entry);
}

/**
 * Get error log (for reporting UI)
 */
export function getErrorLogForReporting(): readonly ErrorEntry[] {
  return getErrorLog().filter((error) => !error.reported);
}

/**
 * Mark errors as reported
 */
export function markErrorsAsReported(errorIds: number[]): void {
  const errors = getErrorLog();
  const updated = errors.map((error, index) => {
    if (errorIds.includes(index)) {
      return { ...error, reported: true };
    }
    return error;
  });
  saveErrorLog(updated);
}

/**
 * Clear error log
 */
export function clearErrorLog(): void {
  if (isStorageAvailable()) {
    try {
      localStorage.removeItem(ERROR_LOG_KEY);
    } catch {
      // Silently fail
    }
  }
}

/**
 * Format error for user-friendly display
 */
export function formatErrorForUser(error: ErrorEntry): string {
  const date = new Date(error.timestamp).toLocaleString();
  return `[${date}] ${error.message}`;
}

/**
 * Get error count
 */
export function getErrorCount(): number {
  return getErrorLog().length;
}

/**
 * Check if there are unreported errors
 */
export function hasUnreportedErrors(): boolean {
  return getErrorLog().some((error) => !error.reported);
}

