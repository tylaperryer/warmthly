/**
 * Warmthly Header Web Component
 * Reusable header component for all subdomains
 * Uses global config for URLs
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

import { WARMTHLY_CONFIG, getAppUrl } from '../config/warmthly-config.js';

class WarmthlyHeader extends HTMLElement {
  async connectedCallback() {
    const app = this.getAttribute('app') || '';
    const subdomainUrl = this.getAttribute('subdomain-url') || '';
    const subdomainName = this.getAttribute('subdomain-name') || '';
    const subdomainClass = this.getAttribute('subdomain-class') || '';
    
    // Auto-detect app from URL if not provided
    let detectedApp = app;
    if (!detectedApp) {
      const hostname = window.location.hostname;
      if (hostname.includes('mint.')) detectedApp = 'mint';
      else if (hostname.includes('post.')) detectedApp = 'post';
      else if (hostname.includes('admin.')) detectedApp = 'admin';
      else detectedApp = 'main';
    }
    
    // Get URLs from config
    const mainUrl = WARMTHLY_CONFIG.urls.main;
    let currentUrl = subdomainUrl;
    let currentName = subdomainName;
    let currentClass = subdomainClass;
    
    // Auto-generate if app is provided
    if (app && !subdomainUrl) {
      currentUrl = getAppUrl(app);
      const appNames = {
        main: '',
        mint: 'Mint',
        post: 'Post',
        admin: 'Admin'
      };
      const appClasses = {
        main: '',
        mint: 'mint-text',
        post: 'post-text',
        admin: 'admin-text'
      };
      currentName = appNames[app] || '';
      currentClass = appClasses[app] || '';
    }
    
    this.innerHTML = `
      <div class="top-left-heading">
        <a href="${mainUrl}" class="warmthly-link">Warmthly</a>
        ${currentName ? `<a href="${currentUrl}" class="${currentClass}">${currentName}</a>` : ''}
      </div>
    `;
  }
}

customElements.define('warmthly-header', WarmthlyHeader);

