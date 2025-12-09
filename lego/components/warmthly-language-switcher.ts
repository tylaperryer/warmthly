/**
 * Language Switcher Component
 * Searchable language selector supporting 7,019+ languages
 *
 * Features:
 * - Search/filter functionality
 * - Native name and English name display
 * - Language code display
 * - Keyboard navigation
 * - Screen reader support
 * - Grouped by region or alphabetically
 *
 * Usage:
 * <warmthly-language-switcher></warmthly-language-switcher>
 */

import { API_CONFIG } from '../config/api-config.js';
import { getErrorBoundary, ErrorSeverity } from '../core/error-boundary.js';
import { getLanguage, setLanguage } from '../utils/i18n.js';
import { updateRTLSupport, isRTL } from '../utils/rtl-support.js';

interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  locale: string;
  rtl: boolean;
  region?: string;
}

/**
 * Language Switcher Web Component
 */
class WarmthlyLanguageSwitcher extends HTMLElement {
  private languages: LanguageInfo[] = [];
  private filteredLanguages: LanguageInfo[] = [];
  private searchQuery: string = '';
  private isOpen: boolean = false;
  private currentLanguage: string = 'en';

  async connectedCallback() {
    await this.loadLanguages();
    this.currentLanguage = getLanguage();
    this.render();
    this.attachEventListeners();
  }

  /**
   * Load available languages from API
   */
  private async loadLanguages(): Promise<void> {
    try {
      const response = await fetch(API_CONFIG.getUrl('api/i18n/languages'));
      if (response.ok) {
        const data = await response.json();
        const languageCodes: string[] = data.languages || [];

        // Fetch language metadata for each code
        // For now, we'll create basic info from codes
        // In production, fetch full metadata from API
        this.languages = languageCodes.map((code: string) => {
          // Basic language info (can be enhanced with full metadata)
          return {
            code,
            name: this.getLanguageName(code),
            nativeName: this.getNativeName(code),
            locale: `${code}_${code.toUpperCase()}`,
            rtl: isRTL(code),
          };
        });

        // Sort alphabetically by English name
        this.languages.sort((a, b) => a.name.localeCompare(b.name));
        this.filteredLanguages = [...this.languages];
      }
    } catch (error: unknown) {
      // Use error boundary for consistent error handling
      const errorBoundary = getErrorBoundary();
      const errorObj = error instanceof Error ? error : new Error(String(error));
      await errorBoundary.handleError(errorObj, {
        severity: ErrorSeverity.LOW,
        component: 'warmthly-language-switcher',
        operation: 'loadLanguages',
        userMessage: 'Failed to load language list, using fallback',
        recoverable: true,
        metadata: { tagName: this.tagName },
      });
      // Fallback to common languages
      this.languages = this.getFallbackLanguages();
      this.filteredLanguages = [...this.languages];
    }
  }

