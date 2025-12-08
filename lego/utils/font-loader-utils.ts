/**
 * Font Loader Utility
 * Handles font loading and prevents FOUT (Flash of Unstyled Text)
 * Provides type-safe font loading with proper error handling
 *
 * Usage: Import this module and it will automatically handle font loading
 */

/**
 * Font loading timeout in milliseconds
 * Falls back to showing fonts after this time even if not loaded
 */
const FONT_LOAD_TIMEOUT = 3000;

/**
 * Initialize font loader
 * Removes 'fonts-loading' class and adds 'fonts-loaded' class when fonts are ready
 * Includes fallback timeout to ensure fonts are shown even if API fails
 */
export function initFontLoader(): void {
  // Safety check for browser environment
  if (typeof document === 'undefined' || typeof document.body === 'undefined') {
    return;
  }

  const body = document.body;

  // Check if Font Loading API is available
  if (document.fonts?.ready) {
    // Wait for fonts to load
    document.fonts.ready
      .then(() => {
        body.classList.remove('fonts-loading');
        body.classList.add('fonts-loaded');
      })
      .catch((error: unknown) => {
        // Log error in development, but still show fonts
        if (import.meta.env.DEV) {
          console.warn('Font loading API error:', error);
        }
        // Fallback: show fonts anyway
        body.classList.remove('fonts-loading');
        body.classList.add('fonts-loaded');
      });

    // Fallback timeout: ensure fonts are shown even if API doesn't resolve
    setTimeout(() => {
      body.classList.remove('fonts-loading');
      body.classList.add('fonts-loaded');
    }, FONT_LOAD_TIMEOUT);
  } else {
    // Font Loading API not available, show fonts immediately
    body.classList.remove('fonts-loading');
    body.classList.add('fonts-loaded');
  }
}

/**
 * Auto-initialize font loader if body has 'fonts-loading' class
 * Only runs in browser environment
 */
if (typeof document !== 'undefined' && document.body?.classList.contains('fonts-loading')) {
  initFontLoader();
}
