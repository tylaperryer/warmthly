/**
 * Warmthly Skeleton Component
 * Loading placeholder component for better perceived performance
 * Privacy-first: No tracking, no cookies
 *
 * Usage:
 * <warmthly-skeleton width="200" height="20"></warmthly-skeleton>
 * <warmthly-skeleton variant="text" lines="3"></warmthly-skeleton>
 * <warmthly-skeleton variant="circle" size="40"></warmthly-skeleton>
 */

import { BaseComponent } from '@core/base-component.js';

/**
 * Skeleton variants
 */
export type SkeletonVariant = 'text' | 'rect' | 'circle' | 'custom';

/**
 * Warmthly Skeleton Component
 */
class WarmthlySkeleton extends BaseComponent {
  private skeletonElement: HTMLDivElement | null = null;

  static override get observedAttributes(): readonly string[] {
    return ['width', 'height', 'variant', 'lines', 'size', 'animated'];
  }

  public override onConnect(): void {
    this.createSkeleton();
  }

  public override onAttributeChange(): void {
    this.createSkeleton();
  }

  /**
   * Create skeleton element
   */
  private createSkeleton(): void {
    // Remove existing skeleton
    if (this.skeletonElement) {
      this.skeletonElement.remove();
    }

    const variant = (this.getAttr('variant') || 'rect') as SkeletonVariant;
    const animated = this.hasAttr('animated') !== false; // Default to true

    this.skeletonElement = document.createElement('div');
    this.skeletonElement.className = `skeleton skeleton-${variant}`;

    if (animated) {
      this.skeletonElement.classList.add('skeleton-animated');
    }

    // Set dimensions based on variant
    switch (variant) {
      case 'text':
        this.createTextSkeleton();
        break;
      case 'circle':
        this.createCircleSkeleton();
        break;
      case 'rect':
      case 'custom':
      default:
        this.createRectSkeleton();
        break;
    }

    this.appendChild(this.skeletonElement);
  }

  /**
   * Create text skeleton
   */
  private createTextSkeleton(): void {
    if (!this.skeletonElement) return;

    const lines = parseInt(this.getAttr('lines') || '1', 10);
    const width = this.getAttr('width') || '100%';

    for (let i = 0; i < lines; i++) {
      const line = document.createElement('div');
      line.className = 'skeleton-line';
      line.style.width = i === lines - 1 ? '80%' : width;
      line.style.height = this.getAttr('height') || '1em';
      this.skeletonElement.appendChild(line);
    }
  }

  /**
   * Create circle skeleton
   */
  private createCircleSkeleton(): void {
    if (!this.skeletonElement) return;

    const size = this.getAttr('size') || this.getAttr('width') || this.getAttr('height') || '40px';
    this.skeletonElement.style.width = size;
    this.skeletonElement.style.height = size;
    this.skeletonElement.style.borderRadius = '50%';
  }

  /**
   * Create rectangle skeleton
   */
  private createRectSkeleton(): void {
    if (!this.skeletonElement) return;

    const width = this.getAttr('width') || '100%';
    const height = this.getAttr('height') || '20px';

    this.skeletonElement.style.width = width;
    this.skeletonElement.style.height = height;
  }
}

customElements.define('warmthly-skeleton', WarmthlySkeleton);
