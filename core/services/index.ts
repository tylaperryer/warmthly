/**
 * Service Layer
 * Centralized service exports and registration
 */

export { createLoggerService, type ILoggerService, LogLevel } from './logger.service.js';
export { createValidationService, type IValidationService } from './validation.service.js';
export { type IService, type ServiceLifecycle } from './service.interface.js';

/**
 * Service identifiers for DI container
 */
export const ServiceIdentifiers = {
  Logger: Symbol('LoggerService'),
  Validation: Symbol('ValidationService'),
} as const;
