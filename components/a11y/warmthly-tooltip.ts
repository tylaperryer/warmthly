/**
 * Warmthly Tooltip Component
 * Accessible tooltip component
 * Privacy-first: No tracking, no cookies
 *
 * Usage:
 * <button>
 *   Hover me
 *   <warmthly-tooltip>This is a helpful tooltip</warmthly-tooltip>
 * </button>
 */

import { BaseComponent } from '@core/base-component.js';

/**
 * Tooltip positions
 */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Warmthly Tooltip Component
 */
class WarmthlyTooltip extends BaseComponent {
  private tooltipElement: HTMLDivElement | null = null;
  private triggerElement: HTMLElement | null = null;
  private showTimeout: number | null = null;
  private hideTimeout: number | null = null;
  private isVisible = false;

  static get observedAttributes(): readonly string[] {
    return ['position', 'delay', 'aria-label'];
  }

  public onConnect(): void {
    this.createTooltip();
    this.attachToParent();
  }

  public onDisconnect(): void {
    this.detachFromParent();
    this.clearTimeouts();
  }

  public onAttributeChange(name: string): void {
    switch (name) {
      case 'position':
        this.updatePosition();
        break;
      case 'aria-label':
        this.updateAriaLabel();
        break;
    }
  }

  /**
   * Create tooltip element
   */
  private createTooltip(): void {
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.className = 'tooltip';
    this.tooltipElement.setAttribute('role', 'tooltip');
    this.tooltipElement.setAttribute('aria-hidden', 'true');

    // Move content to tooltip
    while (this.firstChild) {
      this.tooltipElement.appendChild(this.firstChild);
    }

    // If no content, use aria-label
    if (!this.tooltipElement.textContent) {
      const ariaLabel = this.getAttr('aria-label');
      if (ariaLabel) {
        this.tooltipElement.textContent = ariaLabel;
      }
    }

    this.appendChild(this.tooltipElement);
    this.updatePosition();
    this.updateAriaLabel();
  }

  /**
   * Attach to parent element
   */
  private attachToParent(): void {
    this.triggerElement = this.triggerElement || (this.parentNode as HTMLElement);

    if (!this.triggerElement) return;

    // Make parent focusable if needed
    if (!this.triggerElement.hasAttribute('tabindex') && !this.isFocusable(this.triggerElement)) {
      this.triggerElement.setAttribute('tabindex', '0');
    }

    // Set aria-describedby
    const tooltipId =
      this.tooltipElement?.id || `tooltip-${Math.random().toString(36).substr(2, 9)}`;
    if (this.tooltipElement) {
      this.tooltipElement.id = tooltipId;
    }

    const describedBy = this.triggerElement.getAttribute('aria-describedby') || '';
    if (!describedBy.includes(tooltipId)) {
      this.triggerElement.setAttribute('aria-describedby', `${describedBy} ${tooltipId}`.trim());
    }

    // Add event listeners
    this.triggerElement.addEventListener('mouseenter', this.handleMouseEnter);
    this.triggerElement.addEventListener('mouseleave', this.handleMouseLeave);
    this.triggerElement.addEventListener('focus', this.handleFocus);
    this.triggerElement.addEventListener('blur', this.handleBlur);
  }

  /**
   * Detach from parent element
   */
  private detachFromParent(): void {
    if (!this.triggerElement) return;

    this.triggerElement.removeEventListener('mouseenter', this.handleMouseEnter);
    this.triggerElement.removeEventListener('mouseleave', this.handleMouseLeave);
    this.triggerElement.removeEventListener('focus', this.handleFocus);
    this.triggerElement.removeEventListener('blur', this.handleBlur);
  }

  /**
   * Check if element is focusable
   */
  private isFocusable(element: HTMLElement): boolean {
    const focusableSelectors = [
      'a[href]',
      'button',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])',
    ];
    return focusableSelectors.some(selector => element.matches(selector));
  }

  /**
   * Handle mouse enter
   */
  private handleMouseEnter = (): void => {
    this.clearTimeouts();
    const delay = parseInt(this.getAttr('delay') || '200', 10);
    this.showTimeout = window.setTimeout(() => {
      this.show();
    }, delay);
  };

  /**
   * Handle mouse leave
   */
  private handleMouseLeave = (): void => {
    this.clearTimeouts();
    this.hideTimeout = window.setTimeout(() => {
      this.hide();
    }, 100);
  };

  /**
   * Handle focus
   */
  private handleFocus = (): void => {
    this.clearTimeouts();
    this.show();
  };

  /**
   * Handle blur
   */
  private handleBlur = (): void => {
    this.clearTimeouts();
    this.hide();
  };

  /**
   * Show tooltip
   */
  private show(): void {
    if (this.isVisible || !this.tooltipElement) return;

    this.isVisible = true;
    this.tooltipElement.setAttribute('aria-hidden', 'false');
    this.tooltipElement.classList.add('visible');
    this.updatePosition();
  }

  /**
   * Hide tooltip
   */
  private hide(): void {
    if (!this.isVisible || !this.tooltipElement) return;

    this.isVisible = false;
    this.tooltipElement.setAttribute('aria-hidden', 'true');
    this.tooltipElement.classList.remove('visible');
  }

  /**
   * Update position
   */
  private updatePosition(): void {
    if (!this.tooltipElement) return;

    const position = (this.getAttr('position') || 'top') as TooltipPosition;
    this.tooltipElement.classList.remove(
      'position-top',
      'position-bottom',
      'position-left',
      'position-right'
    );
    this.tooltipElement.classList.add(`position-${position}`);
  }

  /**
   * Update aria-label
   */
  private updateAriaLabel(): void {
    if (!this.tooltipElement) return;

    const ariaLabel = this.getAttr('aria-label');
    if (ariaLabel && !this.tooltipElement.textContent) {
      this.tooltipElement.textContent = ariaLabel;
    }
  }

  /**
   * Clear timeouts
   */
  private clearTimeouts(): void {
    if (this.showTimeout !== null) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    if (this.hideTimeout !== null) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
}

customElements.define('warmthly-tooltip', WarmthlyTooltip);
