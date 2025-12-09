/**
 * Enhanced Input Validation Utilities
 * Provides comprehensive validation and sanitization for API inputs
 * Strengthens security by validating all user inputs
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly error?: string;
  readonly sanitized?: string | number;
}

/**
 * String validation options
 */
export interface StringValidationOptions {
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: RegExp;
  readonly required?: boolean;
  readonly trim?: boolean;
  readonly allowEmpty?: boolean;
}

/**
 * Number validation options
 */
export interface NumberValidationOptions {
  readonly min?: number;
  readonly max?: number;
  readonly integer?: boolean;
  readonly required?: boolean;
}

/**
 * Email validation options
 */
export interface EmailValidationOptions {
  readonly required?: boolean;
  readonly maxLength?: number;
}

/**
 * Validate and sanitize a string input
 *
 * @param value - Value to validate
 * @param options - Validation options
 * @returns Validation result with sanitized value
 */
export function validateString(
  value: unknown,
  options: StringValidationOptions = {}
): ValidationResult {
  const {
    minLength = 0,
    maxLength = 10000,
    pattern,
    required = false,
    trim = true,
    allowEmpty = false,
  } = options;

  // Check if value is provided
  if (value === null || value === undefined) {
    if (required) {
      return { valid: false, error: 'This field is required' };
    }
    return { valid: true, sanitized: '' };
  }

  // Convert to string
  let str = String(value);

  // Trim if requested
  if (trim) {
    str = str.trim();
  }

  // Check empty
  if (!allowEmpty && str.length === 0) {
    if (required) {
      return { valid: false, error: 'This field cannot be empty' };
    }
    return { valid: true, sanitized: '' };
  }

  // Check length
  if (str.length < minLength) {
    return {
      valid: false,
      error: `Must be at least ${minLength} characters long`,
    };
  }

  if (str.length > maxLength) {
    return {
      valid: false,
      error: `Must be no more than ${maxLength} characters long`,
    };
  }

  // Check pattern
  if (pattern && !pattern.test(str)) {
    return { valid: false, error: 'Invalid format' };
  }

  // Sanitize: remove control characters except newlines and tabs
  const sanitized = str.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  return { valid: true, sanitized };
}

/**
 * Validate and sanitize a number input
 *
 * @param value - Value to validate
 * @param options - Validation options
 * @returns Validation result with sanitized value
 */
export function validateNumber(
  value: unknown,
  options: NumberValidationOptions = {}
): ValidationResult {
  const { min, max, integer = false, required = false } = options;

  // Check if value is provided
  if (value === null || value === undefined) {
    if (required) {
      return { valid: false, error: 'This field is required' };
    }
    return { valid: true, sanitized: 0 };
  }

  // Convert to number
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);

  // Check if valid number
  if (isNaN(num) || !isFinite(num)) {
    return { valid: false, error: 'Must be a valid number' };
  }

  // Check integer
  if (integer && !Number.isInteger(num)) {
    return { valid: false, error: 'Must be an integer' };
  }

  // Check min
  if (min !== undefined && num < min) {
    return { valid: false, error: `Must be at least ${min}` };
  }

  // Check max
  if (max !== undefined && num > max) {
    return { valid: false, error: `Must be no more than ${max}` };
  }

  return { valid: true, sanitized: integer ? Math.round(num) : num };
}

/**
 * Validate an email address
 *
 * @param value - Email to validate
 * @param options - Validation options
 * @returns Validation result with sanitized email
 */
export function validateEmail(
  value: unknown,
  options: EmailValidationOptions = {}
): ValidationResult {
  const { required = false, maxLength = 254 } = options;

  // Check if value is provided
  if (value === null || value === undefined || value === '') {
    if (required) {
      return { valid: false, error: 'Email address is required' };
    }
    return { valid: true, sanitized: '' };
  }

  const email = String(value).trim().toLowerCase();

  // Check length
  if (email.length > maxLength) {
    return {
      valid: false,
      error: `Email must be no more than ${maxLength} characters`,
    };
  }

  // RFC 5322 compliant email regex (simplified)
  const emailRegex =
    /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email address format' };
  }

  return { valid: true, sanitized: email };
}

