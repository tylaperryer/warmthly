/**
 * String Utilities
 * Safe string conversion functions for logging and validation
 */

/**
 * Safely convert any value to a string
 * Handles objects, arrays, null, undefined, and primitives
 * Prevents "[object Object]" issues in logging
 */
export function safeStringify(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  // For objects and arrays, use JSON.stringify
  try {
    return JSON.stringify(value);
  } catch {
    // Fallback if circular reference or other error
    // Use a safe string representation for objects
    if (value && typeof value === 'object') {
      return '[Object]';
    }
    // At this point, value should be a primitive that can be safely stringified
    // But to satisfy the linter, we explicitly handle the case
    if (typeof value === 'symbol') {
      return value.toString();
    }
    // For any other unknown type, return a safe representation
    if (typeof value === 'object' && value !== null) {
      return '[Object]';
    }
    // For primitives, safely convert to string
    if (value === null || value === undefined) {
      return '';
    }
    // TypeScript-safe string conversion - value is guaranteed to be primitive at this point
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      return String(value);
    }
    // Fallback for any other primitive types (symbol, etc.)
    if (typeof value === 'symbol') {
      return value.toString();
    }
    // This should never happen due to earlier checks, but TypeScript needs this
    return String(value);
  }
}

/**
 * Safely convert value to string for validation
 * Ensures proper string conversion without object stringification warnings
 */
export function safeToString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  // For objects, attempt JSON stringification
  try {
    return JSON.stringify(value);
  } catch {
    // Fallback to empty string for objects that can't be stringified
    return '';
  }
}
