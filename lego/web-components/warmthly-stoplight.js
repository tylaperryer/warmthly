import { WARMTHLY_CONFIG, getNavigation } from '../config/warmthly-config.js';

class WarmthlyStoplight extends HTMLElement {
  async connectedCallback() {
    const app = this.getAttribute('app') || '';
    const customItems = this.innerHTML.trim();
    
    let menuItems = customItems;
    
    if (app && !customItems) {
      const navItems = getNavigation(app);
      menuItems = navItems.map((item, index) => {
        const classes = item.class ? `dropdown-item ${item.class}` : 'dropdown-item';
        const ariaLabel = item.ariaLabel ? ` aria-label="${item.ariaLabel}"` : '';
        const id = `nav-item-${app}-${index}`;
        return `<a href="${item.url}" class="${classes}" id="${id}" role="menuitem"${ariaLabel}>${item.label}</a>`;
      }).join('\n');
    }
    
    const instanceId = `stoplight-${Math.random().toString(36).substr(2, 9)}`;
    const stoplightId = `stoplight-${instanceId}`;
    const menuId = `dropdown-menu-${instanceId}`;
    const votePanelId = `stoplight-vote-${instanceId}`;
    const voteToggleId = `stoplight-vote-toggle-${instanceId}`;
    const voteBarId = `stoplight-vote-bar-${instanceId}`;
    const voteCountId = `stoplight-vote-count-${instanceId}`;
    const voteStatusId = `stoplight-vote-status-${instanceId}`;
    
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
          <button 
            class="dropdown-item dropdown-ellipsis" 
            id="${voteToggleId}" 
            type="button" 
            role="menuitem" 
            aria-expanded="false" 
            aria-controls="${votePanelId}">
            …
          </button>
          <div class="stoplight-vote" id="${votePanelId}" role="group" aria-label="Warmthly dissolution vote" hidden>
            <div class="stoplight-vote-row">
              <span class="stoplight-vote-label">Dissolve us?</span>
              <span class="stoplight-vote-count" id="${voteCountId}">Loading…</span>
            </div>
            <div class="stoplight-vote-bar" aria-hidden="true">
              <div class="stoplight-vote-bar-fill" id="${voteBarId}" style="width: 0%"></div>
            </div>
            <div class="stoplight-vote-actions">
              <button class="stoplight-vote-btn yes" data-vote="yes" type="button" role="menuitem">Yes</button>
              <button class="stoplight-vote-btn no" data-vote="no" type="button" role="menuitem">No</button>
            </div>
            <div class="stoplight-vote-status" id="${voteStatusId}" aria-live="polite"></div>
          </div>
        </nav>
      </div>
    `;
    
    try {
      const { initStoplight } = await import('../components/stoplight/stoplight.js');
      initStoplight(stoplightId, menuId, {
        votePanelId,
        voteToggleId,
        voteBarId,
        voteStatusId,
        voteCountId
      });
    } catch (error) {
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

