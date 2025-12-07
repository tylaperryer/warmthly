/**
 * Warmthly Last Updated Component
 * Displays the last updated date for a page
 * 
 * Usage:
 * <warmthly-last-updated date="2025-01-15"></warmthly-last-updated>
 * or
 * <warmthly-last-updated></warmthly-last-updated> (uses file modification date)
 */

class WarmthlyLastUpdated extends HTMLElement {
  connectedCallback(): void {
    const dateAttr = this.getAttribute('date');
    let date: Date;

    if (dateAttr) {
      // Use provided date
      date = new Date(dateAttr);
    } else {
      // Try to get file modification date from meta tag or use current date
      const metaDate = document.querySelector('meta[name="last-modified"]');
      if (metaDate) {
        const content = metaDate.getAttribute('content');
        if (content) {
          date = new Date(content);
        } else {
          date = new Date();
        }
      } else {
        date = new Date();
      }
    }

    // Format date
    const formattedDate = this.formatDate(date);

    // Create element
    const wrapper = document.createElement('div');
    wrapper.className = 'last-updated';
    wrapper.setAttribute('role', 'contentinfo');
    wrapper.setAttribute('aria-label', `Last updated: ${formattedDate}`);

    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '📅';
    icon.style.marginRight = '0.5rem';

    const text = document.createElement('span');
    text.textContent = `Last updated: ${formattedDate}`;

    wrapper.appendChild(icon);
    wrapper.appendChild(text);

    // Add styles
    if (!document.querySelector('#warmthly-last-updated-styles')) {
      const style = document.createElement('style');
      style.id = 'warmthly-last-updated-styles';
      style.textContent = `
        .last-updated {
          font-size: 0.875rem;
          color: var(--text-color, #1a1a1a);
          opacity: 0.7;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
        }
        .last-updated span[aria-hidden="true"] {
          font-size: 1rem;
        }
      `;
      document.head.appendChild(style);
    }

    this.appendChild(wrapper);
  }

  /**
   * Format date in a readable format
   */
  private formatDate(date: Date): string {
    try {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch {
      // Fallback format
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  }
}

// Register the custom element
customElements.define('warmthly-last-updated', WarmthlyLastUpdated);

export { WarmthlyLastUpdated };

