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

import { initFontLoader } from '../components/fonts/font-loader.js';

class WarmthlyFontLoader extends HTMLElement {
  connectedCallback() {
    // Initialize font loader
    initFontLoader();
  }
}

customElements.define('warmthly-font-loader', WarmthlyFontLoader);

