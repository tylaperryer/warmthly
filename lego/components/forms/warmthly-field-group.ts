/**
 * Warmthly Field Group Component
 * Groups form fields with label, help text, and error message
 * Privacy-first: No tracking, no cookies
 *
 * Usage:
 * <warmthly-field-group label="Email" help="We'll never share your email" error="Invalid email">
 *   <warmthly-input name="email" type="email"></warmthly-input>
 * </warmthly-field-group>
 */

import { BaseComponent } from '@core/base-component.js';

/**
 * Warmthly Field Group Component
 */
class WarmthlyFieldGroup extends BaseComponent {
  private labelElement: HTMLLabelElement | null = null;
  private helpElement: HTMLDivElement | null = null;
  private errorElement: HTMLDivElement | null = null;
  private fieldElement: HTMLElement | null = null;

  static override get observedAttributes(): readonly string[] {
    return ['label', 'help', 'help-link', 'error', 'required', 'id'];
  }

  public override onConnect(): void {
    this.createFieldGroup();
  }

  public override onAttributeChange(name: string): void {
    switch (name) {
      case 'label':
        this.updateLabel(this.getAttr('label'));
        break;
      case 'help':
      case 'help-link':
        this.updateHelp(this.getAttr('help'), this.getAttr('help-link'));
        break;
      case 'error':
        this.updateError(this.getAttr('error'));
        break;
      case 'required':
        this.updateRequired();
        break;
    }
  }

  /**
   * Create field group structure
   */
  private createFieldGroup(): void {
    // Find or create field element
    this.fieldElement = this.query<HTMLElement>(
      'warmthly-input, warmthly-textarea, warmthly-select, input, textarea, select'
    );

    if (!this.fieldElement) {
      // Create wrapper for children
      const wrapper = document.createElement('div');
      wrapper.className = 'field-wrapper';
      while (this.firstChild) {
        wrapper.appendChild(this.firstChild);
      }
      this.appendChild(wrapper);
      this.fieldElement =
        wrapper.querySelector<HTMLElement>(
          'warmthly-input, warmthly-textarea, warmthly-select, input, textarea, select'
        ) || wrapper;
    }

    // Create label
    const labelText = this.getAttr('label');
    if (labelText) {
      this.labelElement = document.createElement('label');
      this.labelElement.className = 'field-label';
      this.labelElement.textContent = labelText;

      // Link label to field
      const fieldId = this.getFieldId();
      if (fieldId) {
        this.labelElement.setAttribute('for', fieldId);
      }

      this.insertBefore(this.labelElement, this.fieldElement);
    }

    // Create help text
    const helpText = this.getAttr('help');
    const helpLink = this.getAttr('help-link');
    if (helpText) {
      this.helpElement = document.createElement('div');
      this.helpElement.className = 'field-help';
      this.helpElement.id = `help-${this.getFieldId() || Math.random().toString(36).substr(2, 9)}`;
      this.helpElement.setAttribute('aria-live', 'polite');

      // Create help content with optional icon and link
      const helpContent = document.createElement('span');
      helpContent.textContent = helpText;
      this.helpElement.appendChild(helpContent);

      // Add help icon and link if provided (WCAG 2.1 AAA 3.3.5 - Context-Sensitive Help)
      if (helpLink) {
        const helpIconLink = document.createElement('a');
        helpIconLink.href = helpLink;
        helpIconLink.className = 'field-help-link';
        helpIconLink.setAttribute('aria-label', `Get more help about ${helpText}`);
        helpIconLink.setAttribute('target', '_blank');
        helpIconLink.setAttribute('rel', 'noopener noreferrer');
        helpIconLink.textContent = ' ?';
        helpIconLink.style.cssText =
          'color: var(--warmthly-orange); text-decoration: none; font-weight: bold; margin-left: 0.25rem;';
        this.helpElement.appendChild(helpIconLink);
      }

      // Link help to field
      if (this.fieldElement) {
        const describedBy = this.fieldElement.getAttribute('aria-describedby') || '';
        this.fieldElement.setAttribute(
          'aria-describedby',
          `${describedBy} ${this.helpElement.id}`.trim()
        );
      }

      this.insertBefore(this.helpElement, this.fieldElement);
    }

    // Create error element
    this.errorElement = document.createElement('div');
    this.errorElement.className = 'field-error';
    this.errorElement.setAttribute('role', 'alert');
    this.errorElement.setAttribute('aria-live', 'assertive');
    this.errorElement.style.display = 'none';
    this.appendChild(this.errorElement);

    // Update error if provided
    const errorText = this.getAttr('error');
    if (errorText) {
      this.updateError(errorText);
    }

    // Update required indicator
    this.updateRequired();
  }

  /**
   * Get field ID
   */
  private getFieldId(): string | null {
    if (this.fieldElement) {
      return this.fieldElement.id || this.fieldElement.getAttribute('id') || null;
    }
    return null;
  }

