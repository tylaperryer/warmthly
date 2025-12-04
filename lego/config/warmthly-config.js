/**
 * Warmthly Stoplight Menu Web Component
 * Reusable stoplight navigation menu
 * Uses global config for navigation items
 * 
 * Usage (auto-generate from app):
 * <warmthly-stoplight app="main"></warmthly-stoplight>
 * 
 * Usage (custom menu items):
 * <warmthly-stoplight>
 *   <a href="https://www.warmthly.org" class="dropdown-item">Home</a>
 *   <a href="https://mint.warmthly.org" class="dropdown-item">Mint</a>
 * </warmthly-stoplight>
 */

import { WARMTHLY_CONFIG, getNavigation } from '../config/warmthly-config.js';

class WarmthlyStoplight extends HTMLElement {
  async connectedCallback() {
    const app = this.getAttribute('app') || '';
    const customItems = this.innerHTML.trim();
    
    let menuItems = customItems;
    
    // Auto-generate menu from config if app is provided and no custom items
    if (app && !customItems) {
      const navItems = getNavigation(app);
      menuItems = navItems.map(item => {
        const classes = item.class ? `dropdown-item ${item.class}` : 'dropdown-item';
        const ariaLabel = item.ariaLabel ? ` aria-label="${item.ariaLabel}"` : '';
        return `<a href="${item.url}" class="${classes}"${ariaLabel}>${item.label}</a>`;
      }).join('\n');
    }
    
    // Generate unique IDs for this instance
    const instanceId = `stoplight-${Math.random().toString(36).substr(2, 9)}`;
    const stoplightId = `stoplight-${instanceId}`;
    const menuId = `dropdown-menu-${instanceId}`;
    
    this.innerHTML = `
      <div class="stoplight-container">
        <div class="stoplight" id="${stoplightId}">
          <div class="stoplight-dot red"></div>
          <div class="stoplight-dot yellow"></div>
          <div class="stoplight-dot green"></div>
        </div>
        <div class="dropdown-menu" id="${menuId}">
          ${menuItems}
        </div>
      </div>
    `;
    
    // Initialize stoplight functionality
    const { initStoplight } = await import('../components/stoplight/stoplight.js');
    initStoplight(stoplightId, menuId);
  }
}

customElements.define('warmthly-stoplight', WarmthlyStoplight);

