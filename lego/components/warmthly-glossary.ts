/**
 * Glossary Component
 * Provides inline definitions for glossary terms
 * 
 * WCAG 2.1 AAA Success Criterion 3.1.3 - Unusual Words
 */

import { GLOSSARY_DICTIONARY, type GlossaryTerm, getDefinitionForReadingLevel } from '@utils/glossary.js';
import { getReadingLevel } from '@utils/reading-level.js';

class WarmthlyGlossary extends HTMLElement {
  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  private render() {
    const terms = Object.values(GLOSSARY_DICTIONARY);
    const readingLevel = getReadingLevel();
    
    // Group by category
    const byCategory: Record<string, GlossaryTerm[]> = {};
    terms.forEach(term => {
      const category = term.category || 'Other';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(term);
    });
    
    this.innerHTML = `
      <div class="glossary-container" role="region" aria-labelledby="glossary-heading">
        <h2 id="glossary-heading">Glossary</h2>
        <p>This page explains terms and concepts used throughout our website.</p>
        ${Object.entries(byCategory).map(([category, categoryTerms]) => `
          <section aria-labelledby="glossary-${category.toLowerCase().replace(/\s+/g, '-')}-heading">
            <h3 id="glossary-${category.toLowerCase().replace(/\s+/g, '-')}-heading">${category}</h3>
            <dl class="glossary-list">
              ${categoryTerms.map(term => {
                const definition = getDefinitionForReadingLevel(term.term, readingLevel);
                return `
                  <dt id="glossary-${term.term}">
                    <strong>${term.term}</strong>
                  </dt>
                  <dd>
                    <p>${definition}</p>
                    ${term.simplified && readingLevel === 'standard' ? `<p class="glossary-simplified"><strong>Simple:</strong> ${term.simplified}</p>` : ''}
                  </dd>
                `;
              }).join('')}
            </dl>
          </section>
        `).join('')}
      </div>
    `;
  }

  private attachEventListeners() {
    // Add keyboard support for glossary terms
    const terms = this.querySelectorAll('dt strong');
    terms.forEach((term) => {
      const termElement = term as HTMLElement;
      termElement.setAttribute('tabindex', '0');
      termElement.setAttribute('role', 'button');
      termElement.setAttribute('aria-expanded', 'false');
      
      termElement.addEventListener('click', () => {
        this.toggleDefinition(termElement);
      });
      
      termElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggleDefinition(termElement);
        }
      });
    });
  }

  private toggleDefinition(element: HTMLElement) {
    const dd = element.parentElement?.nextElementSibling as HTMLElement;
    if (dd) {
      const isExpanded = element.getAttribute('aria-expanded') === 'true';
      element.setAttribute('aria-expanded', String(!isExpanded));
      dd.style.display = isExpanded ? 'none' : 'block';
    }
  }
}

customElements.define('warmthly-glossary', WarmthlyGlossary);

