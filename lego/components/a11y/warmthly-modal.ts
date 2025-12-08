/**
 * Warmthly Modal Component
 * Accessible modal dialog component
 * Privacy-first: No tracking, no cookies
 *
 * Usage:
 * <warmthly-modal id="myModal" title="Confirm Action">
 *   <p>Are you sure you want to proceed?</p>
 *   <warmthly-button slot="footer" onclick="closeModal()">Cancel</warmthly-button>
 *   <warmthly-button slot="footer" variant="primary" onclick="confirmAction()">Confirm</warmthly-button>
 * </warmthly-modal>
 */

import { BaseComponent } from '@core/base-component.js';
import { trapFocus } from '@utils/focus-trap.js';
import { lockBodyScroll, forceUnlockScroll } from '@utils/scroll-lock.js';

/**
 * Warmthly Modal Component
 */
class WarmthlyModal extends BaseComponent {
  private overlayElement: HTMLDivElement | null = null;
  private dialogElement: HTMLDialogElement | null = null;
  private titleElement: HTMLHeadingElement | null = null;
  private contentElement: HTMLDivElement | null = null;
  private footerElement: HTMLDivElement | null = null;
  private focusTrapCleanup: (() => void) | null = null;
  private isOpen = false;

  static override get observedAttributes(): readonly string[] {
    return ['open', 'title', 'aria-label', 'aria-labelledby'];
  }

  public override onConnect(): void {
    this.createModal();
    if (this.hasAttr('open')) {
      this.open();
    }
  }

  public override onDisconnect(): void {
    this.close();
  }

  public override onAttributeChange(name: string): void {
    switch (name) {
      case 'open':
        if (this.hasAttr('open')) {
          this.open();
        } else {
          this.close();
        }
        break;
      case 'title':
        this.updateTitle(this.getAttr('title'));
        break;
      case 'aria-label':
      case 'aria-labelledby':
        this.updateAriaLabel();
        break;
    }
  }

  /**
   * Create modal structure
   */
  private createModal(): void {
    // Create overlay
    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'modal-overlay';
    this.overlayElement.setAttribute('role', 'presentation');
    this.overlayElement.addEventListener('click', this.handleOverlayClick);

    // Create dialog
    this.dialogElement = document.createElement('dialog');
    this.dialogElement.className = 'modal-dialog';
    this.dialogElement.setAttribute('role', 'dialog');
    this.dialogElement.setAttribute('aria-modal', 'true');

    // Create title
    const titleText = this.getAttr('title');
    if (titleText) {
      this.titleElement = document.createElement('h2');
      this.titleElement.className = 'modal-title';
      this.titleElement.id = `modal-title-${Math.random().toString(36).substr(2, 9)}`;
      this.titleElement.textContent = titleText;
      this.dialogElement.appendChild(this.titleElement);
      this.dialogElement.setAttribute('aria-labelledby', this.titleElement.id);
    }

    // Create content area
    this.contentElement = document.createElement('div');
    this.contentElement.className = 'modal-content';
    this.contentElement.setAttribute('role', 'document');

    // Move non-slot children to content
    const footerSlots: Node[] = [];
    const children = Array.from(this.childNodes);
    for (const child of children) {
      if (child instanceof HTMLElement && child.getAttribute('slot') === 'footer') {
        footerSlots.push(child);
      } else if (child !== this.overlayElement && child !== this.dialogElement) {
        this.contentElement.appendChild(child);
      }
    }

    this.dialogElement.appendChild(this.contentElement);

    // Create footer if footer slots exist
    if (footerSlots.length > 0) {
      this.footerElement = document.createElement('div');
      this.footerElement.className = 'modal-footer';
      footerSlots.forEach(slot => {
        this.footerElement?.appendChild(slot);
      });
      this.dialogElement.appendChild(this.footerElement);
    }

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close';
    closeButton.setAttribute('aria-label', 'Close dialog');
    closeButton.innerHTML = '×';
    closeButton.addEventListener('click', () => this.close());
    this.dialogElement.appendChild(closeButton);

    this.overlayElement.appendChild(this.dialogElement);
    this.appendChild(this.overlayElement);

    // Update aria attributes
    this.updateAriaLabel();
  }

  /**
   * Update title
   */
  private updateTitle(text: string | null): void {
    if (text) {
      if (!this.titleElement) {
        this.titleElement = document.createElement('h2');
        this.titleElement.className = 'modal-title';
        this.titleElement.id = `modal-title-${Math.random().toString(36).substr(2, 9)}`;
        this.dialogElement?.insertBefore(this.titleElement, this.contentElement);
      }
      this.titleElement.textContent = text;
      this.dialogElement?.setAttribute('aria-labelledby', this.titleElement.id);
    } else if (this.titleElement) {
      this.titleElement.remove();
      this.titleElement = null;
      this.dialogElement?.removeAttribute('aria-labelledby');
    }
  }

  /**
   * Update aria-label
   */
  private updateAriaLabel(): void {
    if (!this.dialogElement) return;

    const ariaLabel = this.getAttr('aria-label');
    if (ariaLabel) {
      this.dialogElement.setAttribute('aria-label', ariaLabel);
      this.dialogElement.removeAttribute('aria-labelledby');
    } else if (this.titleElement) {
      this.dialogElement.setAttribute('aria-labelledby', this.titleElement.id);
      this.dialogElement.removeAttribute('aria-label');
    }
  }

  /**
   * Handle overlay click
   */
  private handleOverlayClick = (event: MouseEvent): void => {
    if (event.target === this.overlayElement) {
      this.close();
    }
  };

  /**
   * Open modal
   */
  public open(): void {
    if (this.isOpen || !this.dialogElement || !this.overlayElement) return;

    this.isOpen = true;
    this.setBoolAttr('open', true);
    this.overlayElement.style.display = 'flex';
    this.dialogElement.showModal();

    // Lock scroll
    lockBodyScroll();

    // Trap focus
    this.focusTrapCleanup = trapFocus(this.dialogElement);

    // Focus first focusable element
    const firstFocusable = this.dialogElement.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    // Dispatch open event
    this.dispatch('modal:open');

    // Listen for escape key
    document.addEventListener('keydown', this.handleEscape);
  }

  /**
   * Close modal
   */
  public close(): void {
    if (!this.isOpen || !this.dialogElement || !this.overlayElement) return;

    this.isOpen = false;
    this.setBoolAttr('open', false);
    this.dialogElement.close();
    this.overlayElement.style.display = 'none';

    // Unlock scroll
    forceUnlockScroll();

    // Remove focus trap
    if (this.focusTrapCleanup) {
      this.focusTrapCleanup();
      this.focusTrapCleanup = null;
    }

    // Remove escape listener
    document.removeEventListener('keydown', this.handleEscape);

    // Dispatch close event
    this.dispatch('modal:close');
  }

  /**
   * Handle escape key
   */
  private handleEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.isOpen) {
      this.close();
    }
  };
}

customElements.define('warmthly-modal', WarmthlyModal);
