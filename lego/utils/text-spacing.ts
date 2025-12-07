/**
 * Text Spacing Utility
 * Manages user preferences for text spacing adjustments
 * Supports WCAG 2.1 AAA Success Criterion 1.4.8 - Visual Presentation
 * Allows users to adjust letter-spacing, word-spacing, line-height, and paragraph spacing
 */

/**
 * Text spacing preference interface
 */
export interface TextSpacingPreferences {
  letterSpacing: number; // multiplier (default: 1)
  wordSpacing: number; // multiplier (default: 1)
  lineHeight: number; // multiplier (default: 1)
  paragraphSpacing: number; // multiplier (default: 1)
  enabled: boolean;
}

/**
 * Storage key for text spacing preferences
 */
const TEXT_SPACING_STORAGE_KEY = 'warmthly-text-spacing';

/**
 * Default text spacing values (no adjustment)
 */
const DEFAULT_TEXT_SPACING: TextSpacingPreferences = {
  letterSpacing: 1,
  wordSpacing: 1,
  lineHeight: 1,
  paragraphSpacing: 1,
  enabled: false,
};

/**
 * WCAG 2.1 AAA 1.4.8 requirements:
 * - Letter spacing: at least 0.12 times the font size
 * - Word spacing: at least 0.16 times the font size
 * - Line height: at least 1.5 times the font size
 * - Paragraph spacing: at least 2 times the font size
 */
const AAA_MULTIPLIERS: TextSpacingPreferences = {
  letterSpacing: 1.5, // 0.12em * 1.5 ≈ 0.18em (exceeds requirement)
  wordSpacing: 1.5, // 0.16em * 1.5 ≈ 0.24em (exceeds requirement)
  lineHeight: 1.2, // 1.618 * 1.2 ≈ 1.94 (exceeds 1.5 requirement)
  paragraphSpacing: 1.3, // 2x * 1.3 ≈ 2.6x (exceeds requirement)
  enabled: true,
};

/**
 * Get text spacing preferences from localStorage
 * @returns Text spacing preferences
 */
export function getTextSpacingPreferences(): TextSpacingPreferences {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return DEFAULT_TEXT_SPACING;
  }

  try {
    const stored = localStorage.getItem(TEXT_SPACING_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_TEXT_SPACING;
    }
    const parsed = JSON.parse(stored) as Partial<TextSpacingPreferences>;
    return {
      ...DEFAULT_TEXT_SPACING,
      ...parsed,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to parse text spacing preferences:', error);
    }
    return DEFAULT_TEXT_SPACING;
  }
}

/**
 * Save text spacing preferences to localStorage
 * @param preferences - Text spacing preferences to save
 */
export function saveTextSpacingPreferences(
  preferences: Partial<TextSpacingPreferences>
): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  try {
    const existing = getTextSpacingPreferences();
    const updated: TextSpacingPreferences = {
      ...existing,
      ...preferences,
    };
    localStorage.setItem(TEXT_SPACING_STORAGE_KEY, JSON.stringify(updated));
    applyTextSpacing(updated);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to save text spacing preferences:', error);
    }
  }
}

/**
 * Toggle text spacing on/off
 * @param enabled - Whether to enable text spacing adjustments
 */
export function toggleTextSpacing(enabled: boolean): void {
  const prefs = getTextSpacingPreferences();
  if (enabled && !prefs.enabled) {
    // Enable with AAA-compliant values
    saveTextSpacingPreferences({
      ...AAA_MULTIPLIERS,
      enabled: true,
    });
  } else {
    // Disable
    saveTextSpacingPreferences({
      ...DEFAULT_TEXT_SPACING,
      enabled: false,
    });
  }
}

/**
 * Apply text spacing to the document
 * @param preferences - Text spacing preferences to apply
 */
export function applyTextSpacing(
  preferences?: TextSpacingPreferences
): void {
  if (typeof document === 'undefined') {
    return;
  }

  const prefs = preferences || getTextSpacingPreferences();
  const root = document.documentElement;

  if (prefs.enabled) {
    // Apply CSS custom properties
    root.style.setProperty(
      '--text-spacing-letter',
      `${prefs.letterSpacing * 0.12}em`
    );
    root.style.setProperty(
      '--text-spacing-word',
      `${prefs.wordSpacing * 0.16}em`
    );
    root.style.setProperty(
      '--text-spacing-line',
      `${prefs.lineHeight * 1.618}`
    );
    root.style.setProperty(
      '--text-spacing-paragraph',
      `${prefs.paragraphSpacing * 2}rem`
    );
    root.classList.add('text-spacing-enabled');
  } else {
    // Remove custom properties
    root.style.removeProperty('--text-spacing-letter');
    root.style.removeProperty('--text-spacing-word');
    root.style.removeProperty('--text-spacing-line');
    root.style.removeProperty('--text-spacing-paragraph');
    root.classList.remove('text-spacing-enabled');
  }
}

/**
 * Initialize text spacing on page load
 */
export function initTextSpacing(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const prefs = getTextSpacingPreferences();
  applyTextSpacing(prefs);
}

// Auto-initialize when module loads
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTextSpacing);
  } else {
    initTextSpacing();
  }
}

