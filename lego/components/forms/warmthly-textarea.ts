/**
 * Warmthly Textarea Component
 * Accessible, validated textarea component
 * Privacy-first: No tracking, no cookies
 *
 * Usage:
 * <warmthly-textarea
 *   name="message"
 *   label="Message"
 *   required
 *   placeholder="Enter your message...">
 * </warmthly-textarea>
 */

import { validateString, type ValidationResult } from '@api/middleware/index.js';
import { BaseComponent } from '@core/base-component.js';

/**
 * Warmthly Textarea Component
 */
class WarmthlyTextarea extends BaseComponent {
  private textareaElement: HTMLTextAreaElement | null = null;
  private labelElement: HTMLLabelElement | null = null;
  private errorElement: HTMLDivElement | null = null;
  private validationTimeout: number | null = null;

  static override get observedAttributes(): readonly string[] {
    return [
      'name',
      'value',
      'placeholder',
      'required',
      'disabled',
      'readonly',
      'minlength',
      'maxlength',
      'rows',
      'cols',
      'label',
      'error',
      'aria-label',
      'aria-describedby',
    ];
  }

  public override onConnect(): void {
    this.createTextarea();
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
    if (!this.textareaElement) return;

    switch (name) {
      case 'name':
        this.textareaElement.name = newValue || '';
        break;
      case 'value':
        if (this.textareaElement.value !== newValue) {
          this.textareaElement.value = newValue || '';
          this.validate();
        }
        break;
      case 'placeholder':
        this.textareaElement.placeholder = newValue || '';
        break;
      case 'required':
        this.textareaElement.required = this.hasAttr('required');
        break;
      case 'disabled':
        this.textareaElement.disabled = this.hasAttr('disabled');
        break;
      case 'readonly':
        this.textareaElement.readOnly = this.hasAttr('readonly');
        break;
      case 'minlength':
        this.textareaElement.minLength = newValue ? parseInt(newValue, 10) : 0;
        break;
      case 'maxlength':
        this.textareaElement.maxLength = newValue ? parseInt(newValue, 10) : 0;
        break;
      case 'rows':
        this.textareaElement.rows = newValue ? parseInt(newValue, 10) : 2;
        break;
      case 'cols':
        this.textareaElement.cols = newValue ? parseInt(newValue, 10) : 20;
        break;
      case 'label':
        this.updateLabel(newValue);
        break;
      case 'error':
        this.showError(newValue);
        break;
      case 'aria-label':
        this.textareaElement.setAttribute('aria-label', newValue || '');
        break;
      case 'aria-describedby':
        this.textareaElement.setAttribute('aria-describedby', newValue || '');
        break;
    }
  }

  /**
   * Create textarea element
   */
  private createTextarea(): void {
    // Create label if provided
    const labelText = this.getAttr('label');
    if (labelText) {
      this.labelElement = document.createElement('label');
      this.labelElement.textContent = labelText;
      const textareaId =
        this.getAttr('id') || `textarea-${Math.random().toString(36).substr(2, 9)}`;
      this.labelElement.setAttribute('for', textareaId);
      this.setAttr('id', textareaId);
      this.appendChild(this.labelElement);
    }

    // Create textarea
    this.textareaElement = document.createElement('textarea');
    this.textareaElement.id =
      this.getAttr('id') || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    this.textareaElement.name = this.getAttr('name') || '';
    this.textareaElement.value = this.getAttr('value') || '';
    this.textareaElement.placeholder = this.getAttr('placeholder') || '';
    this.textareaElement.required = this.hasAttr('required');
    this.textareaElement.disabled = this.hasAttr('disabled');
    this.textareaElement.readOnly = this.hasAttr('readonly');
    this.textareaElement.rows = parseInt(this.getAttr('rows') || '4', 10);
    this.textareaElement.cols = parseInt(this.getAttr('cols') || '40', 10);

    const minLength = this.getAttr('minlength');
    const maxLength = this.getAttr('maxlength');
    if (minLength) this.textareaElement.minLength = parseInt(minLength, 10);
    if (maxLength) this.textareaElement.maxLength = parseInt(maxLength, 10);

    // Update label for attribute
    if (this.labelElement) {
      this.labelElement.setAttribute('for', this.textareaElement.id);
    }

    this.appendChild(this.textareaElement);

    // Create error element
    this.errorElement = document.createElement('div');
    this.errorElement.className = 'form-error';
    this.errorElement.setAttribute('role', 'alert');
    this.errorElement.setAttribute('aria-live', 'polite');
    this.errorElement.style.display = 'none';
    this.appendChild(this.errorElement);

    // Setup event listeners
    this.textareaElement.addEventListener('input', this.handleInput);
    this.textareaElement.addEventListener('blur', this.handleBlur);
    this.textareaElement.addEventListener('invalid', this.handleInvalid);
  }

  /**
   * Setup validation
   */
  private setupValidation(): void {
    if (this.textareaElement?.value) {
      this.validate();
    }
  }

  /**
   * Handle input event
   */
  private handleInput = (): void => {
    this.clearError();

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
   * Validate textarea
   */
  private validate(): ValidationResult {
    if (!this.textareaElement) {
      return { valid: false, error: 'Textarea element not found' };
    }

    const value = this.textareaElement.value;
    const required = this.textareaElement.required;

    if (required && !value.trim()) {
      this.showError('This field is required');
      return { valid: false, error: 'This field is required' };
    }

    if (!value.trim() && !required) {
      this.clearError();
      return { valid: true, sanitized: '' };
    }

    const result = validateString(value, {
      minLength: this.textareaElement.minLength || undefined,
      maxLength: this.textareaElement.maxLength || undefined,
    });

    if (!result.valid) {
      this.showError(result.error || 'Invalid value');
    } else {
      this.clearError();
    }

    this.dispatch('textarea:validate', { valid: result.valid, error: result.error });

    return result;
  }

  /**
   * Show error message
   */
  private showError(message: string | null): void {
    if (!this.errorElement || !this.textareaElement) return;

    if (message) {
      this.errorElement.textContent = message;
      this.errorElement.style.display = 'block';
      this.textareaElement.setAttribute('aria-invalid', 'true');
      this.textareaElement.setAttribute('aria-describedby', this.errorElement.id || 'error');
      this.setAttr('error', message);
    } else {
      this.clearError();
    }
  }

  /**
   * Clear error message
   */
  private clearError(): void {
    if (!this.errorElement || !this.textareaElement) return;

    this.errorElement.textContent = '';
    this.errorElement.style.display = 'none';
    this.textareaElement.removeAttribute('aria-invalid');
    this.textareaElement.removeAttribute('aria-describedby');
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
      if (this.textareaElement) {
        this.labelElement.setAttribute('for', this.textareaElement.id);
      }
      this.insertBefore(this.labelElement, this.textareaElement);
    }
  }

  /**
   * Get textarea value
   */
  public getValue(): string {
    return this.textareaElement?.value || '';
  }

  /**
   * Set textarea value
   */
  public setValue(value: string): void {
    if (this.textareaElement) {
      this.textareaElement.value = value;
      this.setAttr('value', value);
      this.validate();
    }
  }

  /**
   * Check if textarea is valid
   */
  public isValid(): boolean {
    return this.textareaElement?.validity.valid ?? false;
  }
}

customElements.define('warmthly-textarea', WarmthlyTextarea);
