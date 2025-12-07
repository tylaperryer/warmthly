/**
 * Warmthly Stoplight Web Component
 * Creates an accessible navigation menu with stoplight button
 * Supports both config-based and custom menu items
 * 
 * Usage:
 * <warmthly-stoplight app="mint"></warmthly-stoplight>
 * OR
 * <warmthly-stoplight>
 *   <a href="/page1">Page 1</a>
 *   <a href="/page2">Page 2</a>
 * </warmthly-stoplight>
 */

import { getNavigation, type AppName } from '@config/warmthly-config.js';
import { getTextSpacingPreferences, toggleTextSpacing } from '@utils/text-spacing.js';

/**
 * Stoplight dot colors
 */
const STOPLIGHT_COLORS = ['red', 'yellow', 'green'] as const;

/**
 * Warmthly Stoplight Web Component
 */
class WarmthlyStoplight extends HTMLElement {
  /**
   * Called when element is inserted into the DOM
   * Creates stoplight button and menu structure
   */
  async connectedCallback(): Promise<void> {
    // Safety check for browser environment
    if (typeof document === 'undefined') {
      return;
    }

    try {
      const app = this.getAttribute('app') || '';
      const customItems = this.innerHTML.trim();

      let menuItems = customItems;

      // Generate unique IDs for this instance
      const instanceId = `stoplight-${Math.random().toString(36).substring(2, 11)}`;
      const stoplightId = `stoplight-${instanceId}`;
      const menuId = `dropdown-menu-${instanceId}`;

      // Create container
      const container = document.createElement('div');
      container.className = 'stoplight-container';

      // Create button
      const button = document.createElement('button');
      button.className = 'stoplight';
      button.id = stoplightId;
      button.type = 'button';
      button.setAttribute('aria-label', 'Open navigation menu');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-haspopup', 'true');
      button.setAttribute('aria-controls', menuId);

      // Add screen reader text
      const srOnly = document.createElement('span');
      srOnly.className = 'sr-only';
      srOnly.textContent = 'Navigation menu';
      button.appendChild(srOnly);

      // Add stoplight dots
      STOPLIGHT_COLORS.forEach((color) => {
        const dot = document.createElement('div');
        dot.className = `stoplight-dot ${color}`;
        dot.setAttribute('aria-hidden', 'true');
        button.appendChild(dot);
      });

      // Create menu
      const menu = document.createElement('nav');
      menu.className = 'dropdown-menu';
      menu.id = menuId;
      menu.setAttribute('role', 'menu');
      menu.setAttribute('aria-label', 'Navigation menu');

      // Add menu items
      if (app && !customItems) {
        // Use config-based navigation
        const navItems = getNavigation(app as AppName);
        navItems.forEach((item, index) => {
          const link = document.createElement('a');
          link.href = item.url;
          link.className = item.class ? `dropdown-item ${item.class}` : 'dropdown-item';
          link.id = `nav-item-${app}-${index}`;
          link.setAttribute('role', 'menuitem');
          link.textContent = item.label;

          if (item.ariaLabel) {
            link.setAttribute('aria-label', item.ariaLabel);
          }

          menu.appendChild(link);
        });

        // Add text spacing toggle (WCAG 2.1 AAA 1.4.8)
        const textSpacingPrefs = getTextSpacingPreferences();
        const spacingToggle = document.createElement('button');
        spacingToggle.className = 'dropdown-item';
        spacingToggle.id = `text-spacing-toggle-${instanceId}`;
        spacingToggle.setAttribute('role', 'menuitemcheckbox');
        spacingToggle.setAttribute('aria-checked', textSpacingPrefs.enabled ? 'true' : 'false');
        spacingToggle.setAttribute('aria-label', 'Toggle increased text spacing');
        spacingToggle.textContent = textSpacingPrefs.enabled
          ? '✓ Increased Text Spacing'
          : 'Increased Text Spacing';
        spacingToggle.style.cssText = 'width: 100%; text-align: left; background: transparent; border: none; cursor: pointer;';
        spacingToggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const currentPrefs = getTextSpacingPreferences();
          toggleTextSpacing(!currentPrefs.enabled);
          spacingToggle.setAttribute(
            'aria-checked',
            !currentPrefs.enabled ? 'true' : 'false'
          );
          spacingToggle.textContent = !currentPrefs.enabled
            ? '✓ Increased Text Spacing'
            : 'Increased Text Spacing';
        });
        menu.appendChild(spacingToggle);
      } else if (customItems) {
        // Parse custom items safely
        const temp = document.createElement('div');
        temp.innerHTML = customItems;

        while (temp.firstChild) {
          const child = temp.firstChild;
          if (child instanceof Node) {
            menu.appendChild(child);
          }
        }
      }

      // Assemble container
      container.appendChild(button);
      container.appendChild(menu);

      // Clear and append to component
      this.textContent = '';
      this.appendChild(container);

      // Initialize stoplight functionality
      try {
        const { initStoplight } = await import('@utils/stoplight-utils.js');
        initStoplight(stoplightId, menuId);
      } catch (error: unknown) {
        // Fallback: show menu if initialization fails
        if (import.meta.env.DEV) {
          console.warn('Failed to initialize stoplight:', error);
        }

        const menuElement = document.getElementById(menuId);
        if (menuElement instanceof HTMLElement) {
          menuElement.style.display = 'block';
          menuElement.style.opacity = '1';
          menuElement.style.visibility = 'visible';
        }
      }
    } catch (error: unknown) {
      // Log error in development
      if (import.meta.env.DEV) {
        console.error('Error in warmthly-stoplight connectedCallback:', error);
      }
    }
  }
}

// Register the custom element
customElements.define('warmthly-stoplight', WarmthlyStoplight);

// Export for potential programmatic use
export { WarmthlyStoplight };

