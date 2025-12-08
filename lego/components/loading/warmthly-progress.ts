/**
 * Warmthly Progress Component
 * Progress bar component
 * Privacy-first: No tracking, no cookies
 *
 * Usage:
 * <warmthly-progress value="50" max="100"></warmthly-progress>
 * <warmthly-progress indeterminate label="Processing..."></warmthly-progress>
 */

import { BaseComponent } from '@core/base-component.js';

/**
 * Warmthly Progress Component
 */
class WarmthlyProgress extends BaseComponent {
  private progressElement: HTMLProgressElement | null = null;
  private labelElement: HTMLSpanElement | null = null;
  private barElement: HTMLDivElement | null = null;

  static override get observedAttributes(): readonly string[] {
    return ['value', 'max', 'indeterminate', 'label', 'aria-label'];
  }

  public override onConnect(): void {
    this.createProgress();
  }

  public override onAttributeChange(name: string): void {
    if (!this.progressElement) return;

    switch (name) {
      case 'value':
        this.updateValue();
        break;
      case 'max':
        this.updateMax();
        break;
      case 'indeterminate':
        this.updateIndeterminate();
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
   * Create progress element
   */
  private createProgress(): void {
    // Create progress element
    this.progressElement = document.createElement('progress');
    this.progressElement.className = 'warmthly-progress';
    this.progressElement.setAttribute('role', 'progressbar');

    // Update attributes
    this.updateValue();
    this.updateMax();
    this.updateIndeterminate();
    this.updateAriaLabel();

    this.appendChild(this.progressElement);

    // Create visual bar for styling
    this.barElement = document.createElement('div');
    this.barElement.className = 'progress-bar';
    this.progressElement.appendChild(this.barElement);

    // Create label if provided
    const labelText = this.getAttr('label');
    if (labelText) {
      this.updateLabel(labelText);
    }
  }

  /**
   * Update value
   */
  private updateValue(): void {
    if (!this.progressElement) return;

    const value = this.getAttr('value');
    if (value !== null && !this.hasAttr('indeterminate')) {
      this.progressElement.value = parseFloat(value);
    } else {
      this.progressElement.removeAttribute('value');
    }

    this.updateBarWidth();
  }

  /**
   * Update max
   */
  private updateMax(): void {
    if (!this.progressElement) return;

    const max = this.getAttr('max') || '100';
    this.progressElement.max = parseFloat(max);
    this.updateBarWidth();
  }

  /**
   * Update indeterminate state
   */
  private updateIndeterminate(): void {
    if (!this.progressElement) return;

    const indeterminate = this.hasAttr('indeterminate');
    if (indeterminate) {
      this.progressElement.removeAttribute('value');
      this.progressElement.classList.add('indeterminate');
    } else {
      this.progressElement.classList.remove('indeterminate');
      this.updateValue();
    }
  }

  /**
   * Update bar width
   */
  private updateBarWidth(): void {
    if (!this.barElement || !this.progressElement) return;

    if (this.hasAttr('indeterminate')) {
      this.barElement.style.width = '100%';
    } else {
      const value = this.progressElement.value;
      const max = this.progressElement.max;
      const percentage = max > 0 ? (value / max) * 100 : 0;
      this.barElement.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    }
  }

  /**
   * Update label
   */
  private updateLabel(text: string | null): void {
    if (text) {
      if (!this.labelElement) {
        this.labelElement = document.createElement('span');
        this.labelElement.className = 'progress-label';
        this.labelElement.setAttribute('aria-hidden', 'true');
        this.appendChild(this.labelElement);
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
    if (!this.progressElement) return;

    const ariaLabel = this.getAttr('aria-label') || this.getAttr('label') || 'Progress';
    this.progressElement.setAttribute('aria-label', ariaLabel);
  }

  /**
   * Set value programmatically
   */
  public setValue(value: number): void {
    this.setAttr('value', value.toString());
    this.updateValue();
  }

  /**
   * Get current value
   */
  public getValue(): number {
    return this.progressElement?.value || 0;
  }

  /**
   * Get max value
   */
  public getMax(): number {
    return this.progressElement?.max || 100;
  }
}

customElements.define('warmthly-progress', WarmthlyProgress);
