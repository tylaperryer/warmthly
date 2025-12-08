/**
 * Warmthly Form Component
 * Base form component with validation and privacy-first submission
 * No tracking, no cookies, no analytics
 *
 * Usage:
 * <warmthly-form action="/api/submit" method="post">
 *   <warmthly-input name="email" type="email" required></warmthly-input>
 *   <warmthly-button type="submit">Submit</warmthly-button>
 * </warmthly-form>
 */

import {
  validateEmail,
  type ValidationResult,
} from '@api/middleware/index.js';
import { BaseComponent } from '@core/base-component.js';
import { ErrorSeverity } from '@core/error-boundary.js';

/**
 * Form validation schema
 */
export interface FormValidationSchema {
  readonly [fieldName: string]: (value: unknown) => ValidationResult;
}

/**
 * Form submission result
 */
export interface FormSubmissionResult {
  readonly success: boolean;
  readonly message?: string;
  readonly errors?: Record<string, string>;
  readonly data?: unknown;
}

/**
 * Warmthly Form Component
 */
class WarmthlyForm extends BaseComponent {
  private formElement: HTMLFormElement | null = null;
  private submitButton: HTMLButtonElement | null = null;
  private isSubmitting = false;

  static get observedAttributes(): readonly string[] {
    return ['action', 'method', 'novalidate', 'disabled'];
  }

  public onConnect(): void {
    this.formElement = this.query<HTMLFormElement>('form') || this.createFormElement();
    this.setupForm();
  }

  public onDisconnect(): void {
    // Cleanup event listeners
    if (this.formElement) {
      this.formElement.removeEventListener('submit', this.handleSubmit);
    }
  }

  public onAttributeChange(name: string): void {
    if (!this.formElement) return;

    switch (name) {
      case 'action':
        this.formElement.action = this.getAttr('action') || '';
        break;
      case 'method':
        this.formElement.method = (this.getAttr('method') || 'post').toLowerCase();
        break;
      case 'novalidate':
        this.formElement.noValidate = this.hasAttr('novalidate');
        break;
      case 'disabled':
        this.setFormDisabled(this.hasAttr('disabled'));
        break;
    }
  }

  /**
   * Create form element if it doesn't exist
   */
  private createFormElement(): HTMLFormElement {
    const form = document.createElement('form');
    form.action = this.getAttr('action') || '';
    form.method = (this.getAttr('method') || 'post').toLowerCase();
    form.noValidate = this.hasAttr('novalidate');

    // Move all children into form
    while (this.firstChild) {
      form.appendChild(this.firstChild);
    }

    this.appendChild(form);
    return form;
  }

  /**
   * Setup form event listeners
   */
  private setupForm(): void {
    if (!this.formElement) return;

    this.formElement.addEventListener('submit', this.handleSubmit);
    this.submitButton = this.formElement.querySelector(
      'button[type="submit"], warmthly-button[type="submit"]'
    ) as HTMLButtonElement;
  }

  /**
   * Handle form submission
   */
  private handleSubmit = async (event: Event): Promise<void> => {
    event.preventDefault();
    if (!this.formElement || this.isSubmitting) return;

    // Validate form
    const validation = this.validateForm();
    if (!validation.valid) {
      this.showErrors(validation.errors || {});
      return;
    }

    // Submit form
    await this.submitForm();
  };

  /**
   * Validate form fields
   */
  private validateForm(): { valid: boolean; errors?: Record<string, string> } {
    if (!this.formElement) {
      return { valid: false, errors: { _: 'Form not found' } };
    }

    const errors: Record<string, string> = {};
    const fields = Array.from(
      this.formElement.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        'input, textarea, select, warmthly-input, warmthly-textarea, warmthly-select'
      )
    );