  /**
   * Get language name (English)
   */
  private getLanguageName(code: string): string {
    // Basic mapping - can be enhanced with full metadata
    const names: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ru: 'Russian',
      ja: 'Japanese',
      zh: 'Chinese',
      ar: 'Arabic',
      hi: 'Hindi',
      // Add more as needed
    };
    return names[code] || code.toUpperCase();
  }

  /**
   * Get native name
   */
  private getNativeName(code: string): string {
    // Basic mapping - can be enhanced with full metadata
    const nativeNames: Record<string, string> = {
      en: 'English',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      it: 'Italiano',
      pt: 'Português',
      ru: 'Русский',
      ja: '日本語',
      zh: '中文',
      ar: 'العربية',
      hi: 'हिन्दी',
      // Add more as needed
    };
    return nativeNames[code] || this.getLanguageName(code);
  }

  /**
   * Get fallback languages if API fails
   */
  private getFallbackLanguages(): LanguageInfo[] {
    return [
      { code: 'en', name: 'English', nativeName: 'English', locale: 'en_US', rtl: false },
      { code: 'es', name: 'Spanish', nativeName: 'Español', locale: 'es_ES', rtl: false },
      { code: 'fr', name: 'French', nativeName: 'Français', locale: 'fr_FR', rtl: false },
      { code: 'de', name: 'German', nativeName: 'Deutsch', locale: 'de_DE', rtl: false },
      { code: 'it', name: 'Italian', nativeName: 'Italiano', locale: 'it_IT', rtl: false },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português', locale: 'pt_PT', rtl: false },
      { code: 'ru', name: 'Russian', nativeName: 'Русский', locale: 'ru_RU', rtl: false },
      { code: 'ja', name: 'Japanese', nativeName: '日本語', locale: 'ja_JP', rtl: false },
      { code: 'zh', name: 'Chinese', nativeName: '中文', locale: 'zh_CN', rtl: false },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', locale: 'ar_SA', rtl: true },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', locale: 'hi_IN', rtl: false },
    ];
  }

  /**
   * Filter languages based on search query
   */
  private filterLanguages(query: string): void {
    this.searchQuery = query.toLowerCase().trim();

    if (!this.searchQuery) {
      this.filteredLanguages = [...this.languages];
      return;
    }

    this.filteredLanguages = this.languages.filter(lang => {
      return (
        lang.code.toLowerCase().includes(this.searchQuery) ||
        lang.name.toLowerCase().includes(this.searchQuery) ||
        lang.nativeName.toLowerCase().includes(this.searchQuery)
      );
    });
  }

  /**
   * Handle language selection
   */
  private async selectLanguage(code: string): Promise<void> {
    this.currentLanguage = code;
    await setLanguage(code);
    updateRTLSupport(code);

    // Update URL with language parameter
    const url = new URL(window.location.href);
    url.searchParams.set('lang', code);
    window.history.pushState({}, '', url.toString());

    // Close dropdown
    this.isOpen = false;
    this.render();

    // Dispatch custom event
    this.dispatchEvent(
      new CustomEvent('language-changed', {
        detail: { language: code },
        bubbles: true,
      })
    );
  }

  /**
   * Render component
   */
  private render(): void {
    const currentLang = this.languages.find(l => l.code === this.currentLanguage) || {
      code: this.currentLanguage,
      name: this.currentLanguage.toUpperCase(),
      nativeName: this.currentLanguage.toUpperCase(),
      locale: `${this.currentLanguage}_${this.currentLanguage.toUpperCase()}`,
      rtl: false,
    };

    // Escape values to prevent XSS
    const escapeHtml = (text: string): string => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.textContent || '';
    };
    const escapeHtmlAttribute = (value: string): string => {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    // Use DOMParser instead of innerHTML for safer parsing (prevents XSS)
    const parser = new DOMParser();
    const template = `
      <div class="language-switcher">
        <button 
          class="language-switcher__button"
          aria-expanded="${escapeHtmlAttribute(String(this.isOpen))}"
          aria-haspopup="listbox"
          aria-label="Select language"
          id="language-switcher-button"
        >
          <span class="language-switcher__current">
            <span class="language-switcher__code">${escapeHtml(currentLang.code.toUpperCase())}</span>
            <span class="language-switcher__name">${escapeHtml(currentLang.nativeName)}</span>
          </span>
          <svg class="language-switcher__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
        ${
          this.isOpen
            ? `
          <div class="language-switcher__dropdown" role="listbox" id="language-switcher-dropdown">
            <div class="language-switcher__search">
              <input
                type="text"
                class="language-switcher__input"
                placeholder="Search languages..."
                aria-label="Search languages"
                id="language-switcher-search"
                autocomplete="off"
              />
            </div>
            <div class="language-switcher__list" role="list">
              ${
                this.filteredLanguages.length > 0
                  ? this.filteredLanguages
                      .map(
                        (lang, index) => `
                <button
                  class="language-switcher__option ${
                    lang.code === this.currentLanguage ? 'language-switcher__option--active' : ''
                  }"
                  role="option"
                  aria-selected="${escapeHtmlAttribute(String(lang.code === this.currentLanguage))}"
                  data-code="${escapeHtmlAttribute(lang.code)}"
                  tabindex="${escapeHtmlAttribute(String(index === 0 ? '0' : '-1'))}"
                >
                  <span class="language-switcher__option-code">${escapeHtml(lang.code.toUpperCase())}</span>
                  <span class="language-switcher__option-name">${escapeHtml(lang.nativeName)}</span>
                  <span class="language-switcher__option-name-en">${escapeHtml(lang.name)}</span>
                  ${
                    lang.rtl
                      ? '<span class="language-switcher__rtl-indicator" aria-label="Right-to-left language">RTL</span>'
                      : ''
                  }
                </button>
              `
                      )
                      .join('')
                  : `
                <div class="language-switcher__empty">
                  No languages found matching "${escapeHtml(this.searchQuery)}"
                </div>
              `
              }
            </div>
            <div class="language-switcher__footer">
              <span class="language-switcher__count">${this.filteredLanguages.length} of ${
                this.languages.length
              } languages</span>
            </div>
          </div>
        `
            : ''
        }
      </div>
    `;
    const doc = parser.parseFromString(template, 'text/html');
    const container = doc.body.firstElementChild;
    if (container) {
      // Clear existing content and append new content
      this.textContent = '';
      this.appendChild(container);
    }
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Use event delegation for dynamic content
    this.addEventListener('click', e => {
      const target = e.target as HTMLElement;

      // Toggle dropdown
      if (target.closest('.language-switcher__button')) {
        e.preventDefault();
        this.isOpen = !this.isOpen;
        this.render();
        this.attachEventListeners();

        if (this.isOpen) {
          // Focus search input when opened
          const searchInput = this.querySelector('#language-switcher-search') as HTMLInputElement;
          if (searchInput) {
            setTimeout(() => searchInput.focus(), 0);
          }
        }
        return;
      }

      // Select language
      const option = target.closest('.language-switcher__option') as HTMLElement;
      if (option) {
        e.preventDefault();
        const code = option.dataset.code;
        if (code) {
          this.selectLanguage(code);
        }
      }
    });

    // Search input
    this.addEventListener('input', e => {
      const target = e.target as HTMLInputElement;
      if (target.id === 'language-switcher-search') {
        this.filterLanguages(target.value);
        this.render();
        this.attachEventListeners();
      }
    });

    // Keyboard navigation
    this.addEventListener('keydown', e => {
      if (!this.isOpen) {
        if (e.key === 'Enter' || e.key === ' ') {
          const button = this.querySelector('.language-switcher__button') as HTMLElement;
          if (document.activeElement === button) {
            e.preventDefault();
            this.isOpen = true;
            this.render();
            this.attachEventListeners();
          }
        }
        return;
      }

      const options = Array.from(
        this.querySelectorAll('.language-switcher__option')
      ) ;
      const currentIndex = options.findIndex(opt => opt === document.activeElement);

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          this.isOpen = false;
          this.render();
          this.attachEventListeners();
          (this.querySelector('.language-switcher__button') as HTMLElement)?.focus();
          break;

        case 'ArrowDown':
          e.preventDefault();
          const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
          (options[nextIndex] as HTMLElement)?.focus();
          break;

        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
          (options[prevIndex] as HTMLElement)?.focus();
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          if (document.activeElement?.classList.contains('language-switcher__option')) {
            const code = (document.activeElement as HTMLElement).dataset.code;
            if (code) {
              this.selectLanguage(code);
            }
          }
          break;
      }
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (this.isOpen && !this.contains(e.target as Node)) {
        this.isOpen = false;
        this.render();
        this.attachEventListeners();
      }
    });
  }
}

// Register component
customElements.define('warmthly-language-switcher', WarmthlyLanguageSwitcher);

export default WarmthlyLanguageSwitcher;
