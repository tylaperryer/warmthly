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
      menuItems = navItems.map((item, index) => {
        const classes = item.class ? `dropdown-item ${item.class}` : 'dropdown-item';
        const ariaLabel = item.ariaLabel ? ` aria-label="${item.ariaLabel}"` : '';
        const id = `nav-item-${app}-${index}`;
        return `<a href="${item.url}" class="${classes}" id="${id}" role="menuitem"${ariaLabel}>${item.label}</a>`;
      }).join('\n');
    }
    
    // Generate unique IDs for this instance
    const instanceId = `stoplight-${Math.random().toString(36).substr(2, 9)}`;
    const stoplightId = `stoplight-${instanceId}`;
    const menuId = `dropdown-menu-${instanceId}`;
    
    this.innerHTML = `
      <div class="stoplight-container">
        <button 
          class="stoplight" 
          id="${stoplightId}"
          type="button"
          aria-label="Open navigation menu"
          aria-expanded="false"
          aria-haspopup="true"
          aria-controls="${menuId}">
          <span class="sr-only">Navigation menu</span>
          <div class="stoplight-dot red" aria-hidden="true"></div>
          <div class="stoplight-dot yellow" aria-hidden="true"></div>
          <div class="stoplight-dot green" aria-hidden="true"></div>
        </button>
        <nav class="dropdown-menu" id="${menuId}" role="menu" aria-label="Navigation menu">
          ${menuItems}
        </nav>
      </div>
    `;
    
    // Initialize stoplight functionality
    try {
      const { initStoplight } = await import('../components/stoplight/stoplight.js');
      initStoplight(stoplightId, menuId);
    } catch (error) {
      console.error('Failed to initialize stoplight:', error);
      // Fallback: Make menu always visible if JS fails
      const menu = document.getElementById(menuId);
      if (menu) {
        menu.style.display = 'block';
        menu.style.opacity = '1';
        menu.style.visibility = 'visible';
      }
    }
  }
}

customElements.define('warmthly-stoplight', WarmthlyStoplight);

