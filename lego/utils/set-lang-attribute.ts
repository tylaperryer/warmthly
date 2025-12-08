/**
 * Set HTML lang attribute dynamically
 * Phase 7 Issue 7.2: Make lang attribute dynamic based on user preference
 * 
 * This script runs synchronously before page load to set the lang attribute
 * for better SEO and accessibility.
 */

/**
 * Get language from URL parameter, localStorage, or browser preference
 * Returns normalized language code (2-3 letters, lowercase)
 */
function detectLanguage(): string {
  // 1. Check URL parameter (highest priority)
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang) {
    const normalized = normalizeLanguageCode(urlLang);
    if (normalized) {
      return normalized;
    }
  }

  // 2. Check localStorage (user preference)
  try {
    const storedLang = localStorage.getItem('warmthly_language');
    if (storedLang) {
      const normalized = normalizeLanguageCode(storedLang);
      if (normalized) {
        return normalized;
      }
    }
  } catch {
    // localStorage may not be available (private browsing, etc.)
  }

  // 3. Check browser language
  const browserLang = navigator.language || (navigator as any).userLanguage;
  if (browserLang) {
    const normalized = normalizeLanguageCode(browserLang);
    if (normalized) {
      return normalized;
    }
  }

  // 4. Default to English
  return 'en';
}

/**
 * Normalize language code to 2-3 letter format
 * Handles formats like: en, en-US, en_US, en-US-x-private
 */
function normalizeLanguageCode(lang: string): string | null {
  if (!lang || typeof lang !== 'string') {
    return null;
  }

  // Remove locale suffix and convert to lowercase
  const normalized = lang.toLowerCase().split('-')[0].split('_')[0].split('.')[0];

  // Basic validation: 2-3 letter codes
  if (normalized.length >= 2 && normalized.length <= 3) {
    return normalized;
  }

  return null;
}

/**
 * Set lang attribute on HTML element
 * This function is called immediately when the script loads
 */
export function setLangAttribute(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const htmlElement = document.documentElement;
  if (!htmlElement) {
    return;
  }

  const detectedLang = detectLanguage();
  htmlElement.setAttribute('lang', detectedLang);

  // Also set dir attribute for RTL languages
  // Note: This is a basic check, full RTL detection happens later
  const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'yi', 'ji', 'iw', 'ji'];
  if (rtlLanguages.includes(detectedLang)) {
    htmlElement.setAttribute('dir', 'rtl');
  } else {
    htmlElement.setAttribute('dir', 'ltr');
  }
}

// Auto-execute when script loads (for inline script usage)
if (typeof document !== 'undefined' && document.readyState === 'loading') {
  setLangAttribute();
}