  /**
   * Update label
   */
  private updateLabel(text: string | null): void {
    if (this.labelElement) {
      this.labelElement.textContent = text || '';
    } else if (text) {
      this.labelElement = document.createElement('label');
      this.labelElement.className = 'field-label';
      this.labelElement.textContent = text;

      const fieldId = this.getFieldId();
      if (fieldId) {
        this.labelElement.setAttribute('for', fieldId);
      }

      this.insertBefore(this.labelElement, this.fieldElement);
    }
  }

  /**
   * Update help text
   */
  private updateHelp(text: string | null, helpLink?: string | null): void {
    if (this.helpElement) {
      // Clear existing content
      this.helpElement.textContent = '';

      if (text) {
        const helpContent = document.createElement('span');
        helpContent.textContent = text;
        this.helpElement.appendChild(helpContent);

        // Add help link if provided
        const link = helpLink || this.getAttr('help-link');
        if (link) {
          const helpIconLink = document.createElement('a');
          helpIconLink.href = link;
          helpIconLink.className = 'field-help-link';
          helpIconLink.setAttribute('aria-label', `Get more help about ${text}`);
          helpIconLink.setAttribute('target', '_blank');
          helpIconLink.setAttribute('rel', 'noopener noreferrer');
          helpIconLink.textContent = ' ?';
          helpIconLink.style.cssText =
            'color: var(--warmthly-orange); text-decoration: none; font-weight: bold; margin-left: 0.25rem;';
          this.helpElement.appendChild(helpIconLink);
        }
      }

      this.helpElement.style.display = text ? 'block' : 'none';
    } else if (text) {
      this.helpElement = document.createElement('div');
      this.helpElement.className = 'field-help';
      this.helpElement.id = `help-${this.getFieldId() || Math.random().toString(36).substr(2, 9)}`;
      this.helpElement.setAttribute('aria-live', 'polite');

      const helpContent = document.createElement('span');
      helpContent.textContent = text;
      this.helpElement.appendChild(helpContent);

      // Add help link if provided
      const link = helpLink || this.getAttr('help-link');
      if (link) {
        const helpIconLink = document.createElement('a');
        helpIconLink.href = link;
        helpIconLink.className = 'field-help-link';
        helpIconLink.setAttribute('aria-label', `Get more help about ${text}`);
        helpIconLink.setAttribute('target', '_blank');
        helpIconLink.setAttribute('rel', 'noopener noreferrer');
        helpIconLink.textContent = ' ?';
        helpIconLink.style.cssText =
          'color: var(--warmthly-orange); text-decoration: none; font-weight: bold; margin-left: 0.25rem;';
        this.helpElement.appendChild(helpIconLink);
      }

      if (this.fieldElement) {
        const describedBy = this.fieldElement.getAttribute('aria-describedby') || '';
        this.fieldElement.setAttribute(
          'aria-describedby',
          `${describedBy} ${this.helpElement.id}`.trim()
        );
      }

      this.insertBefore(this.helpElement, this.fieldElement);
    }
  }

  /**
   * Update error message
   */
  private updateError(text: string | null): void {
    if (!this.errorElement) return;

    if (text) {
      this.errorElement.textContent = text;
      this.errorElement.style.display = 'block';

      // Link error to field
      if (this.fieldElement) {
        const fieldId =
          this.errorElement.id ||
          `error-${this.getFieldId() || Math.random().toString(36).substr(2, 9)}`;
        this.errorElement.id = fieldId;

        const describedBy = this.fieldElement.getAttribute('aria-describedby') || '';
        if (!describedBy.includes(fieldId)) {
          this.fieldElement.setAttribute('aria-describedby', `${describedBy} ${fieldId}`.trim());
        }

        this.fieldElement.setAttribute('aria-invalid', 'true');
      }
    } else {
      this.errorElement.textContent = '';
      this.errorElement.style.display = 'none';

      if (this.fieldElement) {
        this.fieldElement.removeAttribute('aria-invalid');
      }
    }
  }

  /**
   * Update required indicator
   */
  private updateRequired(): void {
    if (this.labelElement) {
      const required = this.hasAttr('required') || this.fieldElement?.hasAttribute('required');
      if (required) {
        // Add required indicator
        if (!this.labelElement.querySelector('.required-indicator')) {
          const indicator = document.createElement('span');
          indicator.className = 'required-indicator';
          indicator.textContent = ' *';
          indicator.setAttribute('aria-label', 'required');
          this.labelElement.appendChild(indicator);
        }
      } else {
        // Remove required indicator
        const indicator = this.labelElement.querySelector('.required-indicator');
        indicator?.remove();
      }
    }
  }

  /**
   * Set error message programmatically
   */
  public setError(message: string | null): void {
    this.setAttr('error', message || '');
    this.updateError(message);
  }

  /**
   * Clear error message
   */
  public clearError(): void {
    this.setError(null);
  }
}

customElements.define('warmthly-field-group', WarmthlyFieldGroup);
