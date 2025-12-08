/**
 * Error Tracker Tests
 * Tests for lego/utils/error-tracker.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  trackError,
  trackUnhandledRejection,
  getErrorCount,
  getErrorLogForReporting,
  markErrorsAsReported,
  clearErrorLog,
  formatErrorForUser,
  hasUnreportedErrors,
} from '@utils/error-tracker.js';

describe('Error Tracker', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should track error', () => {
    const error = new Error('Test error');

    trackError(error);

    expect(getErrorCount()).toBe(1);
  });

  it('should track unhandled rejection', () => {
    trackUnhandledRejection(new Error('Rejection error'));

    expect(getErrorCount()).toBe(1);
  });

  it('should get error log for reporting', () => {
    const error = new Error('Test error');

    trackError(error);

    const errors = getErrorLogForReporting();
    expect(errors.length).toBe(1);
    expect(errors[0]?.message).toBe('Test error');
  });

  it('should mark errors as reported', () => {
    const error = new Error('Test error');

    trackError(error);
    markErrorsAsReported([0]);

    const errors = getErrorLogForReporting();
    expect(errors.length).toBe(0);
  });

  it('should clear error log', () => {
    const error = new Error('Test error');

    trackError(error);
    expect(getErrorCount()).toBe(1);

    clearErrorLog();
    expect(getErrorCount()).toBe(0);
  });

  it('should format error for user', () => {
    const error = new Error('Test error');

    trackError(error);

    const errors = getErrorLogForReporting();
    const formatted = formatErrorForUser(errors[0]!);

    expect(formatted).toContain('Test error');
  });

  it('should check for unreported errors', () => {
    const error = new Error('Test error');

    expect(hasUnreportedErrors()).toBe(false);

    trackError(error);
    expect(hasUnreportedErrors()).toBe(true);
  });
});
