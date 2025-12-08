/**
 * Warmthly Spinner Component
 * Loading spinner component
 * Privacy-first: No tracking, no cookies
 *
 * Usage:
 * <warmthly-spinner size="small"></warmthly-spinner>
 * <warmthly-spinner size="large" label="Loading..."></warmthly-spinner>
 */

import { BaseComponent } from '@core/base-component.js';

/**
 * Spinner sizes
 */
export type SpinnerSize = 'small' | 'medium' | 'large';

/**
 * Warmthly Spinner Component
 */
class WarmthlySpinner extends BaseComponent {
  private spinnerElement: HTMLDivElement | null = null;
  private labelElement: HTMLSpanElement | null = null;

  static get observedAttributes(): readonly string[] {
    return ['size', 'label', 'aria-label'];
  }

  public onConnect(): void {
    this.createSpinner();
  }

  public onAttributeChange(name: string): void {
    switch (name) {
      case 'size':
        this.updateSize();
        break;
      case 'label':
        this.updateLabel(this.getAttr('label'));
        break;
      case 'aria-label':
        this.updateAriaLabel();
        break;
    }
  }

  /**
   * Create spinner element
   */
  private createSpinner(): void {
    this.spinnerElement = document.createElement('div');
    this.spinnerElement.className = 'spinner';
    this.spinnerElement.setAttribute('role', 'status');
    this.spinnerElement.setAttribute('aria-live', 'polite');

    // Create spinner circle
    const circle = document.createElement('div');
    circle.className = 'spinner-circle';
    this.spinnerElement.appendChild(circle);

    // Update size
    this.updateSize();

    // Update aria-label
    this.updateAriaLabel();

    this.appendChild(this.spinnerElement);

    // Create label if provided
    const labelText = this.getAttr('label');
    if (labelText) {
      this.updateLabel(labelText);
    }
  }

  /**
   * Update spinner size
   */
  private updateSize(): void {
    if (!this.spinnerElement) return;

    const size = (this.getAttr('size') || 'medium') as SpinnerSize;
    this.spinnerElement.classList.remove('size-small', 'size-medium', 'size-large');
    this.spinnerElement.classList.add(`size-${size}`);
  }

  /**
   * Update label
   */
  private updateLabel(text: string | null): void {
    if (text) {
      if (!this.labelElement) {
        this.labelElement = document.createElement('span');
        this.labelElement.className = 'spinner-label';
        this.labelElement.setAttribute('aria-hidden', 'true');
        this.spinnerElement?.appendChild(this.labelElement);
      }
      this.labelElement.textContent = text;
    } else if (this.labelElement) {
      this.labelElement.remove();
      this.labelElement = null;
    }
  }

  /**
   * Update aria-label
   */
  private updateAriaLabel(): void {
    if (!this.spinnerElement) return;

    const ariaLabel = this.getAttr('aria-label') || this.getAttr('label') || 'Loading';
    this.spinnerElement.setAttribute('aria-label', ariaLabel);
  }
}

customElements.define('warmthly-spinner', WarmthlySpinner);
