/**
 * Warmthly Input Component
 * Accessible, validated input field component
 * Privacy-first: No tracking, no cookies
 *
 * Usage:
 * <warmthly-input
 *   name="email"
 *   type="email"
 *   label="Email Address"
 *   required
 *   placeholder="your@email.com">
 * </warmthly-input>
 */

import {
  validateEmail,
  validateString,
  validateUrl,
  type ValidationResult,
} from '@api/middleware/index.js';
import { BaseComponent } from '@core/base-component.js';

/**
 * Warmthly Input Component
 */
class WarmthlyInput extends BaseComponent {
  private inputElement: HTMLInputElement | null = null;
  private labelElement: HTMLLabelElement | null = null;
  private errorElement: HTMLDivElement | null = null;
  private validationTimeout: number | null = null;

  static override get observedAttributes(): readonly string[] {
    return [
      'name',
      'type',
      'value',
      'placeholder',
      'required',
      'disabled',
      'readonly',
      'minlength',
      'maxlength',
      'pattern',
      'autocomplete',
      'label',
      'error',
      'aria-label',
      'aria-describedby',
    ];
  }

  public override onConnect(): void {
    this.createInput();
    this.setupValidation();
  }

  public override onDisconnect(): void {
    if (this.validationTimeout !== null) {
      clearTimeout(this.validationTimeout);
    }
  }

  public override onAttributeChange(
    name: string,
    _oldValue: string | null,
    newValue: string | null
  ): void {
    if (!this.inputElement) return;

    switch (name) {
      case 'name':
        this.inputElement.name = newValue || '';
        break;
      case 'type':
        this.inputElement.type = newValue || 'text';
        break;
      case 'value':
        if (this.inputElement.value !== newValue) {
          this.inputElement.value = newValue || '';
          this.validate();
        }
        break;
      case 'placeholder':
        this.inputElement.placeholder = newValue || '';
        break;
      case 'required':
        this.inputElement.required = this.hasAttr('required');
        break;
      case 'disabled':
        this.inputElement.disabled = this.hasAttr('disabled');
        break;
      case 'readonly':
        this.inputElement.readOnly = this.hasAttr('readonly');
        break;
      case 'minlength':
        this.inputElement.minLength = newValue ? parseInt(newValue, 10) : 0;
        break;
      case 'maxlength':
        this.inputElement.maxLength = newValue ? parseInt(newValue, 10) : 0;
        break;
      case 'pattern':
        this.inputElement.pattern = newValue || '';
        break;
      case 'autocomplete':
        this.inputElement.autocomplete = (newValue || 'off') as AutoFill;
        break;
      case 'label':
        this.updateLabel(newValue);
        break;
      case 'error':
        this.showError(newValue);
        break;
      case 'aria-label':
        this.inputElement.setAttribute('aria-label', newValue || '');
        break;
      case 'aria-describedby':
        this.inputElement.setAttribute('aria-describedby', newValue || '');
        break;
    }
  }

  /**
   * Create input element
   */
  private createInput(): void {
    // Create label if provided
    const labelText = this.getAttr('label');
    if (labelText) {
      this.labelElement = document.createElement('label');
      this.labelElement.textContent = labelText;
      const inputId = this.getAttr('id') || `input-${Math.random().toString(36).substr(2, 9)}`;
      this.labelElement.setAttribute('for', inputId);
      this.setAttr('id', inputId);
      this.appendChild(this.labelElement);
    }

    // Create input
    this.inputElement = document.createElement('input');
    this.inputElement.id = this.getAttr('id') || `input-${Math.random().toString(36).substr(2, 9)}`;
    this.inputElement.name = this.getAttr('name') || '';
    this.inputElement.type = this.getAttr('type') || 'text';
    this.inputElement.value = this.getAttr('value') || '';
    this.inputElement.placeholder = this.getAttr('placeholder') || '';
    this.inputElement.required = this.hasAttr('required');
    this.inputElement.disabled = this.hasAttr('disabled');
    this.inputElement.readOnly = this.hasAttr('readonly');
    this.inputElement.autocomplete = (this.getAttr('autocomplete') || 'off') as AutoFill;

    const minLength = this.getAttr('minlength');
    const maxLength = this.getAttr('maxlength');
    if (minLength) this.inputElement.minLength = parseInt(minLength, 10);
    if (maxLength) this.inputElement.maxLength = parseInt(maxLength, 10);

    const pattern = this.getAttr('pattern');
    if (pattern) this.inputElement.pattern = pattern;

    // Update label for attribute
    if (this.labelElement) {
      this.labelElement.setAttribute('for', this.inputElement.id);
    }

    this.appendChild(this.inputElement);

    // Create error element
    this.errorElement = document.createElement('div');
    this.errorElement.className = 'form-error';
    this.errorElement.setAttribute('role', 'alert');
    this.errorElement.setAttribute('aria-live', 'polite');
    this.errorElement.style.display = 'none';
    this.appendChild(this.errorElement);

    // Setup event listeners
    this.inputElement.addEventListener('input', this.handleInput);
    this.inputElement.addEventListener('blur', this.handleBlur);
    this.inputElement.addEventListener('invalid', this.handleInvalid);
  }

