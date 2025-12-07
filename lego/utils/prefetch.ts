/**
 * Link Prefetching Utility
 * Intelligently prefetches pages and resources for improved performance
 * Uses Resource Hints API for efficient prefetching
 */

/**
 * Pages to prefetch on initialization
 * High-priority pages that users are likely to visit
 */
const PAGES_TO_PREFETCH: readonly string[] = [
  '/post/index.html',
  '/mint/index.html',
  '/post/vote.html',
  '/mint/research.html',
] as const;

/**
 * Prefetch delay after fonts load (milliseconds)
 */
const PREFETCH_DELAY_AFTER_FONTS = 1000;

/**
 * Prefetch delay fallback (milliseconds)
 */
const PREFETCH_DELAY_FALLBACK = 2000;

/**
 * Prefetch a single page
 * Creates a prefetch link element and adds it to the document head
 * 
 * @param page - URL path to prefetch
 */
function prefetchPage(page: string): void {
  // Safety check for browser environment
  if (typeof document === 'undefined' || typeof document.head === 'undefined') {
    return;
  }

  try {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = page;
    link.as = 'document';
    
    // Add to head
    document.head.appendChild(link);
  } catch (error: unknown) {
    // Log error in development, fail silently in production
    if (import.meta.env.DEV) {
      console.warn(`Failed to prefetch ${page}:`, error);
    }
  }
}

/**
 * Prefetch all configured pages
 * Called after fonts load to avoid blocking critical resources
 */
function prefetchPages(): void {
  PAGES_TO_PREFETCH.forEach((page) => {
    prefetchPage(page);
  });
}

/**
 * Initialize link prefetching
 * Sets up prefetching for configured pages and hover-based prefetching
 * 
 * Prefetching strategy:
 * 1. Wait for fonts to load (or use fallback timeout)
 * 2. Prefetch high-priority pages
 * 3. Prefetch pages on link hover (predictive prefetching)
 */
export function initLinkPrefetch(): void {
  // Safety check for browser environment
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  /**
   * Prefetch pages after fonts load
   * Uses Font Loading API if available, otherwise uses fallback timeout
   */
  const schedulePrefetch = (): void => {
    if (document.fonts?.ready) {
      document.fonts.ready
        .then(() => {
          setTimeout(prefetchPages, PREFETCH_DELAY_AFTER_FONTS);
        })
        .catch(() => {
          // Fallback if Font Loading API fails
          setTimeout(prefetchPages, PREFETCH_DELAY_FALLBACK);
        });
    } else {
      // Fallback if Font Loading API not available
      setTimeout(prefetchPages, PREFETCH_DELAY_FALLBACK);
    }
  };

  schedulePrefetch();

  /**
   * Prefetch on link hover (predictive prefetching)
   * Prefetches pages when user hovers over internal links
   * Uses passive event listener for better performance
   */
  document.addEventListener(
    'mouseover',
    (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      // Find closest link element
      const link = target.closest<HTMLAnchorElement>('a[href]');
      
      if (!link || !link.href) {
        return;
      }

      try {
        // Only prefetch same-origin links
        const linkUrl = new URL(link.href, window.location.origin);
        
        if (linkUrl.origin !== window.location.origin) {
          return;
        }

        // Prefetch HTML pages or pages without extensions
        const pathname = linkUrl.pathname;
        if (pathname.endsWith('.html') || !pathname.includes('.')) {
          prefetchPage(link.href);
        }
      } catch (error: unknown) {
        // Invalid URL, skip prefetching
        if (import.meta.env.DEV) {
          console.warn('Invalid link URL for prefetching:', link.href, error);
        }
      }
    },
    { passive: true } // Passive listener for better scroll performance
  );
}

