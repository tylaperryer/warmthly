/**
 * Intersection Observer Utility
 * Provides type-safe intersection observer for scroll-triggered animations
 * Uses Intersection Observer API for efficient scroll detection
 */

/**
 * Intersection Observer options
 */
interface IntersectionObserverOptions {
  readonly threshold: number;
  readonly rootMargin: string;
}

/**
 * Default intersection observer options
 * Optimized for fade-in animations
 */
const DEFAULT_OPTIONS: IntersectionObserverOptions = {
  threshold: 0.2,
  rootMargin: '0px 0px -50px 0px',
};

/**
 * Initialize intersection observer for an element
 * Adds a class when element becomes visible in viewport
 *
 * @param selector - CSS selector for the element to observe
 * @param className - Class name to add when visible (default: 'visible')
 * @param options - Optional intersection observer options
 *
 * @example
 * ```typescript
 * initIntersectionObserver('.fade-in', 'visible');
 * ```
 */
export function initIntersectionObserver(
  selector: string,
  className = 'visible',
  options: Partial<IntersectionObserverOptions> = {}
): void {
  // Safety check for browser environment
  if (typeof document === 'undefined' || typeof IntersectionObserver === 'undefined') {
    if (import.meta.env.DEV) {
      console.warn('IntersectionObserver not available');
    }
    return;
  }

  // Validate selector
  if (!selector || typeof selector !== 'string') {
    if (import.meta.env.DEV) {
      console.warn('Invalid selector provided to initIntersectionObserver');
    }
    return;
  }

  try {
    const element = document.querySelector<HTMLElement>(selector);

    if (!element) {
      if (import.meta.env.DEV) {
        console.warn(`Element not found for selector: ${selector}`);
      }
      return;
    }

    // Merge options with defaults
    const observerOptions: IntersectionObserverInit = {
      threshold: options.threshold ?? DEFAULT_OPTIONS.threshold,
      rootMargin: options.rootMargin ?? DEFAULT_OPTIONS.rootMargin,
    };

    // Create intersection observer
    const observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target instanceof HTMLElement) {
          entry.target.classList.add(className);
          // Unobserve after adding class (one-time animation)
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Start observing
    observer.observe(element);
  } catch (error: unknown) {
    // Log error in development
    if (import.meta.env.DEV) {
      console.error('Error initializing intersection observer:', error);
    }
  }
}
