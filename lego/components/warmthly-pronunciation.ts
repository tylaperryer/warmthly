/**
 * Pronunciation Component
 * Provides pronunciation tooltips for ambiguous words
 * 
 * WCAG 2.1 AAA Success Criterion 3.1.6 - Pronunciation
 */

import { PRONUNCIATION_DICTIONARY, type Pronunciation } from '@utils/pronunciation.js';

class WarmthlyPronunciation extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  private render() {
    const pronunciations = Object.values(PRONUNCIATION_DICTIONARY);
    
    this.innerHTML = `
      <div class="pronunciation-glossary" role="region" aria-labelledby="pronunciation-heading">
        <h2 id="pronunciation-heading">Pronunciation Guide</h2>
        <p>This page explains how to pronounce words that may be ambiguous.</p>
        <dl class="pronunciation-list">
          ${pronunciations.map(pron => `
            <dt>
              <strong>${pron.word}</strong>
            </dt>
            <dd>
              <p class="phonetic">${pron.phonetic}</p>
              ${pron.context ? `<p class="pronunciation-context">${pron.context}</p>` : ''}
            </dd>
          `).join('')}
        </dl>
      </div>
    `;
  }
}

customElements.define('warmthly-pronunciation', WarmthlyPronunciation);

