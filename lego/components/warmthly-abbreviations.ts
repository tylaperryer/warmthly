/**
 * Abbreviations Component
 * Provides abbreviation expansion tooltips and glossary link
 * 
 * WCAG 2.1 AAA Success Criterion 3.1.4 - Abbreviations
 */

import { ABBREVIATION_DICTIONARY, type Abbreviation } from '@utils/abbreviations.js';

class WarmthlyAbbreviations extends HTMLElement {
  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  private render() {
    const abbreviations = Object.values(ABBREVIATION_DICTIONARY);
    
    this.innerHTML = `
      <div class="abbreviations-glossary" role="region" aria-labelledby="abbreviations-heading">
        <h2 id="abbreviations-heading">Abbreviations Glossary</h2>
        <p>This page explains all abbreviations used on our website.</p>
        <dl class="abbreviation-list">
          ${abbreviations.map(abbr => `
            <dt>
              <abbr title="${abbr.expansion}${abbr.description ? ` - ${abbr.description}` : ''}">${abbr.abbr}</abbr>
            </dt>
            <dd>
              <strong>${abbr.expansion}</strong>
              ${abbr.description ? `<p>${abbr.description}</p>` : ''}
            </dd>
          `).join('')}
        </dl>
      </div>
    `;
  }

  private attachEventListeners() {
    // Add keyboard support for abbreviation tooltips
    const abbrs = this.querySelectorAll('abbr');
    abbrs.forEach((abbr) => {
      abbr.addEventListener('focus', this.handleAbbrFocus.bind(this));
      abbr.addEventListener('blur', this.handleAbbrBlur.bind(this));
    });
  }

  private handleAbbrFocus(event: FocusEvent) {
    const abbr = event.target as HTMLElement;
    const title = abbr.getAttribute('title');
    if (title) {
      // Announce expansion to screen readers
      const announcement = document.createElement('div');
      announcement.className = 'sr-only';
      announcement.setAttribute('aria-live', 'polite');
      announcement.textContent = `Abbreviation ${abbr.textContent} stands for ${title}`;
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    }
  }

  private handleAbbrBlur() {
    // Cleanup if needed
  }
}

customElements.define('warmthly-abbreviations', WarmthlyAbbreviations);

