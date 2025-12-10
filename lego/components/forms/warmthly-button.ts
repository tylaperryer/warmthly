/**
 * Warmthly Button Component
 * Accessible button with loading states
 * Privacy-first: No tracking, no cookies
 *
 * Usage:
 * <warmthly-button type="submit" loading>Submit</warmthly-button>
 * <warmthly-button variant="primary" disabled>Click Me</warmthly-button>
 */

import { BaseComponent } from '@core/base-component.js';

/**
 * Button variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/**
 * Warmthly Button Component
 */
class WarmthlyButton extends BaseComponent {
  private buttonElement: HTMLButtonElement | null = null;
  private loadingSpinner: HTMLSpanElement | null = null;
  private originalContent: string | null = null;

  static override get observedAttributes(): readonly string[] {
    return ['type', 'variant', 'disabled', 'loading', 'aria-label', 'aria-busy'];
  }

  public override onConnect(): void {
    this.createButton();
  }

  public override onAttributeChange(
    name: string,
    _oldValue: string | null,
    newValue: string | null
  ): void {
    if (!this.buttonElement) return;

    switch (name) {
      case 'type':
        this.buttonElement.type = (newValue || 'button').toLowerCase() as
          | 'button'
          | 'submit'
          | 'reset';
        break;
      case 'variant':
        this.updateVariant(newValue);
        break;
      case 'disabled':
        this.buttonElement.disabled = this.hasAttr('disabled');
        break;
      case 'loading':
        this.setLoading(this.hasAttr('loading'));
        break;
      case 'aria-label':
        this.buttonElement.setAttribute('aria-label', newValue || '');
        break;
      case 'aria-busy':
        this.buttonElement.setAttribute('aria-busy', newValue || 'false');
        break;
    }
  }

  /**
   * Create button element
   */
  private createButton(): void {
    // Store original content
    this.originalContent = this.textContent || '';

    // Create button
    this.buttonElement = document.createElement('button');
    this.buttonElement.type = (this.getAttr('type') || 'button').toLowerCase() as
      | 'button'
      | 'submit'
      | 'reset';
    this.buttonElement.disabled = this.hasAttr('disabled');
    this.buttonElement.className = 'warmthly-button';

    // Set variant
    const variant = this.getAttr('variant') || 'primary';
    this.updateVariant(variant);

    // Move children into button
    while (this.firstChild) {
      this.buttonElement.appendChild(this.firstChild);
    }

    // If no content, use original text
    if (!this.buttonElement.textContent && this.originalContent) {
      this.buttonElement.textContent = this.originalContent;
    }

    this.appendChild(this.buttonElement);

    // Setup loading state
    if (this.hasAttr('loading')) {
      this.setLoading(true);
    }
  }

  /**
   * Update button variant
   */
  private updateVariant(variant: string | null): void {
    if (!this.buttonElement) return;

    // Remove existing variant classes
    this.buttonElement.classList.remove(
      'variant-primary',
      'variant-secondary',
      'variant-danger',
      'variant-ghost'
    );

    // Add new variant class
    const variantClass = `variant-${variant || 'primary'}`;
    this.buttonElement.classList.add(variantClass);
  }

  /**
   * Set loading state
   */
  private setLoading(loading: boolean): void {
    if (!this.buttonElement) return;

    if (loading) {
      // Store original content if not stored
      if (!this.originalContent) {
        this.originalContent = this.buttonElement.textContent || '';
      }

      // Create loading spinner
      if (!this.loadingSpinner) {
        this.loadingSpinner = document.createElement('span');
        this.loadingSpinner.className = 'button-spinner';
        this.loadingSpinner.setAttribute('aria-hidden', 'true');
        // SECURITY: Use DOM methods instead of innerHTML
        this.loadingSpinner.textContent = '';
        const spinner = document.createElement('span');
        spinner.className = 'spinner';
        this.loadingSpinner.appendChild(spinner);
      }

      // Replace content with spinner
      this.buttonElement.textContent = '';
      this.buttonElement.appendChild(this.loadingSpinner);
      this.buttonElement.disabled = true;
      this.buttonElement.setAttribute('aria-busy', 'true');
      this.buttonElement.setAttribute('aria-label', this.originalContent || 'Loading');
    } else {
      // Restore original content
      if (this.loadingSpinner) {
        this.loadingSpinner.remove();
        this.loadingSpinner = null;
      }

      if (this.originalContent) {
        this.buttonElement.textContent = this.originalContent;
      }

      this.buttonElement.removeAttribute('aria-busy');
      this.buttonElement.removeAttribute('aria-label');
    }
  }

  /**
   * Get button element
   */
  public getButton(): HTMLButtonElement | null {
    return this.buttonElement;
  }

  /**
   * Set loading state programmatically
   */
  public setLoadingState(loading: boolean): void {
    this.setBoolAttr('loading', loading);
    this.setLoading(loading);
  }

  /**
   * Click button programmatically
   */
  public override click(): void {
    this.buttonElement?.click();
  }
}

customElements.define('warmthly-button', WarmthlyButton);