    for (const field of Array.from(fields)) {
      const name = field.name || field.getAttribute('name') || '';
      if (!name) continue;

      const required = field.required || field.hasAttribute('required');
      const type = field.type || field.getAttribute('type') || 'text';
      const value = (field as HTMLInputElement).value || '';

      // Check required
      if (required && !value.trim()) {
        errors[name] = 'This field is required';
        continue;
      }

      // Skip validation if empty and not required
      if (!value.trim() && !required) {
        continue;
      }

      // Type-specific validation
      if (type === 'email' && value) {
        const emailValidation = validateEmail(value);
        if (!emailValidation.valid) {
          errors[name] = emailValidation.error || 'Invalid email address';
        }
      } else if (type === 'url' && value) {
        try {
          new URL(value);
        } catch {
          errors[name] = 'Invalid URL';
        }
      }

      // Length validation
      const minLength = field.getAttribute('minlength');
      const maxLength = field.getAttribute('maxlength');
      if (minLength && value.length < parseInt(minLength, 10)) {
        errors[name] = `Must be at least ${minLength} characters`;
      }
      if (maxLength && value.length > parseInt(maxLength, 10)) {
        errors[name] = `Must be no more than ${maxLength} characters`;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    };
  }

  /**
   * Show validation errors
   */
  private showErrors(errors: Record<string, string>): void {
    // Dispatch error event
    this.dispatch('form:error', { errors });

    // Show errors on fields
    for (const [fieldName, errorMessage] of Object.entries(errors)) {
      const field = this.formElement?.querySelector<HTMLElement>(
        `[name="${fieldName}"], warmthly-input[name="${fieldName}"], warmthly-textarea[name="${fieldName}"], warmthly-select[name="${fieldName}"]`
      );
      if (field) {
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', `error-${fieldName}`);

        // Create or update error message
        let errorElement = document.getElementById(`error-${fieldName}`);
        if (!errorElement) {
          errorElement = document.createElement('div');
          errorElement.id = `error-${fieldName}`;
          errorElement.className = 'form-error';
          errorElement.setAttribute('role', 'alert');
          field.parentElement?.appendChild(errorElement);
        }
        errorElement.textContent = errorMessage;
      }
    }
  }

  /**
   * Clear all errors
   */
  private clearErrors(): void {
    const errorElements = this.formElement?.querySelectorAll('.form-error');
    errorElements?.forEach(el => el.remove());

    const fields = this.formElement?.querySelectorAll('[aria-invalid="true"]');
    fields?.forEach(field => {
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
    });
  }

  /**
   * Submit form
   */
  private async submitForm(): Promise<void> {
    if (!this.formElement) return;

    this.isSubmitting = true;
    this.setFormDisabled(true);
    this.clearErrors();

    // Dispatch submit event
    this.dispatch('form:submit', { formData: new FormData(this.formElement) });

    try {
      const formData = new FormData(this.formElement);
      const action = this.formElement.action || this.getAttr('action') || '';
      const method = (this.formElement.method || this.getAttr('method') || 'post').toLowerCase();

      // Convert FormData to object for JSON submission
      const data: Record<string, unknown> = {};
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }

      const response = await fetch(action, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Form submission failed');
      }

      // Success
      this.dispatch<FormSubmissionResult>('form:success', {
        success: true,
        message: result.message || 'Form submitted successfully',
        data: result,
      });

      // Reset form
      this.formElement.reset();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      this.dispatch<FormSubmissionResult>('form:error', {
        success: false,
        message: errorMessage,
      });
      this.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        component: 'WarmthlyForm',
        operation: 'submitForm',
        userMessage: 'Failed to submit form. Please try again.',
        recoverable: true,
      });
    } finally {
      this.isSubmitting = false;
      this.setFormDisabled(false);
    }
  }

  /**
   * Set form disabled state
   */
  private setFormDisabled(disabled: boolean): void {
    if (!this.formElement) return;

    const fields = this.formElement.querySelectorAll<HTMLElement>(
      'input, textarea, select, button, warmthly-input, warmthly-textarea, warmthly-select, warmthly-button'
    );
    fields.forEach(field => {
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLTextAreaElement ||
        field instanceof HTMLSelectElement ||
        field instanceof HTMLButtonElement
      ) {
        field.disabled = disabled;
      } else {
        field.setAttribute('disabled', disabled ? '' : '');
      }
    });

    if (this.submitButton) {
      this.submitButton.disabled = disabled;
      if (disabled) {
        this.submitButton.setAttribute('aria-busy', 'true');
      } else {
        this.submitButton.removeAttribute('aria-busy');
      }
    }
  }
}

customElements.define('warmthly-form', WarmthlyForm);
