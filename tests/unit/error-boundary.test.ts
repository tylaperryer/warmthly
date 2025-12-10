/**
 * Error Boundary Tests
 * Tests for lego/core/error-boundary.ts
 */

import { getContainer, resetContainer } from '@core/di-container.js';
import {
  ErrorBoundary,
  ErrorSeverity,
  ContextualError,
  getErrorBoundary,
} from '@core/error-boundary.js';
import { ServiceIdentifiers, createLoggerService } from '@core/services/index.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Error Boundary', () => {
  beforeEach(() => {
    resetContainer();
    const container = getContainer();
    container.register(ServiceIdentifiers.Logger, () => createLoggerService(), true);
  });

  it('should create error boundary instance', () => {
    const boundary = new ErrorBoundary();
    (expect(boundary) as any).toBeInstanceOf(ErrorBoundary);
  });

  it('should handle error with default strategy', async () => {
    const boundary = new ErrorBoundary();
    const error = new Error('Test error');
    const context = {
      severity: ErrorSeverity.LOW,
      recoverable: true,
    };

    const result = await boundary.handleError(error, context);
    expect(result).toBe(true);
  });

  it('should add custom recovery strategy', async () => {
    const boundary = new ErrorBoundary();
    const customStrategy = {
      canHandle: () => true,
      recover: vi.fn().mockResolvedValue(undefined),
    } as any;

    boundary.addStrategy(customStrategy);

    const error = new Error('Test error');
    const context = {
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
    };

    await boundary.handleError(error, context);
    expect(customStrategy.recover).toHaveBeenCalled();
  });

  it('should handle contextual error', async () => {
    const boundary = new ErrorBoundary();
    const context = {
      severity: ErrorSeverity.HIGH,
      component: 'TestComponent',
      recoverable: false,
    };
    const contextualError = new ContextualError('Contextual error', context);

    const result = await boundary.handleError(contextualError, context);
    expect(result).toBe(true);
  });

  it('should handle critical errors', async () => {
    const boundary = new ErrorBoundary();
    const error = new Error('Critical error');
    const context = {
      severity: ErrorSeverity.CRITICAL,
      recoverable: false,
    };

    const result = await boundary.handleError(error, context);
    expect(result).toBe(true);
  });

  it('should get error boundary singleton', () => {
    const boundary1 = getErrorBoundary();
    const boundary2 = getErrorBoundary();
    expect(boundary1).toBe(boundary2);
  });

  it('should handle recovery strategy failure', async () => {
    const boundary = new ErrorBoundary();
    const failingStrategy = {
      canHandle: () => true,
      recover: vi.fn().mockRejectedValue(new Error('Recovery failed')),
    };

    boundary.addStrategy(failingStrategy);

    const error = new Error('Test error');
    const context = {
      severity: ErrorSeverity.MEDIUM,
      recoverable: true,
    };

    const result = await boundary.handleError(error, context);
    expect(result).toBe(true); // Should still return true as other strategies may handle it
  });
});
