/**
 * Warmthly Header Web Component
 * Reusable header component for all subdomains
 * 
 * Usage:
 * <warmthly-header 
 *   subdomain-url="https://mint.warmthly.org" 
 *   subdomain-name="Mint" 
 *   subdomain-class="mint-text">
 * </warmthly-header>
 */

class WarmthlyHeader extends HTMLElement {
  connectedCallback() {
    const subdomainUrl = this.getAttribute('subdomain-url') || '#';
    const subdomainName = this.getAttribute('subdomain-name') || '';
    const subdomainClass = this.getAttribute('subdomain-class') || '';
    
    this.innerHTML = `
      <div class="top-left-heading">
        <a href="https://www.warmthly.org" class="warmthly-link">Warmthly</a>
        ${subdomainName ? `<a href="${subdomainUrl}" class="${subdomainClass}">${subdomainName}</a>` : ''}
      </div>
    `;
  }
}

customElements.define('warmthly-header', WarmthlyHeader);

