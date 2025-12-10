/**
 * Warmthly i18n Web Component
 * Provides language switching and translation functionality
 * Supports all 7,019+ languages from universal language database
 */

import { API_CONFIG } from '@config/api-config.js';
import { getErrorBoundary, ErrorSeverity } from '@core/error-boundary.js';
import { getI18n, getLanguage } from '@utils/i18n.js';
import { updateRTLSupport, isRTL } from '@utils/rtl-support.js';
import { setSafeHtml } from '@utils/sanitize.js';

/**
 * Validate language code
 * Supports ISO 639-1 (2-letter), ISO 639-2 (3-letter), and ISO 639-3 (3-letter) codes
 */
async function validateLanguageCode(langCode: string): Promise<boolean> {
  if (!langCode || typeof langCode !== 'string') {
    return false;
  }

  // Normalize language code (remove locale suffix, convert to lowercase)
  const normalized = langCode.toLowerCase().split('-')[0]?.split('_')[0];

  // Basic validation: 2-3 letter codes
  if (!normalized || normalized.length < 2 || normalized.length > 3) {
    return false;
  }

  // Check if language is available via API
  try {
    const response = await fetch(API_CONFIG.getUrl('api/i18n/languages'));
    if (response.ok) {
      const data = await response.json();
      const availableLanguages: string[] = data.languages || [];
      return availableLanguages.includes(normalized);
    }
  } catch {
    // If API fails, allow the code (will be validated by translation service)
    return true;
  }

  return true;
}

class WarmthlyI18n extends HTMLElement {
  private i18n = getI18n();
  private observer: MutationObserver | null = null;
  private currentLanguage: string = 'en';

  connectedCallback() {
    try {
      void this.init();
      this.setupLanguageSwitcher();
      this.translatePage();

      // Watch for language changes
      window.addEventListener('languagechange', () => {
        this.translatePage();
      });

      // Watch for custom language-changed events
      window.addEventListener('language-changed', ((e: CustomEvent) => {
        if (e.detail?.language) {
          this.handleLanguageChange(e.detail.language);
        }
      }) as EventListener);
    } catch (error: unknown) {
      // Use error boundary for consistent error handling
      const errorBoundary = getErrorBoundary();
      const errorObj = error instanceof Error ? error : new Error(String(error));
      errorBoundary.handleError(errorObj, {
        severity: ErrorSeverity.MEDIUM,
        component: 'warmthly-i18n',
        operation: 'connectedCallback',
        userMessage: 'Failed to initialize internationalization component',
        recoverable: true,
        metadata: { tagName: this.tagName },
      });
    }
  }

  disconnectedCallback() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private async init() {
    try {
      // Get language from URL, localStorage, or browser
      const urlParams = new URLSearchParams(window.location.search);
      const langFromUrl = urlParams.get('lang');

      let currentLang = langFromUrl || getLanguage() || 'en';
      if (!currentLang || typeof currentLang !== 'string') {
        currentLang = 'en';
      }

      // Validate language code
      const isValid = await validateLanguageCode(currentLang);
      if (!isValid && currentLang !== 'en') {
        // Phase 7 Issue 7.6: Environment-aware logging
        if (import.meta.env?.DEV) {
          console.warn(`[i18n] Invalid language code: ${currentLang}, falling back to English`);
        }
        currentLang = 'en';
      }

      this.currentLanguage = currentLang;

      // Initialize i18n and load current language
      await this.i18n.setLanguage(currentLang);
      updateRTLSupport(currentLang); // Apply RTL support if needed

      // Update document lang attribute
      if (document.documentElement) {
        document.documentElement.lang = currentLang;
        document.documentElement.dir = isRTL(currentLang) ? 'rtl' : 'ltr';
      }

      this.translatePage();
    } catch (error: unknown) {
      // Use error boundary for consistent error handling
      const errorBoundary = getErrorBoundary();
      const errorObj = error instanceof Error ? error : new Error(String(error));
      await errorBoundary.handleError(errorObj, {
        severity: ErrorSeverity.MEDIUM,
        component: 'warmthly-i18n',
        operation: 'init',
        userMessage: 'Failed to initialize internationalization',
        recoverable: true,
        metadata: { tagName: this.tagName },
      });
    }
  }

  /**
   * Handle language change
   */
  private async handleLanguageChange(newLang: string): Promise<void> {
    // Validate language code
    const isValid = await validateLanguageCode(newLang);
    if (!isValid) {
      // Phase 7 Issue 7.6: Environment-aware logging
      if (import.meta.env?.DEV) {
        console.warn(`[i18n] Invalid language code: ${newLang}`);
      }
      return;
    }

    this.currentLanguage = newLang;

    // Update i18n system
    await this.i18n.setLanguage(newLang);

    // Update RTL support
    updateRTLSupport(newLang);

    // Update document attributes
    if (document.documentElement) {
      document.documentElement.lang = newLang;
      document.documentElement.dir = isRTL(newLang) ? 'rtl' : 'ltr';
    }

    // Refresh translations
    this.translatePage();

    // Dispatch event
    this.dispatchEvent(
      new CustomEvent('i18n-language-changed', {
        detail: { language: newLang },
        bubbles: true,
      })
    );
  }

  /**
   * Setup language switcher dropdown
   * Supports all 7,019+ languages via API
   */
  private setupLanguageSwitcher() {
    const switcher = document.querySelector('[data-i18n-switcher]');
    if (!switcher) {
      return;
    }

    switcher.addEventListener('change', e => {
      const target = e.target as HTMLSelectElement;
      const newLang = target.value;

      // Validate language code
      void (async () => {
        const isValid = await validateLanguageCode(newLang);
        if (!isValid) {
          // Phase 7 Issue 7.6: Environment-aware logging
          if (import.meta.env?.DEV) {
            console.warn(`[i18n] Invalid language code: ${newLang}`);
          }
          // Reset to current language
          (switcher as HTMLSelectElement).value = this.currentLanguage;
          return;
        }

        await this.handleLanguageChange(newLang);
      })();
    });

    // Set current language
    (switcher as HTMLSelectElement).value = this.currentLanguage;
  }

  /**
   * Translate all elements with data-i18n attributes
   */
  private translatePage() {
    // Translate elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (key) {
        const params: Record<string, string | number> = {};

        // Extract parameters from data attributes
        Array.from(element.attributes).forEach(attr => {
          if (attr.name.startsWith('data-i18n-param-')) {
            const paramName = attr.name.replace('data-i18n-param-', '');
            params[paramName] = attr.value;
          }
        });

        const translation = this.i18n.t(key, params);

        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          (element as HTMLInputElement).placeholder = translation;
        } else if (element.hasAttribute('data-i18n-html')) {
          // Phase 7 Issue 7.1: Use sanitized HTML to prevent XSS
          // Sanitize HTML content from translations to prevent XSS attacks
          if (element instanceof HTMLElement) {
            setSafeHtml(element, translation);
          }
        } else {
          element.textContent = translation;
        }
      }
    });

    // Translate title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      if (key) {
        element.setAttribute('title', this.i18n.t(key));
      }
    });

    // Translate aria-label attributes
    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
      const key = element.getAttribute('data-i18n-aria-label');
      if (key) {
        element.setAttribute('aria-label', this.i18n.t(key));
      }
    });
  }

  /**
   * Get translation (public method)
   */
  getTranslation(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }
}

// Register the component
customElements.define('warmthly-i18n', WarmthlyI18n);

// Export for use in scripts
export { WarmthlyI18n };