/**
 * Validate a URL
 *
 * @param value - URL to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateUrl(
  value: unknown,
  options: { readonly required?: boolean; readonly allowedProtocols?: readonly string[] } = {}
): ValidationResult {
  const { required = false, allowedProtocols = ['https:'] } = options;

  // Check if value is provided
  if (value === null || value === undefined || value === '') {
    if (required) {
      return { valid: false, error: 'URL is required' };
    }
    return { valid: true, sanitized: '' };
  }

  const urlStr = String(value).trim();

  try {
    const url = new URL(urlStr);

    // Check protocol
    if (!allowedProtocols.includes(url.protocol)) {
      return {
        valid: false,
        error: `URL must use one of: ${allowedProtocols.join(', ')}`,
      };
    }

    return { valid: true, sanitized: url.toString() };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate currency code (ISO 4217)
 *
 * @param value - Currency code to validate
 * @param allowedCurrencies - List of allowed currency codes
 * @returns Validation result
 */
export function validateCurrency(
  value: unknown,
  allowedCurrencies: readonly string[] = ['USD', 'EUR', 'GBP', 'ZAR', 'CAD', 'AUD']
): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: 'Currency code is required' };
  }

  const currency = String(value).trim().toUpperCase();

  if (!allowedCurrencies.includes(currency)) {
    return {
      valid: false,
      error: `Invalid currency code. Allowed: ${allowedCurrencies.join(', ')}`,
    };
  }

  return { valid: true, sanitized: currency };
}

/**
 * Detect common attack patterns in input
 * Security Enhancement 10: Enhanced Input Validation
 *
 * @param input - Input string to check
 * @returns Object with detected attack type and details
 */
