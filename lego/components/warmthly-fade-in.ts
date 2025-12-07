/**
 * Warmthly Fade-In Web Component
 * Provides smooth fade-in animation for elements on page load
 * 
 * Usage:
 * <warmthly-fade-in target=".header, .header-right, .top-left-heading" delay="200"></warmthly-fade-in>
 * OR
 * <warmthly-fade-in target=".method-section" delay="300" threshold="0.2"></warmthly-fade-in>
 */

interface FadeInOptions {
  target: string;
  delay?: number;
  threshold?: number;
  rootMargin?: string;
  duration?: number;
}

/**
 * Warmthly Fade-In Web Component
 */
class WarmthlyFadeIn extends HTMLElement {
  private observer: IntersectionObserver | null = null;
  private styleElement: HTMLStyleElement | null = null;

  /**
   * Called when element is inserted into the DOM
   */
  connectedCallback(): void {
    // Safety check for browser environment
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    try {
      const target = this.getAttribute('target') || '.header, .header-right, .top-left-heading';
      const delay = parseInt(this.getAttribute('delay') || '200', 10);
      const threshold = parseFloat(this.getAttribute('threshold') || '0');
      const rootMargin = this.getAttribute('root-margin') || '0px';
      const duration = parseInt(this.getAttribute('duration') || '600', 10);

      this.injectStyles(duration);
      this.initializeAnimation(target, delay, threshold, rootMargin);
    } catch (error: unknown) {
      if (import.meta.env.DEV) {
        console.error('Error in warmthly-fade-in connectedCallback:', error);
      }
    }
  }

  /**
   * Called when element is removed from the DOM
   */
  disconnectedCallback(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
      this.styleElement = null;
    }
  }

  /**
   * Inject CSS styles for fade-in animation
   */
  private injectStyles(duration: number): void {
    // Check if styles already exist
    if (document.getElementById('warmthly-fade-in-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'warmthly-fade-in-styles';
    style.textContent = `
      .warmthly-fade-in-target {
        opacity: 0;
        animation: warmthlyFadeIn ${duration}ms ease-out forwards;
      }

      @keyframes warmthlyFadeIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Fix header positioning when inside .header-left */
      .header-left .top-left-heading {
        position: relative;
        top: auto;
        left: auto;
      }
    `;
    document.head.appendChild(style);
    this.styleElement = style;
  }

  /**
   * Initialize fade-in animation for target elements
   */
  private initializeAnimation(
    targetSelector: string,
    delay: number,
    threshold: number,
    rootMargin: string
  ): void {
    const selectors = targetSelector.split(',').map(s => s.trim());
    const elements: Element[] = [];

    // Find all target elements
    selectors.forEach(selector => {
      try {
        const found = document.querySelectorAll(selector);
        found.forEach(el => elements.push(el));
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn(`Invalid selector: ${selector}`, error);
        }
      }
    });

    if (elements.length === 0) {
      // Fallback: Show immediately if no elements found
      return;
    }

    // If threshold is 0, show immediately (for elements already in viewport)
    if (threshold === 0) {
      elements.forEach((element, index) => {
        setTimeout(() => {
          element.classList.add('warmthly-fade-in-target');
          // Trigger animation
          requestAnimationFrame(() => {
            (element as HTMLElement).style.animationDelay = `${index * 50}ms`;
          });
        }, delay);
      });
      return;
    }

    // Use IntersectionObserver for elements that need to scroll into view
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: Show immediately if IntersectionObserver not supported
      elements.forEach((element, index) => {
        setTimeout(() => {
          element.classList.add('warmthly-fade-in-target');
          (element as HTMLElement).style.animationDelay = `${index * 50}ms`;
        }, delay);
      });
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('warmthly-fade-in-target');
              (entry.target as HTMLElement).style.animationDelay = `${index * 50}ms`;
            }, delay);
            if (this.observer) {
              this.observer.unobserve(entry.target);
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    // Observe all target elements
    elements.forEach(element => {
      this.observer?.observe(element);
    });

    // Fallback: Show after 2 seconds if still not visible
    setTimeout(() => {
      elements.forEach((element, index) => {
        if (!element.classList.contains('warmthly-fade-in-target')) {
          element.classList.add('warmthly-fade-in-target');
          (element as HTMLElement).style.animationDelay = `${index * 50}ms`;
        }
      });
    }, 2000);
  }
}

// Register the custom element
customElements.define('warmthly-fade-in', WarmthlyFadeIn);

// Export for potential programmatic use
export { WarmthlyFadeIn };

