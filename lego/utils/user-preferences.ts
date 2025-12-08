/**
 * User Preferences Utility
 * Manages user preferences stored in localStorage
 * Supports WCAG 2.1 AAA Success Criterion 2.2.3 - No Timing
 * Allows users to adjust timeout durations for popups and notifications
 */

/**
 * Timeout preference options
 */
export type TimeoutPreference = 'default' | 'extended' | 'no-timeout';

/**
 * User preferences interface
 */
export interface UserPreferences {
  timeoutPreference: TimeoutPreference;
  errorPopupTimeout?: number;
  successPopupTimeout?: number;
}

/**
 * Storage key for user preferences
 */
const PREFERENCES_STORAGE_KEY = 'warmthly-user-preferences';

/**
 * Default timeout values (from config)
 */
const DEFAULT_ERROR_TIMEOUT = 8000; // 8 seconds
const DEFAULT_SUCCESS_TIMEOUT = 5000; // 5 seconds

/**
 * Extended timeout multipliers
 */
const EXTENDED_MULTIPLIER = 3; // 3x the default timeout

/**
 * Get user preferences from localStorage
 * @returns User preferences object or null if not set
 */
export function getUserPreferences(): UserPreferences | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as UserPreferences;
  } catch (error) {
    // Invalid JSON or other error
    if (import.meta.env.DEV) {
      console.warn('Failed to parse user preferences:', error);
    }
    return null;
  }
}

/**
 * Save user preferences to localStorage
 * @param preferences - User preferences to save
 */
export function saveUserPreferences(preferences: Partial<UserPreferences>): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  try {
    const existing = getUserPreferences();
    const updated: UserPreferences = {
      timeoutPreference: existing?.timeoutPreference || 'default',
      errorPopupTimeout: existing?.errorPopupTimeout,
      successPopupTimeout: existing?.successPopupTimeout,
      ...preferences,
    };
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to save user preferences:', error);
    }
  }
}

/**
 * Get timeout preference
 * @returns Current timeout preference, defaults to 'default'
 */
export function getTimeoutPreference(): TimeoutPreference {
  const prefs = getUserPreferences();
  return prefs?.timeoutPreference || 'default';
}

/**
 * Set timeout preference
 * @param preference - Timeout preference to set
 */
export function setTimeoutPreference(preference: TimeoutPreference): void {
  saveUserPreferences({ timeoutPreference: preference });
}

/**
 * Calculate actual timeout duration based on user preference
 * @param defaultTimeout - Default timeout in milliseconds
 * @param preference - Optional timeout preference (uses stored preference if not provided)
 * @returns Actual timeout in milliseconds, or null if no-timeout
 */
export function getAdjustedTimeout(
  defaultTimeout: number,
  preference?: TimeoutPreference
): number | null {
  const pref = preference || getTimeoutPreference();

  switch (pref) {
    case 'no-timeout':
      return null; // No automatic timeout
    case 'extended':
      return defaultTimeout * EXTENDED_MULTIPLIER;
    case 'default':
    default:
      return defaultTimeout;
  }
}

/**
 * Get adjusted error popup timeout
 * @param defaultTimeout - Default error timeout (from config)
 * @returns Adjusted timeout or null if no-timeout
 */
export function getErrorPopupTimeout(
  defaultTimeout: number = DEFAULT_ERROR_TIMEOUT
): number | null {
  const prefs = getUserPreferences();

  // Check if user has explicitly set a custom timeout
  if (prefs?.errorPopupTimeout !== undefined) {
    return prefs.errorPopupTimeout === -1 ? null : prefs.errorPopupTimeout;
  }

  return getAdjustedTimeout(defaultTimeout);
}

/**
 * Get adjusted success popup timeout
 * @param defaultTimeout - Default success timeout (from config)
 * @returns Adjusted timeout or null if no-timeout
 */
export function getSuccessPopupTimeout(
  defaultTimeout: number = DEFAULT_SUCCESS_TIMEOUT
): number | null {
  const prefs = getUserPreferences();

  // Check if user has explicitly set a custom timeout
  if (prefs?.successPopupTimeout !== undefined) {
    return prefs.successPopupTimeout === -1 ? null : prefs.successPopupTimeout;
  }

  return getAdjustedTimeout(defaultTimeout);
}

/**
 * Set custom timeout values
 * @param errorTimeout - Error popup timeout in ms (-1 for no timeout)
 * @param successTimeout - Success popup timeout in ms (-1 for no timeout)
 */
export function setCustomTimeouts(errorTimeout?: number, successTimeout?: number): void {
  const prefs: Partial<UserPreferences> = {};

  if (errorTimeout !== undefined) {
    prefs.errorPopupTimeout = errorTimeout;
  }

  if (successTimeout !== undefined) {
    prefs.successPopupTimeout = successTimeout;
  }

  saveUserPreferences(prefs);
}

/**
 * Reset preferences to defaults
 */
export function resetPreferences(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(PREFERENCES_STORAGE_KEY);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to reset preferences:', error);
    }
  }
}
