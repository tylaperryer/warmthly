/**
 * Font Loader Utility
 * Handles font loading and prevents FOUT (Flash of Unstyled Text)
 * Usage: Import this module and it will automatically handle font loading
 */

export function initFontLoader() {
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      document.body.classList.remove('fonts-loading');
      document.body.classList.add('fonts-loaded');
    });
    
    // Fallback timeout
    setTimeout(() => {
      document.body.classList.remove('fonts-loading');
      document.body.classList.add('fonts-loaded');
    }, 3000);
  } else {
    // Fallback for older browsers
    document.body.classList.remove('fonts-loading');
    document.body.classList.add('fonts-loaded');
  }
}

// Auto-initialize if body has fonts-loading class
if (document.body && document.body.classList.contains('fonts-loading')) {
  initFontLoader();
}

