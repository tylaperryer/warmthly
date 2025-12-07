/**
 * Warmthly Header Web Component
 * Reusable header component for all subdomains
 * Uses global config for URLs and navigation
 * 
 * Usage:
 * <warmthly-header app="mint"></warmthly-header>
 * OR
 * <warmthly-header 
 *   subdomain-url="https://mint.warmthly.org" 
 *   subdomain-name="Mint" 
 *   subdomain-class="mint-text">
 * </warmthly-header>
 */

import { WARMTHLY_CONFIG, getAppUrl, type AppName } from '@config/warmthly-config.js';

/**
 * Application names mapping
 */
const APP_NAMES: Record<AppName, string> = {
  main: '',
  mint: 'Mint',
  post: 'Post',
  admin: 'Admin',
} as const;

/**
 * Application CSS classes mapping
 */
const APP_CLASSES: Record<AppName, string> = {
  main: '',
  mint: 'mint-text',
  post: 'post-text',
  admin: 'admin-text',
} as const;

/**
 * Warmthly Header Web Component
 */
class WarmthlyHeader extends HTMLElement {
  /**
   * Called when element is inserted into the DOM
   * Creates header with main link and optional subdomain link
   */
  async connectedCallback(): Promise<void> {
    // Safety check for browser environment
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    try {
      const app = this.getAttribute('app') || '';
      const subdomainUrl = this.getAttribute('subdomain-url') || '';
      const subdomainName = this.getAttribute('subdomain-name') || '';
      const subdomainClass = this.getAttribute('subdomain-class') || '';

      // Auto-detect app from URL if not provided
      let detectedApp = app;
      if (!detectedApp) {
        const hostname = window.location.hostname;
        if (hostname.includes('mint.')) {
          detectedApp = 'mint';
        } else if (hostname.includes('post.')) {
          detectedApp = 'post';
        } else if (hostname.includes('admin.')) {
          detectedApp = 'admin';
        } else {
          detectedApp = 'main';
        }
      }

      // Get URLs from config
      const mainUrl = WARMTHLY_CONFIG.urls.main;
      let currentUrl = subdomainUrl;
      let currentName = subdomainName;
      let currentClass = subdomainClass;

      // Auto-generate if app is provided
      if (app && !subdomainUrl) {
        currentUrl = getAppUrl(app as AppName);
        currentName = APP_NAMES[app as AppName] || '';
        currentClass = APP_CLASSES[app as AppName] || '';
      }

      // Create container
      const container = document.createElement('div');
      container.className = 'top-left-heading';

      // Create main link
      const mainLink = document.createElement('a');
      mainLink.href = mainUrl;
      mainLink.className = 'warmthly-link';
      mainLink.textContent = 'Warmthly';
      container.appendChild(mainLink);

      // Create subdomain link if needed
      if (currentName) {
        const subLink = document.createElement('a');
        subLink.href = currentUrl;
        subLink.className = currentClass;
        subLink.textContent = currentName;
        container.appendChild(subLink);
      }

      // Clear and append to component
      this.textContent = '';
      this.appendChild(container);
    } catch (error: unknown) {
      // Log error in development
      if (import.meta.env.DEV) {
        console.error('Error in warmthly-header connectedCallback:', error);
      }
    }
  }
}

// Register the custom element
customElements.define('warmthly-header', WarmthlyHeader);

// Export for potential programmatic use
export { WarmthlyHeader };