  /**
   * Setup validation
   */
  private setupValidation(): void {
    // Validate on initial render if value exists
    if (this.inputElement?.value) {
      this.validate();
    }
  }

  /**
   * Handle input event
   */
  private handleInput = (): void => {
    // Clear error on input
    this.clearError();

    // Debounced validation
    if (this.validationTimeout !== null) {
      clearTimeout(this.validationTimeout);
    }

    this.validationTimeout = window.setTimeout(() => {
      this.validate();
    }, 300);
  };

  /**
   * Handle blur event
   */
  private handleBlur = (): void => {
    this.validate();
  };

  /**
   * Handle invalid event
   */
  private handleInvalid = (event: Event): void => {
    event.preventDefault();
    this.validate();
  };

  /**
   * Validate input
   */
  private validate(): ValidationResult {
    if (!this.inputElement) {
      return { valid: false, error: 'Input element not found' };
    }

    const value = this.inputElement.value;
    const type = this.inputElement.type;
    const required = this.inputElement.required;

    // Check required
    if (required && !value.trim()) {
      this.showError('This field is required');
      return { valid: false, error: 'This field is required' };
    }

    // Skip validation if empty and not required
    if (!value.trim() && !required) {
      this.clearError();
      return { valid: true, sanitized: '' };
    }

    // Type-specific validation
    let result: ValidationResult;
    switch (type) {
      case 'email':
        result = validateEmail(value);
        break;
      case 'url':
        result = validateUrl(value);
        break;
      default:
        result = validateString(value, {
          minLength: this.inputElement.minLength || undefined,
          maxLength: this.inputElement.maxLength || undefined,
          pattern: this.inputElement.pattern ? new RegExp(this.inputElement.pattern) : undefined,
        });
    }

    if (!result.valid) {
      this.showError(result.error || 'Invalid value');
    } else {
      this.clearError();
    }

    // Dispatch validation event
    this.dispatch('input:validate', { valid: result.valid, error: result.error });

    return result;
  }

  /**
   * Show error message
   */
  private showError(message: string | null): void {
    if (!this.errorElement || !this.inputElement) return;

    if (message) {
      this.errorElement.textContent = message;
      this.errorElement.style.display = 'block';
      this.inputElement.setAttribute('aria-invalid', 'true');
      this.inputElement.setAttribute('aria-describedby', this.errorElement.id || 'error');
      this.setAttr('error', message);
    } else {
      this.clearError();
    }
  }

  /**
   * Clear error message
   */
  private clearError(): void {
    if (!this.errorElement || !this.inputElement) return;

    this.errorElement.textContent = '';
    this.errorElement.style.display = 'none';
    this.inputElement.removeAttribute('aria-invalid');
    this.inputElement.removeAttribute('aria-describedby');
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
      if (this.inputElement) {
        this.labelElement.setAttribute('for', this.inputElement.id);
      }
      this.insertBefore(this.labelElement, this.inputElement);
    }
  }

  /**
   * Get input value
   */
  public getValue(): string {
    return this.inputElement?.value || '';
  }

  /**
   * Set input value
   */
  public setValue(value: string): void {
    if (this.inputElement) {
      this.inputElement.value = value;
      this.setAttr('value', value);
      this.validate();
    }
  }

  /**
   * Check if input is valid
   */
  public isValid(): boolean {
    return this.inputElement?.validity.valid ?? false;
  }
}

customElements.define('warmthly-input', WarmthlyInput);
