/**
 * Warmthly Stoplight Menu Web Component
 * Reusable stoplight navigation menu
 * 
 * Usage:
 * <warmthly-stoplight>
 *   <a href="https://www.warmthly.org" class="dropdown-item">Home</a>
 *   <a href="https://mint.warmthly.org" class="dropdown-item">Mint</a>
 *   <a href="https://post.warmthly.org" class="dropdown-item">Post</a>
 * </warmthly-stoplight>
 */

class WarmthlyStoplight extends HTMLElement {
  connectedCallback() {
    const menuItems = this.innerHTML;
    this.innerHTML = `
      <nav class="header-right" role="navigation" aria-label="Main navigation">
        <div class="stoplight-container">
          <div class="stoplight" id="stoplight">
            <div class="stoplight-dot red"></div>
            <div class="stoplight-dot yellow"></div>
            <div class="stoplight-dot green"></div>
          </div>
          <div class="dropdown-menu" id="dropdown-menu">
            ${menuItems}
          </div>
        </div>
      </nav>
    `;
    
    // Initialize stoplight functionality
    import('../components/stoplight/stoplight.js').then(module => {
      module.initStoplight('stoplight', 'dropdown-menu');
    });
  }
}

customElements.define('warmthly-stoplight', WarmthlyStoplight);

