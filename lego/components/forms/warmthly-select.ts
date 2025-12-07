/**
 * Warmthly Select Component
 * Accessible select dropdown component
 * Privacy-first: No tracking, no cookies
 * 
 * Usage:
 * <warmthly-select name="country" label="Country" required>
 *   <option value="">Select a country</option>
 *   <option value="us">United States</option>
 *   <option value="uk">United Kingdom</option>
 * </warmthly-select>
 */

import { BaseComponent } from '@core/base-component.js';

/**
 * Warmthly Select Component
 */
class WarmthlySelect extends BaseComponent {
  private selectElement: HTMLSelectElement | null = null;
  private labelElement: HTMLLabelElement | null = null;
  private errorElement: HTMLDivElement | null = null;

  static get observedAttributes(): readonly string[] {
    return [
      'name',
      'value',
      'required',
      'disabled',
      'multiple',
      'size',
      'label',
      'error',
      'aria-label',
      'aria-describedby',
    ];
  }

  protected onConnect(): void {
    this.createSelect();
  }

  protected onAttributeChange(name: string, oldValue: string | null, newValue: string | null): void {
    if (!this.selectElement) return;

    switch (name) {
      case 'name':
        this.selectElement.name = newValue || '';
        break;
      case 'value':
        if (this.selectElement.value !== newValue) {
          this.selectElement.value = newValue || '';
          this.validate();
        }
        break;
      case 'required':
        this.selectElement.required = this.hasAttr('required');
        break;
      case 'disabled':
        this.selectElement.disabled = this.hasAttr('disabled');
        break;
      case 'multiple':
        this.selectElement.multiple = this.hasAttr('multiple');
        break;
      case 'size':
        this.selectElement.size = newValue ? parseInt(newValue, 10) : 0;
        break;
      case 'label':
        this.updateLabel(newValue);
        break;
      case 'error':
        this.showError(newValue);
        break;
      case 'aria-label':
        this.selectElement.setAttribute('aria-label', newValue || '');
        break;
      case 'aria-describedby':
        this.selectElement.setAttribute('aria-describedby', newValue || '');
        break;
    }
  }

  /**
   * Create select element
   */
  private createSelect(): void {
    // Create label if provided
    const labelText = this.getAttr('label');
    if (labelText) {
      this.labelElement = document.createElement('label');
      this.labelElement.textContent = labelText;
      const selectId = this.getAttr('id') || `select-${Math.random().toString(36).substr(2, 9)}`;
      this.labelElement.setAttribute('for', selectId);
      this.setAttr('id', selectId);
      this.appendChild(this.labelElement);
    }

    // Create select
    this.selectElement = document.createElement('select');
    this.selectElement.id = this.getAttr('id') || `select-${Math.random().toString(36).substr(2, 9)}`;
    this.selectElement.name = this.getAttr('name') || '';
    this.selectElement.value = this.getAttr('value') || '';
    this.selectElement.required = this.hasAttr('required');
    this.selectElement.disabled = this.hasAttr('disabled');
    this.selectElement.multiple = this.hasAttr('multiple');

    const size = this.getAttr('size');
    if (size) this.selectElement.size = parseInt(size, 10);

    // Move option children into select
    const options = Array.from(this.queryAll<HTMLOptionElement>('option'));
    options.forEach((option) => {
      this.selectElement?.appendChild(option);
    });

    // Update label for attribute
    if (this.labelElement) {
      this.labelElement.setAttribute('for', this.selectElement.id);
    }

    this.appendChild(this.selectElement);

    // Create error element
    this.errorElement = document.createElement('div');
    this.errorElement.className = 'form-error';
    this.errorElement.setAttribute('role', 'alert');
    this.errorElement.setAttribute('aria-live', 'polite');
    this.errorElement.style.display = 'none';
    this.appendChild(this.errorElement);

    // Setup event listeners
    this.selectElement.addEventListener('change', this.handleChange);
    this.selectElement.addEventListener('invalid', this.handleInvalid);
  }

  /**
   * Handle change event
   */
  private handleChange = (): void => {
    this.clearError();
    this.validate();
    this.dispatch('select:change', { value: this.selectElement?.value });
  };

  /**
   * Handle invalid event
   */
  private handleInvalid = (event: Event): void => {
    event.preventDefault();
    this.validate();
  };

  /**
   * Validate select
   */
  private validate(): boolean {
    if (!this.selectElement) return false;

    const isValid = this.selectElement.validity.valid;

    if (!isValid) {
      const errorMessage = this.selectElement.validationMessage || 'Please select a valid option';
      this.showError(errorMessage);
    } else {
      this.clearError();
    }

    this.dispatch('select:validate', { valid: isValid });

    return isValid;
  }

  /**
   * Show error message
   */
  private showError(message: string | null): void {
    if (!this.errorElement || !this.selectElement) return;

    if (message) {
      this.errorElement.textContent = message;
      this.errorElement.style.display = 'block';
      this.selectElement.setAttribute('aria-invalid', 'true');
      this.selectElement.setAttribute('aria-describedby', this.errorElement.id || 'error');
      this.setAttr('error', message);
    } else {
      this.clearError();
    }
  }

  /**
   * Clear error message
   */
  private clearError(): void {
    if (!this.errorElement || !this.selectElement) return;

    this.errorElement.textContent = '';
    this.errorElement.style.display = 'none';
    this.selectElement.removeAttribute('aria-invalid');
    this.selectElement.removeAttribute('aria-describedby');
    this.removeAttribute('error');
  }

  /**
   * Update label
   */
  private updateLabel(text: string | null): void {
    if (this.labelElement) {
      this.labelElement.textContent = text || '';
    } else if (text) {
      this.labelElement = document.createElement('label');
      this.labelElement.textContent = text;
      if (this.selectElement) {
        this.labelElement.setAttribute('for', this.selectElement.id);
      }
      this.insertBefore(this.labelElement, this.selectElement);
    }
  }

  /**
   * Get select value
   */
  public getValue(): string {
    return this.selectElement?.value || '';
  }

  /**
   * Set select value
   */
  public setValue(value: string): void {
    if (this.selectElement) {
      this.selectElement.value = value;
      this.setAttr('value', value);
      this.validate();
    }
  }

  /**
   * Check if select is valid
   */
  public isValid(): boolean {
    return this.selectElement?.validity.valid ?? false;
  }
}

customElements.define('warmthly-select', WarmthlySelect);

