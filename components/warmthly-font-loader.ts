/**
 * Warmthly Font Loader Web Component
 * Handles font loading and prevents FOUT (Flash of Unstyled Text)
 *
 * Usage:
 * <warmthly-font-loader></warmthly-font-loader>
 *
 * This component automatically initializes font loading when added to the page.
 * Make sure the body has class="fonts-loading" initially.
 */

import { initFontLoader } from '@utils/font-loader-utils.js';

/**
 * Warmthly Font Loader Web Component
 * Custom element that initializes font loading on connection
 */
class WarmthlyFontLoader extends HTMLElement {
  /**
   * Called when element is inserted into the DOM
   * Initializes font loader
   */
  connectedCallback(): void {
    // Safety check - ensure we're in browser environment
    if (typeof document === 'undefined') {
      return;
    }

    try {
      initFontLoader();
    } catch (error: unknown) {
      // Log error in development, fail silently in production
      if (import.meta.env.DEV) {
        console.error('Failed to initialize font loader:', error);
      }
    }
  }
}

// Register the custom element
customElements.define('warmthly-font-loader', WarmthlyFontLoader);

// Export for potential programmatic use
export { WarmthlyFontLoader };
