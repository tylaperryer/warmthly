/**
 * Reading Level Toggle Component
 * Provides UI for switching between reading levels
 *
 * WCAG 2.1 AAA Success Criterion 3.1.5 - Reading Level
 */

import {
  getReadingLevel,
  setReadingLevel,
  type ReadingLevel,
  READING_LEVELS,
} from '@utils/reading-level.js';
import { applyReadingLevelToDOM } from '@utils/reading-level.js';

class WarmthlyReadingLevel extends HTMLElement {
  private currentLevel: ReadingLevel = 'standard';

  connectedCallback() {
    this.currentLevel = getReadingLevel();
    this.render();
    this.attachEventListeners();

    // Listen for external changes
    window.addEventListener('readinglevelchange', ((e: CustomEvent) => {
      this.currentLevel = e.detail.level;
      this.updateUI();
    }) as EventListener);
  }

  private render() {
    this.innerHTML = `
      <div class="reading-level-toggle" role="group" aria-label="Reading level">
        <button 
          class="reading-level-btn ${this.currentLevel === 'standard' ? 'active' : ''}"
          data-level="standard"
          aria-pressed="${this.currentLevel === 'standard'}"
          aria-label="Standard reading level">
          <span class="reading-level-label">Standard</span>
          <span class="reading-level-desc">Grade 9+</span>
        </button>
        <button 
          class="reading-level-btn ${this.currentLevel === 'simplified' ? 'active' : ''}"
          data-level="simplified"
          aria-pressed="${this.currentLevel === 'simplified'}"
          aria-label="Simplified reading level, Grade 6">
          <span class="reading-level-label">Simplified</span>
          <span class="reading-level-desc">Grade 6</span>
        </button>
        <button 
          class="reading-level-btn ${this.currentLevel === 'easy-read' ? 'active' : ''}"
          data-level="easy-read"
          aria-pressed="${this.currentLevel === 'easy-read'}"
          aria-label="Easy Read level with pictures">
          <span class="reading-level-label">Easy Read</span>
          <span class="reading-level-desc">Pictures + Simple</span>
        </button>
      </div>
    `;

    this.injectStyles();
  }

  private injectStyles() {
    if (document.getElementById('reading-level-styles')) return;

    const style = document.createElement('style');
    style.id = 'reading-level-styles';
    style.textContent = `
      .reading-level-toggle {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        padding: 0.5rem;
        background: var(--bg-color, #fff);
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .reading-level-btn {
        flex: 1;
        min-width: 100px;
        padding: 0.75rem 1rem;
        border: 2px solid var(--warmthly-orange, #ff6b35);
        background: transparent;
        color: var(--warmthly-orange, #ff6b35);
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        font-family: inherit;
        font-size: 0.875rem;
      }
      
      .reading-level-btn:hover {
        background: var(--warmthly-orange, #ff6b35);
        color: white;
        transform: translateY(-2px);
      }
      
      .reading-level-btn:focus {
        outline: 3px solid var(--warmthly-orange, #ff6b35);
        outline-offset: 2px;
      }
      
      .reading-level-btn.active {
        background: var(--warmthly-orange, #ff6b35);
        color: white;
        font-weight: 600;
      }
      
      .reading-level-label {
        font-weight: 600;
        font-size: 0.875rem;
      }
      
      .reading-level-desc {
        font-size: 0.75rem;
        opacity: 0.9;
      }
      
      .reading-level-btn.active .reading-level-desc {
        opacity: 1;
      }
      
      /* Reading level specific styles */
      .reading-level-simplified [data-reading-level-content] {
        font-size: 1.1em;
        line-height: 1.8;
      }
      
      .reading-level-easy-read [data-reading-level-content] {
        font-size: 1.2em;
        line-height: 2;
      }
      
      .reading-level-easy-read [data-reading-level-content]::before {
        content: "📖 ";
      }
      
      @media (max-width: 640px) {
        .reading-level-toggle {
          flex-direction: column;
        }
        
        .reading-level-btn {
          width: 100%;
        }
      }
    `;

    document.head.appendChild(style);
  }

  private attachEventListeners() {
    const buttons = this.querySelectorAll('.reading-level-btn');

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const level = button.getAttribute('data-level') as ReadingLevel;
        this.setLevel(level);
      });

      // Keyboard support
      button.addEventListener('keydown', (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
          keyEvent.preventDefault();
          const level = button.getAttribute('data-level') as ReadingLevel;
          this.setLevel(level);
        }
      });
    });
  }

  private setLevel(level: ReadingLevel) {
    this.currentLevel = level;
    setReadingLevel(level);
    applyReadingLevelToDOM(level);
    this.updateUI();

    // Announce change to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Reading level changed to ${READING_LEVELS[level].level}`;
    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  private updateUI() {
    const buttons = this.querySelectorAll('.reading-level-btn');

    buttons.forEach(button => {
      const level = button.getAttribute('data-level') as ReadingLevel;
      const isActive = level === this.currentLevel;

      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  }
}

customElements.define('warmthly-reading-level', WarmthlyReadingLevel);