export function detectAttackPatterns(input: string): {
  readonly detected: boolean;
  readonly attackType?:
    | 'xss'
    | 'sql_injection'
    | 'path_traversal'
    | 'command_injection'
    | 'ldap_injection';
  readonly pattern?: string;
} {
  if (!input || typeof input !== 'string') {
    return { detected: false };
  }

  // XSS attack patterns
  const xssPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /vbscript:/i,
    /data:text\/html/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /<link[^>]*>/i,
    /<meta[^>]*>/i,
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      return { detected: true, attackType: 'xss', pattern: pattern.source };
    }
  }

  // SQL injection patterns (even though we don't use SQL, detect for logging)
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/i,
    /('|(\\')|(;)|(\-\-)|(\/\*)|(\*\/)|(\+)|(\%27)|(\%22))/i,
    /(\bOR\b\s*\d+\s*=\s*\d+)/i,
    /(\bAND\b\s*\d+\s*=\s*\d+)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      return { detected: true, attackType: 'sql_injection', pattern: pattern.source };
    }
  }

  // Path traversal patterns
  const pathTraversalPatterns = [
    /\.\.\//g,
    /\.\.\\/g,
    /\.\.%2F/i,
    /\.\.%5C/i,
    /\.\.%252F/i,
    /\.\.%255C/i,
  ];

  for (const pattern of pathTraversalPatterns) {
    if (pattern.test(input)) {
      return { detected: true, attackType: 'path_traversal', pattern: pattern.source };
    }
  }

  // Command injection patterns
  const commandInjectionPatterns = [
    /[;&|`$(){}[\]]/,
    /\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig)\b/i,
    /\|\s*\w+/,
    /;\s*\w+/,
    /\$\s*\(/,
    /\$\{/,
  ];

  for (const pattern of commandInjectionPatterns) {
    if (pattern.test(input)) {
      return { detected: true, attackType: 'command_injection', pattern: pattern.source };
    }
  }

  // LDAP injection patterns
  const ldapPatterns = [/[()&|!]/, /\*\)/, /\(&/, /\(|/, /\(!/];

  for (const pattern of ldapPatterns) {
    if (pattern.test(input)) {
      return { detected: true, attackType: 'ldap_injection', pattern: pattern.source };
    }
  }

  return { detected: false };
}

/**
 * Sanitize HTML content (basic)
 * Removes potentially dangerous HTML tags and attributes
 *
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  let sanitized = html;

  // Remove script tags and their content - Unicode-aware regex to handle multi-byte characters
  // Use [\s\S] with Unicode flag (u) to match newlines and all characters including Unicode
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/giu, '');

  // Remove style tags and their content
  sanitized = sanitized.replace(/<style[\s\S]*?<\/style>/giu, '');

  // Remove iframe, object, embed tags
  sanitized = sanitized.replace(/<(iframe|object|embed)[\s\S]*?<\/\1>/giu, '');

  // Remove event handlers (onclick, onerror, etc.) - Unicode-aware
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][\s\S]*?["']/giu, '');

  // Remove javascript: protocol (case-insensitive, handle encoded characters)
  sanitized = sanitized.replace(/j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: URLs in img/src (except data:image) - improved regex
  sanitized = sanitized.replace(/src\s*=\s*["']data:(?!image\/)[\s\S]*?["']/gi, '');
  
  // Remove dangerous protocols in href attributes
  sanitized = sanitized.replace(/href\s*=\s*["'](javascript|vbscript|file|data):[\s\S]*?["']/gi, '');

  return sanitized;
}

/**
 * Validate input with attack pattern detection
 * Security Enhancement 10: Enhanced Input Validation
 *
 * @param value - Value to validate
 * @param options - Validation options
 * @returns Validation result with attack detection
 */
export function validateInputWithAttackDetection(
  value: unknown,
  options: {
    readonly fieldName?: string;
    readonly logAttack?: boolean;
    readonly rejectOnAttack?: boolean;
  } = {}
): ValidationResult & {
  readonly attackDetected?: boolean;
  readonly attackType?: string;
} {
  if (typeof value !== 'string') {
    return { valid: true };
  }

  const attack = detectAttackPatterns(value);

  if (attack.detected) {
    // Log attack attempt if enabled
    if (options.logAttack !== false) {
      // Import security monitor dynamically to avoid circular dependencies
      import('../security/security-monitor.js').then(({ SecurityLogger }) => {
        if (attack.attackType === 'xss') {
          SecurityLogger.xssAttempt('unknown', undefined, {
            field: options.fieldName,
            pattern: attack.pattern,
            input: value.substring(0, 100), // Log first 100 chars only
          });
        } else if (attack.attackType === 'sql_injection') {
          // Use generic suspicious activity for SQL injection
          import('../security/security-monitor.js').then(
            ({ logSecurityEvent, SecurityEventSeverity }) => {
              logSecurityEvent({
                type: 'sql_injection_attempt',
                severity: SecurityEventSeverity.CRITICAL,
                timestamp: Date.now(),
                identifier: 'unknown',
                details: {
                  field: options.fieldName,
                  pattern: attack.pattern,
                  input: value.substring(0, 100),
                },
              });
            }
          );
        }
      });
    }

    // Reject if configured
    if (options.rejectOnAttack) {
      return {
        valid: false,
        error: 'Invalid input detected',
        attackDetected: true,
        attackType: attack.attackType,
      };
    }
  }

  return { valid: true, attackDetected: attack.detected, attackType: attack.attackType };
}

/**
 * Validate request body structure
 *
 * @param body - Request body to validate
 * @param schema - Validation schema
 * @returns Validation result
 */
export function validateRequestBody(
  body: unknown,
  schema: Record<string, (value: unknown) => ValidationResult>
): {
  readonly valid: boolean;
  readonly errors?: Record<string, string>;
  readonly sanitized?: Record<string, unknown>;
} {
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: { _: 'Invalid request body' } };
  }

  const errors: Record<string, string> = {};
  const sanitized: Record<string, unknown> = {};

  for (const [key, validator] of Object.entries(schema)) {
    const result = validator((body as Record<string, unknown>)[key]);
    if (!result.valid) {
      errors[key] = result.error || 'Invalid value';
    } else if (result.sanitized !== undefined) {
      sanitized[key] = result.sanitized;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, sanitized };
}
