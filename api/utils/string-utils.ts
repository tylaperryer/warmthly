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

